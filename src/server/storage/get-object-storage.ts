import "server-only";
import type { ObjectStorage } from "@/server/storage/object-storage";
import { S3ObjectStorage } from "@/server/storage/s3-object-storage";
import { loadStorageConfig } from "@/server/storage/storage-config";

let instance: ObjectStorage | null = null;

/**
 * 画像の保存先(ObjectStorage)を返す。
 * S3Client を使い回すためシングルトンにしている。
 * 環境変数の検証はimport時ではなく初回呼び出し時に行うので、ビルドやテストには影響しない。
 * (設定漏れ自体はサーバー起動時に instrumentation.ts で検知している)
 */
export function getObjectStorage(): ObjectStorage {
  if (instance) return instance;

  const config = loadStorageConfig();
  instance = new S3ObjectStorage({
    region: config.S3_REGION,
    bucket: config.S3_BUCKET,
    accessKeyId: config.S3_ACCESS_KEY_ID,
    secretAccessKey: config.S3_SECRET_ACCESS_KEY,
    publicBaseUrl: config.S3_PUBLIC_BASE_URL,
    endpoint: config.S3_ENDPOINT,
    publicEndpoint: config.S3_PUBLIC_ENDPOINT,
  });

  return instance;
}

/** テスト用。環境変数を変えて getObjectStorage の結果を確認するためにキャッシュを破棄する */
export function resetObjectStorageForTest(): void {
  instance = null;
}
