import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 홈 디렉토리에 다른 package-lock.json 이 있어 워크스페이스 루트를
  // 잘못 잡는 것을 방지 (이 프로젝트 폴더로 고정)
  turbopack: {
    root: import.meta.dirname,
  },
  // Electron 데스크톱 패키징용: .next/standalone 에 최소 server.js + node_modules 출력.
  // (Vercel 배포에는 영향 없음 — Vercel 은 자체 어댑터 사용)
  output: "standalone",
};

export default nextConfig;
