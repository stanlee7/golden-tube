// 영상(.mp4) 자동 제작 — 데스크톱 메인 프로세스에서 로컬 ffmpeg로 조립.
// 흐름: 대본 → /api/scenes(장면 분할) → 장면별 [AI 이미지 /api/image + 무료 TTS 나레이션 + 자막] → ffmpeg 이어붙이기
const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawn } = require("child_process");

// asar 안에 있으면 실행 불가하므로 unpacked 경로로 교정 (dev 에서는 no-op)
function unpacked(p) {
  return p ? p.replace("app.asar", "app.asar.unpacked") : p;
}
const ffmpegPath = unpacked(require("ffmpeg-static"));
const ffprobePath = unpacked(require("ffprobe-static").path);
const { EdgeTTS } = require("node-edge-tts");

const FONT = "C\\:/Windows/Fonts/malgun.ttf"; // 한글 자막용 (맑은 고딕)

/** ffmpeg 필터에서 안전하게 쓰도록 Windows 경로 escape */
function ffPath(p) {
  return p.replace(/\\/g, "/").replace(/:/g, "\\:");
}

/** 자막 줄바꿈 (어절 단위) */
function wrap(text, n) {
  const words = String(text).replace(/\n+/g, " ").split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > n) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines.join("\n");
}

async function postJSON(base, route, body) {
  const res = await fetch(`${base}${route}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `요청 오류 (${res.status})`);
  return data;
}

function run(bin, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(bin, args, { windowsHide: true });
    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("error", reject);
    p.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error("영상 처리 실패: " + err.slice(-400)))
    );
  });
}

function ffprobeDuration(file) {
  return new Promise((resolve) => {
    const p = spawn(
      ffprobePath,
      ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file],
      { windowsHide: true }
    );
    let out = "";
    p.stdout.on("data", (d) => (out += d.toString()));
    p.on("close", () => resolve(parseFloat(out.trim()) || 3));
    p.on("error", () => resolve(3));
  });
}

/**
 * 영상 제작. onProgress({pct, status}) 로 진행 보고. 완성된 .mp4 경로 반환.
 * opts: { base, engine, script, duration, topic, voice }
 */
async function render(opts, onProgress = () => {}) {
  const { base, engine, script, duration, topic, voice } = opts;
  const isShorts = duration === "shorts";
  const VW = isShorts ? 1080 : 1920;
  const VH = isShorts ? 1920 : 1080;
  const size = isShorts ? "1024x1536" : "1536x1024";
  const fontSize = isShorts ? 54 : 46;
  const wrapN = isShorts ? 16 : 30;
  const bottom = isShorts ? 240 : 90;

  const work = fs.mkdtempSync(path.join(os.tmpdir(), "gt-video-"));
  try {
    onProgress({ pct: 3, status: "대본을 장면으로 나누는 중…" });
    const { scenes } = await postJSON(base, "/api/scenes", { script, topic, engine });

    const clips = [];
    for (let i = 0; i < scenes.length; i++) {
      const sc = scenes[i];
      const p0 = 5 + Math.floor((i / scenes.length) * 82);
      onProgress({ pct: p0, status: `장면 ${i + 1}/${scenes.length} 그림 만드는 중…` });

      // 1) AI 이미지
      const { image } = await postJSON(base, "/api/image", {
        prompt: sc.imagePrompt,
        size,
        engine,
      });
      const imgPath = path.join(work, `img${i}.png`);
      fs.writeFileSync(imgPath, Buffer.from(image, "base64"));

      // 2) TTS 나레이션
      onProgress({ pct: p0 + 3, status: `장면 ${i + 1}/${scenes.length} 목소리 입히는 중…` });
      const mp3Path = path.join(work, `nar${i}.mp3`);
      const tts = new EdgeTTS({ voice: voice || "ko-KR-SunHiNeural", rate: "-8%" });
      await tts.ttsPromise(sc.narration, mp3Path);
      const dur = Math.max(2, await ffprobeDuration(mp3Path));

      // 3) 자막 텍스트 파일(한글 escape 회피)
      const capPath = path.join(work, `cap${i}.txt`);
      fs.writeFileSync(capPath, wrap(sc.narration, wrapN), "utf-8");

      // 4) 클립 = 이미지(켄번즈) + 나레이션 + 자막
      const clipPath = path.join(work, `clip${i}.mp4`);
      const frames = Math.ceil(dur * 25);
      const vf =
        `[0:v]scale=${VW}:${VH}:force_original_aspect_ratio=increase,crop=${VW}:${VH},` +
        `zoompan=z='min(zoom+0.0006,1.12)':d=${frames}:s=${VW}x${VH}:fps=25,setsar=1,` +
        `drawtext=fontfile='${FONT}':textfile='${ffPath(capPath)}':fontcolor=white:fontsize=${fontSize}:` +
        `line_spacing=10:box=1:boxcolor=black@0.55:boxborderw=22:x=(w-text_w)/2:y=h-text_h-${bottom}[v]`;
      await run(ffmpegPath, [
        "-y",
        "-loop", "1", "-i", imgPath,
        "-i", mp3Path,
        "-filter_complex", vf,
        "-map", "[v]", "-map", "1:a",
        "-t", String(dur),
        "-r", "25",
        "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "128k",
        "-shortest",
        clipPath,
      ]);
      clips.push(clipPath);
    }

    // 5) 이어붙이기
    onProgress({ pct: 92, status: "영상을 이어붙이는 중…" });
    const listPath = path.join(work, "list.txt");
    fs.writeFileSync(
      listPath,
      clips.map((c) => `file '${c.replace(/\\/g, "/")}'`).join("\n"),
      "utf-8"
    );
    const outDir = path.join(os.homedir(), "Videos", "황금튜브");
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `goldentube_${Date.now()}.mp4`);
    await run(ffmpegPath, [
      "-y", "-f", "concat", "-safe", "0", "-i", listPath,
      "-c", "copy", outPath,
    ]);

    onProgress({ pct: 100, status: "영상이 완성됐어요!" });
    return outPath;
  } finally {
    try {
      fs.rmSync(work, { recursive: true, force: true });
    } catch {
      // 청소 실패는 무시
    }
  }
}

module.exports = { render };
