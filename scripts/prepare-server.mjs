// next build(output: standalone) 산출물을 Electron 동봉용으로 조립한다.
// .next/standalone (+ .next/static + public) → build-resources/server
// Windows 장경로/심볼릭 링크에서 cpSync 가 크래시하므로 robocopy 로 견고하게 복사.
import { existsSync, rmSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const standalone = join(root, ".next", "standalone");
const out = join(root, "build-resources", "server");

if (!existsSync(standalone)) {
  console.error("[prepare-server] .next/standalone 이 없습니다. 먼저 'next build' 를 실행하세요.");
  process.exit(1);
}

rmSync(join(root, "build-resources"), { recursive: true, force: true });
mkdirSync(out, { recursive: true });

function copyTree(src, dst) {
  // robocopy 종료코드: 0~7 정상, 8+ 실패
  const r = spawnSync(
    "robocopy",
    [src, dst, "/E", "/NFL", "/NDL", "/NJH", "/NJS", "/NP", "/R:1", "/W:1"],
    { stdio: "ignore" }
  );
  const code = r.status ?? 16;
  if (code >= 8) {
    console.error(`[prepare-server] 복사 실패(robocopy ${code}): ${src}`);
    process.exit(1);
  }
}

// 1) standalone 전체 (server.js + 최소 node_modules + .next/server)
copyTree(standalone, out);
// 2) 정적 자산: standalone 은 .next/static, public 을 복사하지 않으므로 수동 복사
copyTree(join(root, ".next", "static"), join(out, ".next", "static"));
if (existsSync(join(root, "public"))) {
  copyTree(join(root, "public"), join(out, "public"));
}

console.log("[prepare-server] 완료 →", out);
