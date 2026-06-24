// dev 실행 헬퍼: VS Code 터미널의 ELECTRON_RUN_AS_NODE 모드를 우회하고 Electron을 띄운다.
const { spawn } = require("child_process");
const electron = require("electron");

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const child = spawn(electron, ["."], { stdio: "inherit", env });
child.on("close", (code) => process.exit(code ?? 0));
