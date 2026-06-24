// 무료 로컬 AI(Ollama + Gemma) 자동 준비 — 터미널 없이 버튼 하나로.
// 스탠리님의 검증된 setup_env.py 패턴을 Node 로 포팅:
//   설치확인 → (없으면 winget 설치) → OLLAMA_MODELS 를 ASCII 경로로 영구 고정
//   → 한글경로로 떠 있던 서버 종료 후 ASCII 경로로 재기동 → 모델 pull
const { spawn, execFile } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const OLLAMA_URL = "http://localhost:11434";
const DEFAULT_MODEL = "gemma3:4b-it-qat";
// 한글 계정 경로(C:\Users\<한글>\.ollama)면 모델 로딩이 실패하므로 ASCII 경로로 강제.
const ASCII_MODELS_DIR = "C:\\ProgramData\\GoldenTube\\models";
const NOWIN = { windowsHide: true };

function ollamaExe() {
  const cands = [
    path.join(process.env.LOCALAPPDATA || "", "Programs", "Ollama", "ollama.exe"),
    path.join(process.env.ProgramFiles || "", "Ollama", "ollama.exe"),
  ];
  for (const c of cands) if (c && fs.existsSync(c)) return c;
  return "ollama"; // PATH 에 있다고 가정
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve) => {
    execFile(cmd, args, { windowsHide: true, timeout: opts.timeout ?? 0 }, (err, stdout, stderr) => {
      resolve({ ok: !err, stdout: stdout || "", stderr: stderr || "" });
    });
  });
}

function isInstalled() {
  const exe = ollamaExe();
  return exe !== "ollama" || !!process.env.PATH; // 정확 확인은 serverReachable 로
}

async function serverReachable() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    return res.ok;
  } catch {
    return false;
  }
}

async function listModels() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || []).map((m) => m.name);
  } catch {
    return [];
  }
}

async function hasModel(model = DEFAULT_MODEL) {
  const family = model.split(":")[0];
  const models = await listModels();
  return models.some((n) => n === model || n.startsWith(family));
}

async function installViaWinget() {
  // 무인 설치. winget 이 없거나 실패해도 사용자 안내로 폴백.
  return run(
    "winget",
    ["install", "--id", "Ollama.Ollama", "-e", "--silent",
     "--accept-package-agreements", "--accept-source-agreements"],
    { timeout: 600000 }
  );
}

function ensureAsciiModelsEnv() {
  fs.mkdirSync(ASCII_MODELS_DIR, { recursive: true });
  process.env.OLLAMA_MODELS = ASCII_MODELS_DIR;
  // 다음 로그인부터 트레이 앱도 같은 경로를 쓰도록 영구 저장
  return run("setx", ["OLLAMA_MODELS", ASCII_MODELS_DIR], { timeout: 15000 });
}

async function restartServerAscii() {
  await ensureAsciiModelsEnv();
  // 트레이 앱이 한글 경로로 띄운 서버를 강제 종료
  await run("taskkill", ["/F", "/IM", "ollama.exe"], { timeout: 15000 });
  await run("taskkill", ["/F", "/IM", "ollama app.exe"], { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 1500));
  // ASCII 경로로 재기동 (detached)
  const child = spawn(ollamaExe(), ["serve"], {
    env: { ...process.env, OLLAMA_MODELS: ASCII_MODELS_DIR },
    detached: true,
    stdio: "ignore",
    windowsHide: true,
  });
  child.unref();
  // 기동 대기
  for (let i = 0; i < 20; i++) {
    if (await serverReachable()) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return await serverReachable();
}

async function status(model = DEFAULT_MODEL) {
  const running = await serverReachable();
  return {
    platform: os.platform(),
    installed: running || isInstalled(),
    running,
    model,
    hasModel: running ? await hasModel(model) : false,
    asciiDir: ASCII_MODELS_DIR,
  };
}

/** 설치~서버기동까지 한 번에 준비. onLog(msg) 로 진행 보고. */
async function setup(onLog = () => {}) {
  onLog("로컬 AI(Ollama) 설치 여부를 확인하고 있어요…");
  if (!(await serverReachable())) {
    if (os.platform() === "win32") {
      onLog("Ollama 를 설치하고 있어요 (몇 분 걸릴 수 있어요)…");
      const r = await installViaWinget();
      if (!r.ok) onLog("자동 설치가 어려우면 ollama.com 에서 직접 설치해 주세요.");
    }
  }
  onLog("한글 경로 문제를 피하도록 모델 폴더를 정리하고 서버를 켜는 중…");
  const up = await restartServerAscii();
  onLog(up ? "로컬 AI 서버가 켜졌어요." : "서버 기동을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.");
  return up;
}

/** 모델 다운로드(스트리밍). onProgress({percent, status}) 로 진행률 보고. */
async function pull(model = DEFAULT_MODEL, onProgress = () => {}) {
  await ensureAsciiModelsEnv();
  const res = await fetch(`${OLLAMA_URL}/api/pull`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, stream: true }),
  });
  if (!res.ok || !res.body) throw new Error(`모델 다운로드 시작 실패 (${res.status})`);

  const decoder = new TextDecoder();
  let buf = "";
  for await (const chunk of res.body) {
    buf += decoder.decode(chunk, { stream: true });
    let nl;
    while ((nl = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (!line) continue;
      try {
        const ev = JSON.parse(line);
        const pct =
          ev.total && ev.completed ? Math.floor((ev.completed / ev.total) * 100) : undefined;
        onProgress({ percent: pct, status: ev.status || "" });
        if (ev.error) throw new Error(ev.error);
      } catch {
        // 부분 라인 등은 무시
      }
    }
  }
  return await hasModel(model);
}

module.exports = {
  OLLAMA_URL,
  DEFAULT_MODEL,
  ASCII_MODELS_DIR,
  status,
  setup,
  pull,
  restartServerAscii,
  serverReachable,
};
