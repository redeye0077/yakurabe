import type { NextConfig } from "next";

// 本番でセッティング画像を保存する S3 バケット(公開読み取りは settings/* のみ)
const S3_BUCKET_PROD = "yakurabe-images-prod";
const S3_REGION_PROD = "ap-northeast-1";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    // 開発の画像(S3Mock)は最適化せず、ブラウザから直接読み込む。
    // 最適化はサーバー(app コンテナ)が画像を取得するが、コンテナ内からは
    // S3_PUBLIC_BASE_URL(http://localhost:9090/...)に届かず、Next.js も既定でローカル IP からの取得を拒否するため
    unoptimized: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: "https",
        hostname: `${S3_BUCKET_PROD}.s3.${S3_REGION_PROD}.amazonaws.com`,
        pathname: "/settings/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // 認証リンクのトークンがRefererで外部に漏れないようにする
        source: "/verify/:path*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
    ];
  },
};

export default nextConfig;
