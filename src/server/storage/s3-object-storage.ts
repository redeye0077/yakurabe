import "server-only";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import {
  INSPECT_BYTES,
  type CreatePresignedUploadInput,
  type ObjectInspection,
  type ObjectStorage,
  type PresignedUpload,
} from "@/server/storage/object-storage";

/** 署名付き POST の有効期限(秒) */
const PRESIGNED_UPLOAD_EXPIRES_SECONDS = 300;

/**
 * 「存在しない」として扱う HTTP ステータス。
 * IAM で s3:ListBucket を許可していないため、本番 S3 では存在しないキーも 404 ではなく 403 になる。
 * 416 は空のオブジェクトに Range を指定した場合で、中身を確認できないので同じ扱いにする。
 */
const NOT_INSPECTABLE_STATUSES = new Set([403, 404, 416]);

type S3ObjectStorageOptions = {
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** 表示用 URL の先頭部分(例: http://localhost:9090/yakurabe-dev) */
  publicBaseUrl: string;
  /** サーバーから操作するときの接続先(開発のみ)。未設定なら S3 の既定の接続先 */
  endpoint?: string;
  /** ブラウザに渡す署名付き URL の接続先(開発のみ)。未設定なら endpoint と同じ */
  publicEndpoint?: string;
};

/**
 * S3 への保存の実装。本番は S3、開発は S3Mock に向けて使う。
 * 署名は通信を伴わない計算で、署名付き URL のホストは S3Client の接続先で決まる。
 * そのため開発では、ブラウザ用(署名用)とサーバー用(操作用)の S3Client を分けている。
 */
export class S3ObjectStorage implements ObjectStorage {
  private readonly client: S3Client;
  private readonly presignClient: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor({
    region,
    bucket,
    accessKeyId,
    secretAccessKey,
    publicBaseUrl,
    endpoint,
    publicEndpoint,
  }: S3ObjectStorageOptions) {
    const createClient = (target: string | undefined) =>
      new S3Client({
        region,
        credentials: { accessKeyId, secretAccessKey },
        endpoint: target,
        // S3Mock はバケット名をホスト名に含める形式(virtual-hosted style)に対応しないため、
        // 接続先を指定したときだけパス形式にする
        forcePathStyle: target !== undefined,
      });

    this.client = createClient(endpoint);
    const presignEndpoint = publicEndpoint ?? endpoint;
    this.presignClient = presignEndpoint === endpoint ? this.client : createClient(presignEndpoint);
    this.bucket = bucket;
    // 末尾に / を付けて設定されても、URL が二重スラッシュにならないようにする
    this.publicBaseUrl = publicBaseUrl.replace(/\/+$/, "");
  }

  async createPresignedUpload({
    key,
    contentType,
    maxBytes,
  }: CreatePresignedUploadInput): Promise<PresignedUpload> {
    // 条件の検証は S3 が行う(S3Mock は検証しないため、保存時に inspect でも確認する)
    const { url, fields } = await createPresignedPost(this.presignClient, {
      Bucket: this.bucket,
      Key: key,
      Conditions: [
        ["content-length-range", 1, maxBytes],
        ["eq", "$Content-Type", contentType],
        ["eq", "$key", key],
      ],
      Fields: { "Content-Type": contentType },
      Expires: PRESIGNED_UPLOAD_EXPIRES_SECONDS,
    });
    return { url, fields };
  }

  async inspect(key: string): Promise<ObjectInspection | null> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Range: `bytes=0-${INSPECT_BYTES - 1}`,
        })
      );
      const bytes = (await response.Body?.transformToByteArray()) ?? new Uint8Array();
      // 206 なら ContentRange(例: "bytes 0-15/12345")の "/" の後ろが全体のサイズ。
      // Range が無視されて 200 で全体が返った場合は ContentLength が全体のサイズ
      const size = parseTotalSize(response.ContentRange) ?? response.ContentLength;
      if (size === undefined) {
        throw new Error(`オブジェクトのサイズを取得できませんでした: ${key}`);
      }
      return {
        contentType: response.ContentType,
        size,
        firstBytes: bytes.slice(0, INSPECT_BYTES),
      };
    } catch (error) {
      const status = error instanceof S3ServiceException ? error.$metadata.httpStatusCode : undefined;
      if (status !== undefined && NOT_INSPECTABLE_STATUSES.has(status)) {
        // 403 は「存在しない」以外に IAM ポリシーの設定ミスでも返るため、気づけるようにログを残す
        if (status === 403) {
          console.warn("[storage] inspect で 403 を受けたため存在しないものとして扱います", {
            key,
            status,
          });
        }
        return null;
      }
      throw error;
    }
  }

  async put(key: string, body: Uint8Array, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: body, ContentType: contentType })
    );
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  publicUrl(key: string): string {
    // キーは settings/{userId}/{UUID}.{拡張子} の形に限っているため、エンコードは不要
    return `${this.publicBaseUrl}/${key.replace(/^\/+/, "")}`;
  }
}

/** Content-Range ヘッダー(例: "bytes 0-15/12345")から全体のサイズを取り出す */
export function parseTotalSize(contentRange: string | undefined): number | undefined {
  const match = contentRange?.match(/^bytes \d+-\d+\/(\d+)$/);
  return match ? Number(match[1]) : undefined;
}
