This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 機能一覧

- **セッティング画像のアップロード**: セッティングの登録・編集で画像を1枚(任意)添付できる。JPEG / PNG / WebP・5MB まで。ブラウザからサーバーを経由せず、署名付き POST で S3 へ直接アップロードする。保存前にサーバーが S3 上の実物(サイズ・形式・先頭バイト)を確認する。編集では新しい画像を選ぶと差し替わり、成功後に古い画像を削除する。セッティングを削除すると画像も削除する

## 技術スタック

| 分類 | 技術 |
|---|---|
| 画像ストレージ | Amazon S3(`@aws-sdk/client-s3`・`@aws-sdk/s3-presigned-post` による署名付き POST で直接アップロード) |

## 開発環境

### 画像ストレージ(S3Mock)

開発環境では S3 の代わりに S3Mock(`adobe/s3mock`)を使う。`docker compose up` で app・MySQL と一緒に起動し、バケット `yakurabe-dev` は起動時に作成される。

- 接続先: `http://127.0.0.1:9090`(ホストからのみ接続できる)
- 画像の URL: `http://localhost:9090/yakurabe-dev/<キー>`
- データは名前付きボリューム `s3mock_data` に残る

環境変数(app の値は `docker-compose.yml` で S3Mock 向けに設定済み。説明は `.env.example` を参照):

| 変数 | 内容 |
|---|---|
| `S3_REGION` | リージョン(本番は `ap-northeast-1`) |
| `S3_BUCKET` | バケット名(開発は `yakurabe-dev`) |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | 画像保存専用 IAM ユーザーのアクセスキー(SES 用の `AWS_*` とは別。開発はダミー) |
| `S3_PUBLIC_BASE_URL` | 画像の表示用 URL の先頭部分(末尾の `/` は無し) |
| `S3_ENDPOINT` | **開発専用。** サーバーから S3Mock への接続先(コンテナ内では `http://s3mock:9090`)。本番は設定しない |
| `S3_PUBLIC_ENDPOINT` | **開発専用。** ブラウザに渡す署名付き POST の接続先(`http://localhost:9090`)。本番は設定しない |

`S3_*` が不足・不正な場合はサーバーの起動時にエラーで止まる。

## 今後の改善

- **管理者用の商品登録画面**: 現在、商品マスタ(バレル/シャフト/フライト/チップ)は Seed スクリプトでのみ登録している。運営が画面から商品を追加・編集できる管理者用の画面を用意する
- **バレルとチップのねじ規格の整合チェック**: ねじ規格(2BA / No.5 / 4BA / OTO)が違うバレルとチップは組み合わせられない。ソフトバレルの約95%が2BAのため MVP では見送ったが、Barrel にねじ規格を持たせ、セッティング登録時に整合をチェックする
- **商品画像の用意**: 商品マスタの Seed の `imageUrl` は現在 `https://example.com/...` のダミー。セッティング画像は S3 に保存し、`next.config.ts` の `images.remotePatterns` に本番バケットのホスト(`/settings/**`)を追加済み。商品画像も実際の画像に差し替え、保存先に合わせて `remotePatterns` を追加する
- **保存されなかった画像の掃除**: アップロード後にセッティングが保存されなかった画像や、差し替え・削除の後片付け(S3 からの削除)に失敗した画像は S3 に残る。DB から参照されていない画像を定期実行で削除するか、S3 のライフサイクルルールで掃除する
- **署名付き URL の発行回数の制限**: 現在はログインユーザーなら何回でも発行できる。ユーザーごと・時間あたりの発行回数を制限する
- **画像の位置情報(EXIF)の除去**: アップロードした画像はそのまま保存・公開するため、撮影時の位置情報などが残る。保存時に EXIF を取り除く
- **画像を外す操作**: 編集では画像の差し替えのみで、画像を外して DartMark 表示に戻す操作は無い
- **CloudFront による配信**: 現在は S3 のオブジェクト URL をそのまま表示に使っている。CloudFront を前に置き、キャッシュ・配信元の制限(バケットの公開読み取りをやめる)を行う
- **開発環境での画像の制限の確認**: 開発環境の S3Mock は署名やアップロード条件(サイズ・形式)を検証しないため、サイズ・形式の制限が S3 側で効くことは本番の S3 でのみ確認できる。条件を検証できる開発用の仕組みを検討する
