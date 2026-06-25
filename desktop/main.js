// 황금튜브 데스크톱(Electron) 메인 프로세스
// dev: next dev(localhost:3000) 로드
// prod: 동봉한 Next.js standalone 서버(server.js)를 메인 프로세스에서 직접 구동 후 로드
const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path");

let ollama;
try {
  ollama = require("./ollama");
} catch {
  ollama = null;
}

let video;
try {
  video = require("./video");
} catch {
  video = null;
}

const isDev = !app.isPackaged;
const DEV_URL = "http://localhost:3000";
const PROD_PORT = 38520;
// 127.0.0.1 로 고정 (localhost 가 Windows 에서 IPv6 ::1 로 풀려 서버(127.0.0.1)와 어긋나는 문제 방지)
const PROD_HOST = "127.0.0.1";
const PROD_URL = `http://${PROD_HOST}:${PROD_PORT}`;

function createWindow(url) {
  const win = new BrowserWindow({
    width: 1100,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: "황금튜브",
    backgroundColor: "#ffffff",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.webContents.setWindowOpenHandler(({ url: target }) => {
    if (/^https?:\/\//.test(target)) shell.openExternal(target);
    return { action: "deny" };
  });
  win.loadURL(url);
}

function startProdServer() {
  // extraResources 로 resources/server 에 Next standalone 이 들어간다.
  // 자식 프로세스(ELECTRON_RUN_AS_NODE) 대신 메인에서 직접 require → fuse/환경 의존성 제거.
  const serverJs = path.join(process.resourcesPath, "server", "server.js");
  process.env.PORT = String(PROD_PORT);
  process.env.HOSTNAME = PROD_HOST;
  process.env.NODE_ENV = "production";
  require(serverJs); // server.js 가 내부에서 chdir + listen 수행
}

async function waitForServer(url, tries = 80) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // 아직 안 떠 있음
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function registerIpc() {
  ipcMain.handle("ollama:status", () =>
    ollama ? ollama.status() : { running: false, hasModel: false, model: "" }
  );
  ipcMain.handle("ollama:setup", (e) =>
    ollama ? ollama.setup((msg) => e.sender.send("ollama:log", msg)) : false
  );
  ipcMain.handle("ollama:pull", (e) =>
    ollama ? ollama.pull(undefined, (p) => e.sender.send("ollama:progress", p)) : false
  );

  // 영상 제작
  ipcMain.handle("video:render", async (e, args) => {
    if (!video) throw new Error("영상 제작 기능을 불러오지 못했어요.");
    const base = isDev ? DEV_URL : PROD_URL;
    const outPath = await video.render({ ...args, base }, (p) =>
      e.sender.send("video:progress", p)
    );
    return outPath;
  });
  ipcMain.handle("video:reveal", (_e, filePath) => {
    if (filePath) shell.showItemInFolder(filePath);
  });
}

app.whenReady().then(async () => {
  registerIpc();
  if (isDev) {
    createWindow(DEV_URL);
  } else {
    startProdServer();
    await waitForServer(PROD_URL);
    createWindow(PROD_URL);
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(isDev ? DEV_URL : PROD_URL);
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
