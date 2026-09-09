# CLAUDE.md

このファイルはClaude Codeがこのリポジトリで作業する際に必ず参照するプロジェクトルールです。
コードを書く前に必ずこの内容に従ってください。

## プロジェクト概要

矢比べ(Yakurabe): ダーツの「セッティング」(バレル/シャフト/フライト/チップの組み合わせ)を
ユーザー同士で共有・閲覧できるWebアプリ。

主な機能:
- セッティングの一覧・キーワード検索・詳細閲覧
- セッティングの新規登録・削除(バレル/シャフト/フライト/チップを選択、重量・価格は自動計算、画像1枚必須、特徴・使用感必須、アピールポイント単一選択・必須)
- セッティング詳細画面内での商品情報表示(モーダル/アコーディオンで展開。独立した商品詳細ページ・商品一覧ページは無い。購入ボタン(`hiveUrl`)はこのモーダル/アコーディオン内に実装する)
- マイページ(自分の投稿一覧のみ)

### MVPスコープ外(Phase 2以降に対応予定)

以下は初回リリースでは実装しない。関連コードを勝手に実装しないこと。
MVPの期日(paizaBランク対策と並行するための開発期間短縮)を優先するための一時的な除外であり、
リリース後に時間の余裕ができた場合や転職活動期間中に、ポートフォリオの見せ場として追加実装する
可能性がある。ただし現時点では着手しない。

- 評価・レビュー(星評価)機能 ※UI上の星評価・レビュー件数表示も含めて実装しない(schemaにratingAvg/ratingCountは無い)
- OAuthログイン(Google/Apple) ※メール+パスワードのみ対応
- フォロー/フォロワー機能
- お気に入り機能 ※Favoriteテーブル自体を作らない。マイページにお気に入り一覧タブも無い
- セッティングの編集機能 ※新規登録・削除のみ実装する。間違えた場合は削除して再登録する運用とする
- プロフィール編集機能 ※新規登録時に入力した情報を表示するのみで、変更UIは実装しない
- `RecommendedLevel`(おすすめレベル) ※Enum自体を作らない。`Tag`(アピールポイント)のみで表現する
- 複数画像アップロード ※1商品/1セッティングにつき画像1枚のみ(必須)
- 詳細な絞り込み検索(重量・価格帯・メーカー等) ※キーワード検索のみ
- 商品(バレル/シャフト/フライト/チップ)の独立した詳細ページ・一覧ページ ※商品情報はセッティング詳細画面内のモーダル/アコーディオンで表示する。`/products/[id]`のような専用ルートは作らない
- 「この商品を使った他のセッティング一覧」機能 ※商品detailページが無いため、その遷移先も無し。将来的に商品ページを復活させる場合に合わせて検討する
- パスワードリセット機能 ※メール送信基盤(SES等)が必要になるため一旦保留

## 技術スタック

| 分類 | 技術 |
|---|---|
| フレームワーク | Next.js (App Router, API Routes) |
| UI | React, Tailwind CSS, shadcn/ui |
| 状態管理(クライアント) | Zustand |
| フォーム | React Hook Form + Zod |
| データフェッチ | TanStack Query (React Query) |
| DB | MySQL |
| ORM | Prisma |
| 認証 | NextAuth.js (Credentials Provider、メール+パスワードのみ。MVPではOAuthは未対応) |

## アーキテクチャ: レイヤードアーキテクチャ

サーバーサイドは以下の3層に分離する。**層を飛び越えた呼び出しは禁止**
(例: ControllerからRepositoryを直接呼ばない)。

```
Controller (API Route)
    ↓ 呼び出す
Service (ビジネスロジック)
    ↓ 呼び出す
Repository (Prismaを直接操作するのはここだけ)
```

### 各層の責務

- **Controller** (`src/app/api/**/route.ts`)
  - リクエストのパース、バリデーション結果の受け取り、レスポンス整形(status code含む)のみ担当
  - ビジネスロジックを書かない。Serviceを呼び出すだけ
  - 例外をキャッチしてHTTPステータスに変換する

- **Service** (`src/server/services/*.service.ts`)
  - ビジネスロジック本体(例: セッティング登録時の合計重量・合計価格の計算)
  - 複数のRepositoryを組み合わせる処理はここに書く
  - Prisma Clientを直接importしない。必ずRepository経由でデータアクセスする

- **Repository** (`src/server/repositories/*.repository.ts`)
  - Prisma Clientを直接操作するのはこの層のみ
  - 単純なCRUDメソッドを提供する(findById, findMany, create, update, delete等)
  - ビジネスロジックを書かない

### ディレクトリ構成

```
src/
  app/
    (public)/                   # 認証不要ページ (トップ, 一覧, 詳細など)
    (auth)/                     # 認証関連ページ (ログイン, 新規登録)
    mypage/                     # マイページ配下
    api/
      barrels/route.ts           # Controller(検索付きセレクト用の一覧取得のみ)
      shafts/route.ts
      flights/route.ts
      tips/route.ts
      settings/route.ts
      settings/[id]/route.ts
      ...
  server/
    controllers/                # Controllerロジックを分離する場合はここに置き、
                                 # route.tsからは呼び出すだけにする
    services/
      barrel.service.ts
      shaft.service.ts
      flight.service.ts
      tip.service.ts
      setting.service.ts
      user.service.ts
    repositories/
      barrel.repository.ts
      shaft.repository.ts
      flight.repository.ts
      tip.repository.ts
      setting.repository.ts
      user.repository.ts
    dto/                        # Service/Controller間でやり取りする型定義
  components/
    ui/                         # shadcn生成コンポーネント(基本編集しない)
    common/                     # 汎用コンポーネント(Header, Footer, Pagination等)
    features/
      setting/                  # セッティング関連コンポーネント
      product/                  # 商品情報モーダル/アコーディオン(独立ページ用ではない)
      user/
  hooks/                        # カスタムフック (React Query hooksなど)
    queries/
      useSettings.ts
      useProducts.ts
    mutations/
      useCreateSetting.ts
  stores/                       # Zustandストア(本当にグローバル状態が必要な場合のみ)
  schemas/                      # Zodスキーマ (フォームバリデーション、API入出力の両方で使う)
  lib/
    prisma.ts                   # PrismaClientのシングルトン
    utils.ts
  types/
prisma/
  schema.prisma
  seed.ts
```

## 命名規則

- ファイル名: kebab-case (例: `setting-card.tsx`)、ただしコンポーネント本体はPascalCaseでexport
- Service/Repositoryのクラス(または関数群): `対象名 + Service` / `対象名 + Repository`
  (例: `SettingService`, `SettingRepository`)
- Zodスキーマ: `対象名 + Schema` (例: `createSettingSchema`)
- React Queryのquery key: 配列形式で階層化する (例: `['settings', 'list', filters]`, `['settings', 'detail', id]`)

## コーディング規約

- TypeScriptの`any`禁止。型が不明な場合は`unknown`にして絞り込む
- APIのレスポンス型・リクエスト型はZodスキーマから`z.infer`で生成し、フロントとサーバーで型を再利用する
- Prismaのモデル型をそのままフロントに返さない。Serviceで必要なフィールドのみのDTOに変換してから返す
- 日付は基本的にISO文字列でやり取りする
- エラーハンドリング:
  - Repository層: Prismaのエラーはそのままthrowしてよい
  - Service層: ビジネスルール違反は独自のエラークラス(例: `NotFoundError`, `ValidationError`)をthrowする
  - Controller層: 独自エラークラスをcatchしてHTTPステータスにマッピングする
- セッティング登録フォームでのバレル/シャフト/フライト/チップ選択は、単純な`<select>`
  (プルダウン)ではなく、名前で絞り込める検索付きセレクト(shadcnの`Command` +
  `Popover`によるComboboxパターン)を使うこと。初期表示(未入力時)は候補を出さず空の状態
  にする。候補が0件の場合は「該当する商品が見つかりません」とだけ表示し、商品追加の
  リクエスト機能や他の代替手段は用意しない(商品はマスタデータとして運営側でのみ追加する)
- 「アピールポイント」(`Setting.tag`)は自由記述の入力欄にせず、`Tag` Enum
  の値から選ぶプルダウン(`<Select>`)にすること。表記ゆれ防止のため必須項目とする

## 実装時の進め方(重要)

1. 新しい機能を追加するときは、既存の`barrel.repository.ts` / `barrel.service.ts` /
   `src/app/api/barrels/route.ts` のパターンを踏襲すること。独自の構成を勝手に作らない
2. Prismaスキーマを変更する場合は、変更内容を先に提示してから
   `npx prisma migrate dev --name <変更内容>` を実行すること。人間の確認なしに勝手に
   マイグレーションを実行しない
3. 大きめの機能(例: セッティング登録フォーム全体)を実装する前に、まず実装方針(関わる
   ファイル一覧、データフロー)を箇条書きで提示し、確認を取ってから実装に入ること
4. 1つのタスクは1機能・1画面単位程度に留める。複数機能にまたがる大規模な変更を一度に
   行わない

## コマンド

```bash
npm run dev              # 開発サーバー起動
npm run build             # ビルド
npx prisma migrate dev    # マイグレーション実行(開発環境)
npx prisma studio         # DBをGUIで確認
npx prisma db seed        # シードデータ投入
npm run lint               # ESLint
npm run typecheck          # tsc --noEmit
```

## やってはいけないこと

- Controller層でPrisma Clientを直接importする
- Service層のロジックが薄いからといってRepositoryを飛ばしてController→Prismaを直接呼ぶ
- shadcnの`components/ui`配下のファイルを直接改変する(必要ならラップする別コンポーネントを作る)
- 確認なしにPrismaスキーマのフィールド削除・型変更を含むマイグレーションを実行する
