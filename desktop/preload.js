// 렌더러(웹앱)에 데스크톱 기능을 안전하게 노출.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("goldentube", {
  isElectron: true,
  platform: process.platform,

  // 무료 로컬 AI(Ollama) 준비
  ollamaStatus: () => ipcRenderer.invoke("ollama:status"),
  ollamaSetup: () => ipcRenderer.invoke("ollama:setup"),
  ollamaPull: () => ipcRenderer.invoke("ollama:pull"),

  onOllamaLog: (cb) => {
    const h = (_e, msg) => cb(msg);
    ipcRenderer.on("ollama:log", h);
    return () => ipcRenderer.removeListener("ollama:log", h);
  },
  onOllamaProgress: (cb) => {
    const h = (_e, p) => cb(p);
    ipcRenderer.on("ollama:progress", h);
    return () => ipcRenderer.removeListener("ollama:progress", h);
  },

  // 영상(.mp4) 제작
  renderVideo: (args) => ipcRenderer.invoke("video:render", args),
  revealVideo: (filePath) => ipcRenderer.invoke("video:reveal", filePath),
  pickBgm: () => ipcRenderer.invoke("video:pickBgm"),
  onVideoProgress: (cb) => {
    const h = (_e, p) => cb(p);
    ipcRenderer.on("video:progress", h);
    return () => ipcRenderer.removeListener("video:progress", h);
  },
});
