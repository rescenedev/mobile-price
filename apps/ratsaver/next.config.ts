import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 모노레포 루트 오탐 방지 — app 디렉토리를 트레이싱 루트로 고정
  outputFileTracingRoot: __dirname,
  experimental: {
    // 배럴/아이콘 패키지 per-export 트리셰이크 — 라우트 First Load gz 축소.
    optimizePackageImports: [
      'lucide-react',
      'sonner',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-scroll-area',
    ],
  },
};

export default nextConfig;

// Cloudflare Pages(next-on-pages): 개발 중 wrangler.toml 바인딩을 getRequestContext로 노출.
// next dev 시에만 동작(빌드/배포 경로엔 영향 없음).
if (process.env.NODE_ENV === 'development') {
  void (async () => {
    const { setupDevPlatform } = await import('@cloudflare/next-on-pages/next-dev');
    await setupDevPlatform();
  })();
}
