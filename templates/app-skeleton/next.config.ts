import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 모노레포 루트 오탐 방지 — app-skeleton 디렉토리를 트레이싱 루트로 고정
  outputFileTracingRoot: __dirname,
};

export default nextConfig;

// OpenNext Cloudflare: 개발 중 바인딩을 getCloudflareContext로 노출
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';
initOpenNextCloudflareForDev();
