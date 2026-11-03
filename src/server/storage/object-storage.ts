import "server-only";

/** ブラウザから S3 に直接アップロードするための署名付き POST の情報 */
export type PresignedUpload = {
  /** POST 先の URL */
  url: string;
  /** multipart/form-data に file より前に入れるフィールド(key・Content-Type・policy・署名など) */
  fields: Record<string, string>;
};

export type CreatePresignedUploadInput = {
  key: string;
  contentType: string;
  /** 許可する最大バイト数(最小は 1 バイト) */
  maxBytes: number;
};

/** 保存時の確認用に、オブジェクトの先頭だけを読んだ結果 */
export type ObjectInspection = {
  /** アップロード時に申告された Content-Type */
  contentType: string | undefined;
  /** オブジェクト全体のバイト数 */
  size: number;
  /** 先頭のバイト列(最大 INSPECT_BYTES バイト。オブジェクトがそれより小さければその長さ) */
  firstBytes: Uint8Array;
};

/** inspect で読む先頭のバイト数。画像形式の判定(WebP で 12 バイト)に足りる長さにしている */
export const INSPECT_BYTES = 16;

/**
 * 画像の保存先の抽象。Service層はこの型だけに依存し、
 * S3(本番) / S3Mock(開発) のどちらに保存するかは意識しない。
 */
export interface ObjectStorage {
  /** key・Content-Type・サイズの条件を付けた署名付き POST を発行する */
  createPresignedUpload(input: CreatePresignedUploadInput): Promise<PresignedUpload>;

  /**
   * オブジェクトの先頭 INSPECT_BYTES バイトを1回の取得で読み、Content-Type と全体のサイズと合わせて返す。
   * 存在しない(403/404)、または中身が空で読めない場合は null を返す。
   * 403 は IAM の設定ミスでも返るため、そのときだけ console.warn にキーとステータスを出す。
   */
  inspect(key: string): Promise<ObjectInspection | null>;

  /**
   * サーバーからオブジェクトを保存する(Seed 専用。画面からのアップロードは署名付き POST を使う)。
   * 同じキーがあれば上書きする
   */
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;

  /** オブジェクトを削除する。存在しなくてもエラーにはならない */
  delete(key: string): Promise<void>;

  /** 画面に表示するための公開 URL を返す(通信はしない) */
  publicUrl(key: string): string;
}
