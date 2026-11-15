import type { UpsertSettingInput } from "@/server/repositories/setting.repository";
import { SAMPLE_USER_IDS } from "./sample-users";

// サンプル画像は AI で生成したため、画像ありのセッティングだけ説明文の末尾にその旨を足す
export const AI_IMAGE_NOTE = "画像はAIで生成したイメージで、実際の商品とは色や形が異なります。";

// 画像はファイル名(prisma/seed-images/ 配下)と固定の UUID で指定する。画像なしは null。
// 保存先キーは settings/{持ち主の userId}/{uuid}.{拡張子} になり、Seed を再実行しても同じキーに上書きされる
// (写真は UUID を変えずにファイルだけ差し替える)。拡張子はファイルの中身の形式で決まる
export type SampleSetting = Omit<UpsertSettingInput, "imageKey" | "description"> & {
  id: string;
  description: string;
  image: { fileName: string; uuid: string } | null;
};

// DB に保存する説明文。画像ありなら末尾に AI_IMAGE_NOTE を足す(合わせて 191 字以内)
export function buildSampleDescription({ description, image }: Pick<SampleSetting, "description" | "image">): string {
  return image ? `${description}${AI_IMAGE_NOTE}` : description;
}

const { takkun, misakichi, youchan, ponzu, yuuto } = SAMPLE_USER_IDS;

// 一覧が空にならないよう表示するサンプル(60件)。
// - シャフトとフライトは規格(flightSystem)をそろえ、一体型フライトの場合はシャフトを null にする
// - バレルの形状は parts.ts の各バレルのコメントを参照
// - 検索の確認用に「ストレート」「トルピード」「グリップ」「朝練」はタイトルにだけ書き、説明文には書かない
// - 使用感は主観的な感想にとどめ、商品のスペックの数値は書かない
// - createdAt は古い日付にして、実際の投稿より後ろ(新着順の末尾)に並ぶようにする
export const sampleSettings: SampleSetting[] = [
  {
    id: "sample-setting-01",
    userId: takkun,
    title: "【サンプル】フィット規格でそろえた安定重視セッティング",
    description:
      "シャフトとフライトをフィット規格でそろえ、スピンシャフトで飛びを安定させる組み合わせ。",
    image: { fileName: "sample-setting-01.jpeg", uuid: "e366b9dd-7066-4adf-9a14-0e14f4518877" },
    barrelId: "seed-barrel-01", // DISCOVERY LABEL Jeff Smith 2BA
    shaftId: "seed-shaft-02", // Fit Shaft COLOR Carbon ノーマル スピン 24.0mm
    flightId: "seed-flight-03", // Fit Flight AIR × Ami Komiyama ver.4
    tipId: "seed-tip-03", // FIT POINT PLUS 2.0 2BA 60本
    level: "BEGINNER",
    createdAt: new Date("2026-09-26T20:00:00+09:00"),
  },
  {
    id: "sample-setting-02",
    userId: takkun,
    title: "【サンプル】L-style でそろえたストレートセッティング",
    description:
      "シャフトとフライトを汎用規格の L-style でそろえた組み合わせ。細身のシャフトで、狙ったところへすっと入っていく感覚があります。",
    image: { fileName: "sample-setting-02.jpeg", uuid: "9879bc90-5448-4bfc-8d3f-ce394217b367" },
    barrelId: "seed-barrel-03", // KATANA Houju 2BA
    shaftId: "seed-shaft-01", // L-SHaft Carbon ロック スリム 37.0mm
    flightId: "seed-flight-01", // L-Flight PRO DYNASTY Sachika ver.1 スモール
    tipId: "seed-tip-01", // Premium Lip point 2BA 30本
    level: "ADVANCED",
    createdAt: new Date("2026-09-27T21:30:00+09:00"),
  },
  {
    id: "sample-setting-03",
    userId: misakichi,
    title: "【サンプル】シャフト一体型フライトのセッティング",
    description: "シャフト一体型フライトを使うため、シャフトは選んでいません。",
    image: { fileName: "sample-setting-03.jpeg", uuid: "22e2ca7a-1c8e-4333-8942-21bbc1b377a9" },
    barrelId: "seed-barrel-04", // Mao ver.5 2BA 18g Cherry Red
    shaftId: null,
    flightId: "seed-flight-02", // GAME OVER K-FLEX スタンダード ブラック 26.0mm(一体型)
    tipId: "seed-tip-05", // CRYO TIP 2BA 30本
    level: "INTERMEDIATE",
    createdAt: new Date("2026-09-28T12:10:00+09:00"),
  },
  {
    id: "sample-setting-04",
    userId: youchan,
    title: "【サンプル】8FLIGHT でそろえたコスパ重視セッティング",
    description:
      "シャフトとフライトをエイト規格でそろえ、消耗品を手頃な価格に抑えた組み合わせ。",
    image: { fileName: "sample-setting-04.jpeg", uuid: "7a095f98-c00c-4788-a0c8-7a08d55f66d8" },
    barrelId: "seed-barrel-05", // Undisputed ROMERO Type4 2BA
    shaftId: "seed-shaft-04", // 8FLIGHT シャフト レギュラー FIXED ホワイト 29.5mm
    flightId: "seed-flight-04", // 8FLIGHT スリム
    tipId: "seed-tip-04", // TIP ULTIMATE 2BA 40本
    level: null,
    createdAt: new Date("2026-09-29T22:45:00+09:00"),
  },
  {
    id: "sample-setting-05",
    userId: ponzu,
    title: "【サンプル】初めてのマイダーツはストレートで",
    description:
      "ショップで勧められて最初に買った一本です。癖が少なく、どこを持っても投げやすいので、フォームを作る段階の自分には合っていました。",
    image: { fileName: "sample-setting-05.jpeg", uuid: "c24a1d0a-fcea-493d-a324-15e2c7e69fa9" },
    barrelId: "seed-barrel-02", // ASTRA DARTS DRAGOON4 2BA
    shaftId: "seed-shaft-03", // PRO GRIP SHAFT ブラック 19.5mm
    flightId: "seed-flight-01", // L-Flight PRO DYNASTY Sachika ver.1 スモール
    tipId: "seed-tip-02", // Short Lippoint 2BA 50本
    level: "BEGINNER",
    createdAt: new Date("2026-09-30T19:20:00+09:00"),
  },
  {
    id: "sample-setting-06",
    userId: yuuto,
    title: "【サンプル】トルピードで手元を安定させたい人へ",
    description:
      "手元に重さが寄っている感じがあり、狙いを付けるときに腕がぶれにくいです。少し強めに投げても素直に飛んでくれます。",
    image: { fileName: "sample-setting-06.jpeg", uuid: "358bcf2b-f77b-487b-8ac5-0eb84f2be7fe" },
    barrelId: "seed-barrel-05", // Undisputed ROMERO Type4 2BA
    shaftId: "seed-shaft-05", // Fit Shaft GEAR ハイブリッド ロック クリア 24.0mm
    flightId: "seed-flight-05", // Fit Flight AIR × 鎌田恋 ver.2 ティアドロップ クリア
    tipId: "seed-tip-03", // FIT POINT PLUS 2.0 2BA 60本
    level: "INTERMEDIATE",
    createdAt: new Date("2026-10-01T23:05:00+09:00"),
  },
  {
    id: "sample-setting-07",
    userId: takkun,
    title: "【サンプル】力まず投げられるグリップ重視の構成",
    description:
      "指の置き場所に迷わず、毎回同じ持ち方ができるのが気に入っています。肩の力を抜いても狙ったところに届きやすいです。",
    image: { fileName: "sample-setting-07.jpeg", uuid: "372a5bfd-7206-4e7e-958b-bc3c4ab56db1" },
    barrelId: "seed-barrel-03", // KATANA Houju 2BA
    shaftId: "seed-shaft-05", // Fit Shaft GEAR ハイブリッド ロック クリア 24.0mm
    flightId: "seed-flight-03", // Fit Flight AIR × Ami Komiyama ver.4
    tipId: "seed-tip-04", // TIP ULTIMATE 2BA 40本
    level: "BEGINNER",
    createdAt: new Date("2026-10-02T18:40:00+09:00"),
  },
  {
    id: "sample-setting-08",
    userId: misakichi,
    title: "【サンプル】迷いなく押し出せるストレート",
    description:
      "リリースの瞬間に前へ押し出す投げ方と相性がよく、狙いに向かってまっすぐ進む感覚があります。長めのシャフトで飛びが落ち着きます。",
    image: { fileName: "sample-setting-08.jpeg", uuid: "5847e676-e21a-4049-9a85-b5549c8c3fba" },
    barrelId: "seed-barrel-01", // DISCOVERY LABEL Jeff Smith 2BA
    shaftId: "seed-shaft-01", // L-SHaft Carbon ロック スリム 37.0mm
    flightId: "seed-flight-01", // L-Flight PRO DYNASTY Sachika ver.1 スモール
    tipId: "seed-tip-05", // CRYO TIP 2BA 30本
    level: "ADVANCED",
    createdAt: new Date("2026-10-03T21:15:00+09:00"),
  },
  {
    id: "sample-setting-09",
    userId: youchan,
    title: "【サンプル】トルピードに替えて落ち着いた一本",
    description:
      "ずっと細身のバレルを使っていましたが、持ち替えてから手元が落ち着きました。スピンシャフトのおかげか、矢がぶつかっても弾かれにくい印象です。",
    image: { fileName: "sample-setting-09.jpeg", uuid: "3a4e7d70-cb0a-46ab-9bd6-c21bb973c254" },
    barrelId: "seed-barrel-04", // Mao ver.5 2BA 18g Cherry Red
    shaftId: "seed-shaft-02", // Fit Shaft COLOR Carbon ノーマル スピン 24.0mm
    flightId: "seed-flight-03", // Fit Flight AIR × Ami Komiyama ver.4
    tipId: "seed-tip-01", // Premium Lip point 2BA 30本
    level: "INTERMEDIATE",
    createdAt: new Date("2026-10-04T13:30:00+09:00"),
  },
  {
    id: "sample-setting-10",
    userId: ponzu,
    title: "【サンプル】軽快な飛びが好みのセッティング",
    description:
      "すっと前に出ていく軽い飛びが好みで組んだセッティングです。エイトのシャフトとフライトは交換しやすく、気軽に試せます。",
    image: null,
    barrelId: "seed-barrel-02", // ASTRA DARTS DRAGOON4 2BA
    shaftId: "seed-shaft-04", // 8FLIGHT シャフト レギュラー FIXED ホワイト 29.5mm
    flightId: "seed-flight-04", // 8FLIGHT スリム
    tipId: "seed-tip-02", // Short Lippoint 2BA 50本
    level: null,
    createdAt: new Date("2026-10-05T20:50:00+09:00"),
  },
  {
    id: "sample-setting-11",
    userId: takkun,
    title: "【サンプル】一体型フライトで調整いらず",
    description:
      "シャフト一体型フライトなので、フライトが抜けたりシャフトが緩んだりする心配がほとんどありません。練習中に手を止めずに済みます。",
    image: { fileName: "sample-setting-11.jpeg", uuid: "e6f72f49-692f-48ce-877e-9f92b089a89c" },
    barrelId: "seed-barrel-05", // Undisputed ROMERO Type4 2BA
    shaftId: null,
    flightId: "seed-flight-02", // GAME OVER K-FLEX スタンダード ブラック 26.0mm(一体型)
    tipId: "seed-tip-03", // FIT POINT PLUS 2.0 2BA 60本
    level: "INTERMEDIATE",
    createdAt: new Date("2026-10-06T22:00:00+09:00"),
  },
  {
    id: "sample-setting-12",
    userId: misakichi,
    title: "【サンプル】ストレートで基本フォームを固める",
    description:
      "持つ位置を毎回そろえやすく、基本のフォームを固める練習に向いていると感じます。シャフトとフライトは安く替えられるものにしました。",
    image: { fileName: "sample-setting-12.jpeg", uuid: "9bcbc288-0bd3-4954-9d31-6350109dc063" },
    barrelId: "seed-barrel-03", // KATANA Houju 2BA
    shaftId: "seed-shaft-03", // PRO GRIP SHAFT ブラック 19.5mm
    flightId: "seed-flight-01", // L-Flight PRO DYNASTY Sachika ver.1 スモール
    tipId: "seed-tip-04", // TIP ULTIMATE 2BA 40本
    level: "BEGINNER",
    createdAt: new Date("2026-10-07T19:35:00+09:00"),
  },
  {
    id: "sample-setting-13",
    userId: youchan,
    title: "【サンプル】試合用に組んだ勝負セッティング",
    description:
      "大会で使うために組んだセッティングです。ティアドロップのフライトで飛びが安定し、緊張した場面でも狙いを信じて投げられます。",
    image: { fileName: "sample-setting-13.jpeg", uuid: "90b25116-f008-4aeb-b610-3f91a3d3842d" },
    barrelId: "seed-barrel-01", // DISCOVERY LABEL Jeff Smith 2BA
    shaftId: "seed-shaft-02", // Fit Shaft COLOR Carbon ノーマル スピン 24.0mm
    flightId: "seed-flight-05", // Fit Flight AIR × 鎌田恋 ver.2 ティアドロップ クリア
    tipId: "seed-tip-01", // Premium Lip point 2BA 30本
    level: "ADVANCED",
    createdAt: new Date("2026-10-08T21:10:00+09:00"),
  },
  {
    id: "sample-setting-14",
    userId: yuuto,
    title: "【サンプル】コスパ重視で始める入門セッティング",
    description:
      "始めたばかりなので、まずは手頃な消耗品でそろえました。フライトやシャフトを壊しても気軽に買い直せるのがありがたいです。",
    image: null,
    barrelId: "seed-barrel-04", // Mao ver.5 2BA 18g Cherry Red
    shaftId: "seed-shaft-04", // 8FLIGHT シャフト レギュラー FIXED ホワイト 29.5mm
    flightId: "seed-flight-04", // 8FLIGHT スリム
    tipId: "seed-tip-05", // CRYO TIP 2BA 30本
    level: "BEGINNER",
    createdAt: new Date("2026-10-09T12:45:00+09:00"),
  },
  {
    id: "sample-setting-15",
    userId: takkun,
    title: "【サンプル】投げ比べて決めた本命セッティング",
    description:
      "いくつものバレルを投げ比べて、最後まで残ったのがこれでした。手になじむ感覚があり、狙ったところへ迷わず投げられます。",
    image: { fileName: "sample-setting-15.jpeg", uuid: "88a87678-7440-4ca3-b931-62cc773bc1c3" },
    barrelId: "seed-barrel-02", // ASTRA DARTS DRAGOON4 2BA
    shaftId: "seed-shaft-05", // Fit Shaft GEAR ハイブリッド ロック クリア 24.0mm
    flightId: "seed-flight-03", // Fit Flight AIR × Ami Komiyama ver.4
    tipId: "seed-tip-02", // Short Lippoint 2BA 50本
    level: "ADVANCED",
    createdAt: new Date("2026-10-10T23:20:00+09:00"),
  },
  {
    id: "sample-setting-16",
    userId: misakichi,
    title: "【サンプル】グリップ位置が決まりやすい組み合わせ",
    description:
      "指をかける場所がはっきりしているので、毎回同じ持ち方で投げられます。細身のシャフトとの組み合わせで、飛びも落ち着いています。",
    image: { fileName: "sample-setting-16.jpeg", uuid: "2e298591-9471-41d9-a162-1163f726926b" },
    barrelId: "seed-barrel-05", // Undisputed ROMERO Type4 2BA
    shaftId: "seed-shaft-01", // L-SHaft Carbon ロック スリム 37.0mm
    flightId: "seed-flight-01", // L-Flight PRO DYNASTY Sachika ver.1 スモール
    tipId: "seed-tip-04", // TIP ULTIMATE 2BA 40本
    level: "INTERMEDIATE",
    createdAt: new Date("2026-10-11T18:05:00+09:00"),
  },
  {
    id: "sample-setting-17",
    userId: ponzu,
    title: "【サンプル】朝練用に組んだ軽快セッティング",
    description:
      "起きてすぐの固い体でも力まずに投げられるので、出勤前の短い練習に使っています。軽快に飛んでいく感覚が気持ちいいです。",
    image: { fileName: "sample-setting-17.jpeg", uuid: "28b12ed7-f26b-4ebc-8501-e751839554b2" },
    barrelId: "seed-barrel-01", // DISCOVERY LABEL Jeff Smith 2BA
    shaftId: "seed-shaft-05", // Fit Shaft GEAR ハイブリッド ロック クリア 24.0mm
    flightId: "seed-flight-05", // Fit Flight AIR × 鎌田恋 ver.2 ティアドロップ クリア
    tipId: "seed-tip-03", // FIT POINT PLUS 2.0 2BA 60本
    level: "INTERMEDIATE",
    createdAt: new Date("2026-10-12T07:30:00+09:00"),
  },
  {
    id: "sample-setting-18",
    userId: youchan,
    title: "【サンプル】一体型で手軽に始めるセッティング",
    description:
      "シャフトとフライトの組み合わせに悩まなくて済むので、一体型を選びました。始めたばかりでも扱いやすいと思います。",
    image: { fileName: "sample-setting-18.jpeg", uuid: "03fd2489-f414-478f-b59d-6b092c2517a1" },
    barrelId: "seed-barrel-03", // KATANA Houju 2BA
    shaftId: null,
    flightId: "seed-flight-02", // GAME OVER K-FLEX スタンダード ブラック 26.0mm(一体型)
    tipId: "seed-tip-05", // CRYO TIP 2BA 30本
    level: "BEGINNER",
    createdAt: new Date("2026-10-13T20:25:00+09:00"),
  },
  {
    id: "sample-setting-19",
    userId: takkun,
    title: "【サンプル】トルピードで飛びを安定させる",
    description:
      "手元に重さがまとまっていて、リリースが多少ずれても飛びが大きく乱れにくいです。フィット規格のフライトは付け外しも楽です。",
    image: { fileName: "sample-setting-19.jpeg", uuid: "3a441287-0452-4d7d-87d2-664105623584" },
    barrelId: "seed-barrel-04", // Mao ver.5 2BA 18g Cherry Red
    shaftId: "seed-shaft-05", // Fit Shaft GEAR ハイブリッド ロック クリア 24.0mm
    flightId: "seed-flight-03", // Fit Flight AIR × Ami Komiyama ver.4
    tipId: "seed-tip-01", // Premium Lip point 2BA 30本
    level: null,
    createdAt: new Date("2026-10-14T22:40:00+09:00"),
  },
  {
    id: "sample-setting-20",
    userId: yuuto,
    title: "【サンプル】ストレートで狙いを絞る上級者仕様",
    description:
      "狙いを細かく絞りたいときに使っています。癖のない形なので、自分の投げ方がそのまま矢に出る感覚があります。",
    image: { fileName: "sample-setting-20.jpeg", uuid: "237d1952-87eb-498b-ba16-3c26c156416b" },
    barrelId: "seed-barrel-02", // ASTRA DARTS DRAGOON4 2BA
    shaftId: "seed-shaft-02", // Fit Shaft COLOR Carbon ノーマル スピン 24.0mm
    flightId: "seed-flight-03", // Fit Flight AIR × Ami Komiyama ver.4
    tipId: "seed-tip-02", // Short Lippoint 2BA 50本
    level: "ADVANCED",
    createdAt: new Date("2026-10-15T21:00:00+09:00"),
  },
  {
    id: "sample-setting-21",
    userId: misakichi,
    title: "【サンプル】投げやすさ優先の練習用",
    description:
      "とにかく投げやすさを優先して選んだ練習用です。消耗品は手頃なものにして、本数を気にせずたくさん投げられるようにしています。",
    image: null,
    barrelId: "seed-barrel-05", // Undisputed ROMERO Type4 2BA
    shaftId: "seed-shaft-03", // PRO GRIP SHAFT ブラック 19.5mm
    flightId: "seed-flight-01", // L-Flight PRO DYNASTY Sachika ver.1 スモール
    tipId: "seed-tip-03", // FIT POINT PLUS 2.0 2BA 60本
    level: "BEGINNER",
    createdAt: new Date("2026-10-16T19:15:00+09:00"),
  },
  {
    id: "sample-setting-22",
    userId: youchan,
    title: "【サンプル】エイト規格で統一した普段使い",
    description:
      "シャフトとフライトをエイト規格で統一した普段使いのセッティングです。フライトが外れにくく、練習のテンポが崩れません。",
    image: { fileName: "sample-setting-22.jpeg", uuid: "b76f5d6e-0ee3-443a-960b-81af540d4261" },
    barrelId: "seed-barrel-01", // DISCOVERY LABEL Jeff Smith 2BA
    shaftId: "seed-shaft-04", // 8FLIGHT シャフト レギュラー FIXED ホワイト 29.5mm
    flightId: "seed-flight-04", // 8FLIGHT スリム
    tipId: "seed-tip-04", // TIP ULTIMATE 2BA 40本
    level: "INTERMEDIATE",
    createdAt: new Date("2026-10-17T13:50:00+09:00"),
  },
  {
    id: "sample-setting-23",
    userId: takkun,
    title: "【サンプル】トルピードで攻める大会用",
    description:
      "大会で強気に攻めたいときの一本です。重さが前にまとまっていて、力を込めても矢がぶれにくいと感じます。",
    image: { fileName: "sample-setting-23.jpeg", uuid: "056fbbfb-8f4f-49f2-acaf-d9b4d4642bbe" },
    barrelId: "seed-barrel-04", // Mao ver.5 2BA 18g Cherry Red
    shaftId: "seed-shaft-02", // Fit Shaft COLOR Carbon ノーマル スピン 24.0mm
    flightId: "seed-flight-05", // Fit Flight AIR × 鎌田恋 ver.2 ティアドロップ クリア
    tipId: "seed-tip-05", // CRYO TIP 2BA 30本
    level: "ADVANCED",
    createdAt: new Date("2026-10-18T23:35:00+09:00"),
  },
  {
    id: "sample-setting-24",
    userId: ponzu,
    title: "【サンプル】力を抜いて投げたい人向け",
    description:
      "力を抜いてもきれいに飛んでくれるので、腕に力が入りがちな人に合うと思います。ティアドロップのフライトは見た目も気に入っています。",
    image: { fileName: "sample-setting-24.jpeg", uuid: "356cbc99-4c49-403f-8d8d-13c42ccd6852" },
    barrelId: "seed-barrel-03", // KATANA Houju 2BA
    shaftId: "seed-shaft-05", // Fit Shaft GEAR ハイブリッド ロック クリア 24.0mm
    flightId: "seed-flight-05", // Fit Flight AIR × 鎌田恋 ver.2 ティアドロップ クリア
    tipId: "seed-tip-01", // Premium Lip point 2BA 30本
    level: "BEGINNER",
    createdAt: new Date("2026-10-19T18:30:00+09:00"),
  },
  {
    id: "sample-setting-25",
    userId: misakichi,
    title: "【サンプル】一体型フライトで気軽に",
    description:
      "シャフト一体型フライトで、組み立てに迷わず気軽に投げられます。フライトの交換がシャフトごとで済むのも楽です。",
    image: null,
    barrelId: "seed-barrel-02", // ASTRA DARTS DRAGOON4 2BA
    shaftId: null,
    flightId: "seed-flight-02", // GAME OVER K-FLEX スタンダード ブラック 26.0mm(一体型)
    tipId: "seed-tip-02", // Short Lippoint 2BA 50本
    level: null,
    createdAt: new Date("2026-10-20T20:10:00+09:00"),
  },
  {
    id: "sample-setting-26",
    userId: yuuto,
    title: "【サンプル】細かく狙えるストレート",
    description:
      "細かい狙いを付けやすく、ブルの中でも狙う位置を意識して投げられます。シャフトとフライトは汎用規格で手に入れやすいものにしました。",
    image: { fileName: "sample-setting-26.jpeg", uuid: "e50660af-03b0-4743-aed6-9fd760ef65c0" },
    barrelId: "seed-barrel-01", // DISCOVERY LABEL Jeff Smith 2BA
    shaftId: "seed-shaft-03", // PRO GRIP SHAFT ブラック 19.5mm
    flightId: "seed-flight-01", // L-Flight PRO DYNASTY Sachika ver.1 スモール
    tipId: "seed-tip-05", // CRYO TIP 2BA 30本
    level: "INTERMEDIATE",
    createdAt: new Date("2026-10-21T21:45:00+09:00"),
  },
  {
    id: "sample-setting-27",
    userId: takkun,
    title: "【サンプル】指に吸い付くグリップ感",
    description:
      "指に吸い付くような感覚があり、すべりにくいので安心して投げられます。スピンシャフトとの組み合わせで、矢同士も当たりにくい印象です。",
    image: { fileName: "sample-setting-27.jpeg", uuid: "6cacac8c-812d-4ded-bf04-af7b87616c1e" },
    barrelId: "seed-barrel-05", // Undisputed ROMERO Type4 2BA
    shaftId: "seed-shaft-02", // Fit Shaft COLOR Carbon ノーマル スピン 24.0mm
    flightId: "seed-flight-03", // Fit Flight AIR × Ami Komiyama ver.4
    tipId: "seed-tip-04", // TIP ULTIMATE 2BA 40本
    level: "BEGINNER",
    createdAt: new Date("2026-10-22T19:55:00+09:00"),
  },
  {
    id: "sample-setting-28",
    userId: youchan,
    title: "【サンプル】長く使っている相棒セッティング",
    description:
      "長く使っている相棒のようなセッティングです。手になじんでいて、調子が悪い日もこれを持てば感覚を取り戻せます。",
    image: { fileName: "sample-setting-28.jpeg", uuid: "0aad6039-5421-42ff-862f-f15646fbe7e4" },
    barrelId: "seed-barrel-03", // KATANA Houju 2BA
    shaftId: "seed-shaft-05", // Fit Shaft GEAR ハイブリッド ロック クリア 24.0mm
    flightId: "seed-flight-03", // Fit Flight AIR × Ami Komiyama ver.4
    tipId: "seed-tip-03", // FIT POINT PLUS 2.0 2BA 60本
    level: "ADVANCED",
    createdAt: new Date("2026-10-23T22:20:00+09:00"),
  },
  {
    id: "sample-setting-29",
    userId: misakichi,
    title: "【サンプル】安定した飛びを求めた組み合わせ",
    description:
      "安定した飛びを求めて組んだセッティングです。細身のシャフトと小さめのフライトで、矢がすっと狙いに入っていきます。",
    image: { fileName: "sample-setting-29.jpeg", uuid: "775ecf49-4cf4-4fea-b552-fa6fc52c4d7e" },
    barrelId: "seed-barrel-04", // Mao ver.5 2BA 18g Cherry Red
    shaftId: "seed-shaft-01", // L-SHaft Carbon ロック スリム 37.0mm
    flightId: "seed-flight-01", // L-Flight PRO DYNASTY Sachika ver.1 スモール
    tipId: "seed-tip-01", // Premium Lip point 2BA 30本
    level: "INTERMEDIATE",
    createdAt: new Date("2026-10-24T12:30:00+09:00"),
  },
  {
    id: "sample-setting-30",
    userId: ponzu,
    title: "【サンプル】気分を変えたいときの控えセッティング",
    description:
      "気分を変えたいときに使う控えのセッティングです。いつもと違う感触で投げると、フォームの崩れに気づけることがあります。",
    image: { fileName: "sample-setting-30.jpeg", uuid: "86976a73-5f61-4192-b27b-462a52832da4" },
    barrelId: "seed-barrel-02", // ASTRA DARTS DRAGOON4 2BA
    shaftId: "seed-shaft-02", // Fit Shaft COLOR Carbon ノーマル スピン 24.0mm
    flightId: "seed-flight-05", // Fit Flight AIR × 鎌田恋 ver.2 ティアドロップ クリア
    tipId: "seed-tip-02", // Short Lippoint 2BA 50本
    level: null,
    createdAt: new Date("2026-10-25T21:05:00+09:00"),
  },
  {
    id: "sample-setting-31",
    userId: takkun,
    title: "【サンプル】砲弾型で前に重さを感じるセッティング",
    description:
      "前のほうに重さがまとまっている砲弾型で、軽く投げても矢が前に進んでいく感覚があります。フィット規格のスピンシャフトとティアドロップのフライトで、飛びも安定しています。",
    image: null,
    barrelId: "seed-barrel-12", // TRIPLEIGHT TRUE BLUE2 2BA 鈴木さつき選手モデル
    shaftId: "seed-shaft-02", // Fit Shaft COLOR Carbon ノーマル スピン 24.0mm
    flightId: "seed-flight-05", // Fit Flight AIR × 鎌田恋 ver.2 ティアドロップ クリア
    tipId: "seed-tip-05", // CRYO TIP 2BA 30本
    level: "INTERMEDIATE",
    createdAt: new Date("2026-08-27T20:00:00+09:00"),
  },
  {
    id: "sample-setting-32",
    userId: misakichi,
    title: "【サンプル】ブラスバレルで気軽に始める練習用",
    description:
      "始めたばかりなので、まずは手頃なブラスのバレルを選びました。シャフト一体型のフライトなので、組み合わせに迷わず投げ始められます。",
    image: { fileName: "sample-setting-32.jpeg", uuid: "ef125750-93ca-4f06-a73d-19c61f3fad4d" },
    barrelId: "seed-barrel-06", // ZONE BRASS mHz-2 2BA グリーン
    shaftId: null,
    flightId: "seed-flight-02", // GAME OVER K-FLEX スタンダード ブラック 26.0mm(一体型)
    tipId: "seed-tip-01", // Premium Lip point 2BA 30本
    level: "BEGINNER",
    createdAt: new Date("2026-08-28T21:15:00+09:00"),
  },
  {
    id: "sample-setting-33",
    userId: youchan,
    title: "【サンプル】くぼみに指が収まるグリップ重視の一本",
    description:
      "持つところが丸くくぼんでいて、指を置く位置が自然と決まります。ずっと持ち方に迷っていましたが、これに替えてから投げるたびの感覚がそろってきました。",
    image: { fileName: "sample-setting-33.jpeg", uuid: "ab277ee0-f58e-4af7-a2e6-ea9471701961" },
    barrelId: "seed-barrel-13", // UNITE SHRIKE 2BA
    shaftId: "seed-shaft-03", // PRO GRIP SHAFT ブラック 19.5mm
    flightId: "seed-flight-07", // MIRARCH×L-Flight PRO MAIKA MORIMOTO ver.1 シェイプ ディープパープル
    tipId: "seed-tip-04", // TIP ULTIMATE 2BA 40本
    level: "INTERMEDIATE",
    createdAt: new Date("2026-08-29T12:40:00+09:00"),
  },
  {
    id: "sample-setting-34",
    userId: ponzu,
    title: "【サンプル】一体型のシェイプフライトを試すセッティング",
    description:
      "一体型フライトのシェイプ形状が気になって組んでみました。いつものセッティングと投げ比べると、飛び方の違いがよくわかっておもしろいです。",
    image: null,
    barrelId: "seed-barrel-04", // Mao ver.5 2BA 18g Cherry Red
    shaftId: null,
    flightId: "seed-flight-09", // K-FLEX JAPAN LIMITED EDITION 2026 シェイプ ブルー 26.0mm(一体型)
    tipId: "seed-tip-03", // FIT POINT PLUS 2.0 2BA 60本
    level: null,
    createdAt: new Date("2026-08-30T22:10:00+09:00"),
  },
  {
    id: "sample-setting-35",
    userId: yuuto,
    title: "【サンプル】トルピードで狙いを一点に絞る",
    description:
      "手元に重さがまとまっていて、狙う一点に意識を集めやすいです。フィット規格のシャフトとフライトでそろえたので、飛びのばらつきも少なく感じます。",
    image: { fileName: "sample-setting-35.jpeg", uuid: "ec58ce8a-1a4e-4755-80fe-873eb792aa91" },
    barrelId: "seed-barrel-05", // Undisputed ROMERO Type4 2BA
    shaftId: "seed-shaft-05", // Fit Shaft GEAR ハイブリッド ロック クリア 24.0mm
    flightId: "seed-flight-03", // Fit Flight AIR × Ami Komiyama ver.4
    tipId: "seed-tip-05", // CRYO TIP 2BA 30本
    level: "INTERMEDIATE",
    createdAt: new Date("2026-08-31T19:30:00+09:00"),
  },
  {
    id: "sample-setting-36",
    userId: youchan,
    title: "【サンプル】汎用規格でまとめた練習用セッティング",
    description:
      "練習用に、手に入れやすい汎用規格のシャフトとフライトでまとめました。小さめのフライトで矢が詰まっても入りやすく、同じところを続けて狙う練習に向いています。",
    image: { fileName: "sample-setting-36.jpeg", uuid: "d8f17de3-7d66-4afd-96f7-dc1ce5aeb589" },
    barrelId: "seed-barrel-01", // DISCOVERY LABEL Jeff Smith 2BA
    shaftId: "seed-shaft-03", // PRO GRIP SHAFT ブラック 19.5mm
    flightId: "seed-flight-01", // L-Flight PRO DYNASTY Sachika ver.1 スモール
    tipId: "seed-tip-04", // TIP ULTIMATE 2BA 40本
    level: "INTERMEDIATE",
    createdAt: new Date("2026-09-01T13:05:00+09:00"),
  },
  {
    id: "sample-setting-37",
    userId: yuuto,
    title: "【サンプル】短めのバレルを投げ比べ中のセッティング",
    description:
      "短めのバレルを試したくて組んだセッティングです。L-style のシャフトとフライトでそろえたので、バレルの違いだけを比べやすいです。",
    image: { fileName: "sample-setting-37.jpeg", uuid: "d4cb3f90-c7e8-47c6-bb99-2857b2b4e9ee" },
    barrelId: "seed-barrel-09", // ENDEAVOUR G3 2BA 佐藤かす美選手モデル
    shaftId: "seed-shaft-01", // L-SHaft Carbon ロック スリム 37.0mm
    flightId: "seed-flight-06", // L-Flight EZ ディンプル Xiaochen Zong ver.3 スタンダード MIX
    tipId: "seed-tip-02", // Short Lippoint 2BA 50本
    level: null,
    createdAt: new Date("2026-09-02T21:45:00+09:00"),
  },
  {
    id: "sample-setting-38",
    userId: takkun,
    title: "【サンプル】トルピードとスリムフライトで攻める構成",
    description:
      "重めのバレルにスリムのフライトを合わせ、矢速を落とさずに攻められるようにしました。エイトのシャフトとフライトにしてから、試合中にフライトが外れて慌てることがなくなりました。",
    image: { fileName: "sample-setting-38.jpeg", uuid: "fbd6e870-43ad-471d-bfe0-5dd648907549" },
    barrelId: "seed-barrel-11", // A-FLOW OBSIDIAN LINE Coral 2BA 21g 阿嘉紗香選手モデル
    shaftId: "seed-shaft-04", // 8FLIGHT シャフト レギュラー FIXED ホワイト 29.5mm
    flightId: "seed-flight-04", // 8FLIGHT スリム
    tipId: "seed-tip-05", // CRYO TIP 2BA 30本
    level: "ADVANCED",
    createdAt: new Date("2026-09-03T20:20:00+09:00"),
  },
  {
    id: "sample-setting-39",
    userId: misakichi,
    title: "【サンプル】スタンダードフライトで飛びを落ち着かせる",
    description:
      "フライトを大きめのスタンダード形状にして、飛びを落ち着かせた組み合わせです。汎用規格のシャフトは手に入れやすく、折れてもすぐ買い直せます。",
    image: { fileName: "sample-setting-39.jpeg", uuid: "020c83c9-95e6-4690-9763-492da3fe6713" },
    barrelId: "seed-barrel-02", // ASTRA DARTS DRAGOON4 2BA
    shaftId: "seed-shaft-03", // PRO GRIP SHAFT ブラック 19.5mm
    flightId: "seed-flight-06", // L-Flight EZ ディンプル Xiaochen Zong ver.3 スタンダード MIX
    tipId: "seed-tip-04", // TIP ULTIMATE 2BA 40本
    level: "INTERMEDIATE",
    createdAt: new Date("2026-09-04T12:15:00+09:00"),
  },
  {
    id: "sample-setting-40",
    userId: ponzu,
    title: "【サンプル】手頃な価格で選んだ二本目のバレル",
    description:
      "最初の一本に慣れてきたので、手頃なものから二本目を選びました。一本目とは持ったときの感触が違い、投げ比べるのを楽しんでいます。",
    image: { fileName: "sample-setting-40.jpeg", uuid: "3d114b04-517e-4566-a4d5-8a7c4f61a1b3" },
    barrelId: "seed-barrel-07", // Raise Bシリーズ GR 2BA
    shaftId: "seed-shaft-03", // PRO GRIP SHAFT ブラック 19.5mm
    flightId: "seed-flight-01", // L-Flight PRO DYNASTY Sachika ver.1 スモール
    tipId: "seed-tip-01", // Premium Lip point 2BA 30本
    level: "BEGINNER",
    createdAt: new Date("2026-09-05T22:30:00+09:00"),
  },
  {
    id: "sample-setting-41",
    userId: misakichi,
    title: "【サンプル】フィット規格でシャフト長を詰めた試合用",
    description:
      "試合用に、シャフトの長さを少しずつ替えて合うところを探しました。フィット規格に替えてからは、投げるたびの飛びの差が小さくなったと感じます。",
    image: { fileName: "sample-setting-41.jpeg", uuid: "225298d4-dced-4b4c-85e8-4872e67297a6" },
    barrelId: "seed-barrel-05", // Undisputed ROMERO Type4 2BA
    shaftId: "seed-shaft-05", // Fit Shaft GEAR ハイブリッド ロック クリア 24.0mm
    flightId: "seed-flight-08", // Fit Flight AIR スタンダード グリーン 無地
    tipId: "seed-tip-03", // FIT POINT PLUS 2.0 2BA 60本
    level: "ADVANCED",
    createdAt: new Date("2026-09-06T19:50:00+09:00"),
  },
  {
    id: "sample-setting-42",
    userId: ponzu,
    title: "【サンプル】仕事帰りの練習に使う普段使いセッティング",
    description:
      "仕事帰りに少しだけ投げるときの普段使いです。細身のシャフトとスタンダードのフライトで、疲れていても素直に飛んでくれます。",
    image: null,
    barrelId: "seed-barrel-03", // KATANA Houju 2BA
    shaftId: "seed-shaft-01", // L-SHaft Carbon ロック スリム 37.0mm
    flightId: "seed-flight-06", // L-Flight EZ ディンプル Xiaochen Zong ver.3 スタンダード MIX
    tipId: "seed-tip-05", // CRYO TIP 2BA 30本
    level: "INTERMEDIATE",
    createdAt: new Date("2026-09-07T13:35:00+09:00"),
  },
  {
    id: "sample-setting-43",
    userId: yuuto,
    title: "【サンプル】重めのバレルに一体型フライトを合わせた構成",
    description:
      "重めのバレルで、狙いを細かく絞りたいときに使っています。一体型フライトにしてから、シャフトの緩みを気にせず狙いに集中できるようになりました。",
    image: { fileName: "sample-setting-43.jpeg", uuid: "5cb4c2fd-9bb6-4c1e-85fd-d1b90419b494" },
    barrelId: "seed-barrel-08", // SIRIUS G4 21g JAPAN 2025 CONSTRUCTORS CHAMPION 2BA 林雄太選手モデル
    shaftId: null,
    flightId: "seed-flight-02", // GAME OVER K-FLEX スタンダード ブラック 26.0mm(一体型)
    tipId: "seed-tip-02", // Short Lippoint 2BA 50本
    level: "ADVANCED",
    createdAt: new Date("2026-09-08T21:05:00+09:00"),
  },
  {
    id: "sample-setting-44",
    userId: takkun,
    title: "【サンプル】丸いくぼみで持ちやすいグリップ感",
    description:
      "すべりにくく、指が毎回同じ位置に収まるので安心して投げられます。肩の力を抜いても狙いがぶれにくく、長く投げていても疲れにくいです。",
    image: { fileName: "sample-setting-44.jpeg", uuid: "b8cede09-f6b1-417d-9efe-c9b2ecb96c86" },
    barrelId: "seed-barrel-13", // UNITE SHRIKE 2BA
    shaftId: "seed-shaft-01", // L-SHaft Carbon ロック スリム 37.0mm
    flightId: "seed-flight-06", // L-Flight EZ ディンプル Xiaochen Zong ver.3 スタンダード MIX
    tipId: "seed-tip-04", // TIP ULTIMATE 2BA 40本
    level: null,
    createdAt: new Date("2026-09-09T20:40:00+09:00"),
  },
  {
    id: "sample-setting-45",
    userId: youchan,
    title: "【サンプル】ストレートで始めやすいセッティング",
    description:
      "始めたばかりの頃に、癖の少ない形で選んだ一本です。一体型フライトなのでシャフトとの組み合わせに悩まず、投げることに集中できます。",
    image: { fileName: "sample-setting-45.jpeg", uuid: "f7a3ec06-e219-49c3-a7e9-e4231c83a4e5" },
    barrelId: "seed-barrel-07", // Raise Bシリーズ GR 2BA
    shaftId: null,
    flightId: "seed-flight-09", // K-FLEX JAPAN LIMITED EDITION 2026 シェイプ ブルー 26.0mm(一体型)
    tipId: "seed-tip-05", // CRYO TIP 2BA 30本
    level: "BEGINNER",
    createdAt: new Date("2026-09-10T12:55:00+09:00"),
  },
  {
    id: "sample-setting-46",
    userId: yuuto,
    title: "【サンプル】重めのストレートをフィット規格で組み直す",
    description:
      "前は一体型フライトで使っていたバレルを、フィット規格のシャフトとフライトで組み直しました。シャフトの長さを選べるので、自分の投げ方に合わせて細かく調整できます。",
    image: { fileName: "sample-setting-46.jpeg", uuid: "26b8c8cd-7cb5-4599-b115-d0e4c8bf800a" },
    barrelId: "seed-barrel-08", // SIRIUS G4 21g JAPAN 2025 CONSTRUCTORS CHAMPION 2BA 林雄太選手モデル
    shaftId: "seed-shaft-05", // Fit Shaft GEAR ハイブリッド ロック クリア 24.0mm
    flightId: "seed-flight-08", // Fit Flight AIR スタンダード グリーン 無地
    tipId: "seed-tip-02", // Short Lippoint 2BA 50本
    level: "ADVANCED",
    createdAt: new Date("2026-09-11T22:20:00+09:00"),
  },
  {
    id: "sample-setting-47",
    userId: takkun,
    title: "【サンプル】短いトルピードで始める入門セッティング",
    description:
      "始めたばかりで、短めのバレルのほうが持ちやすく感じました。手元に重さがあるので、力を入れなくても前に飛んでいってくれます。",
    image: { fileName: "sample-setting-47.jpeg", uuid: "9c1a44c6-c3a2-4ae0-b1db-b4ce17e67af6" },
    barrelId: "seed-barrel-10", // A-FLOW SILVER LINE EARTH TURQUOISE 2BA
    shaftId: "seed-shaft-03", // PRO GRIP SHAFT ブラック 19.5mm
    flightId: "seed-flight-07", // MIRARCH×L-Flight PRO MAIKA MORIMOTO ver.1 シェイプ ディープパープル
    tipId: "seed-tip-01", // Premium Lip point 2BA 30本
    level: "BEGINNER",
    createdAt: new Date("2026-09-12T19:10:00+09:00"),
  },
  {
    id: "sample-setting-48",
    userId: ponzu,
    title: "【サンプル】一体型シェイプで飛びの軌道を整える",
    description:
      "シェイプ形状の一体型フライトに替えて、飛ぶときの軌道を整えました。シャフト部分の長さが違うものを試して、いちばん安定したものを使っています。",
    image: { fileName: "sample-setting-48.jpeg", uuid: "ec652f32-8482-4808-8b77-c9993045f4fa" },
    barrelId: "seed-barrel-09", // ENDEAVOUR G3 2BA 佐藤かす美選手モデル
    shaftId: null,
    flightId: "seed-flight-09", // K-FLEX JAPAN LIMITED EDITION 2026 シェイプ ブルー 26.0mm(一体型)
    tipId: "seed-tip-03", // FIT POINT PLUS 2.0 2BA 60本
    level: "ADVANCED",
    createdAt: new Date("2026-09-13T13:20:00+09:00"),
  },
  {
    id: "sample-setting-49",
    userId: youchan,
    title: "【サンプル】練習用の一本を試合用に組み直した構成",
    description:
      "練習で使っていたバレルを、シェイプのフライトに替えて試合用に組み直しました。フライトを替えただけで矢の入り方が変わり、細かい調整の大切さを感じています。",
    image: null,
    barrelId: "seed-barrel-01", // DISCOVERY LABEL Jeff Smith 2BA
    shaftId: "seed-shaft-03", // PRO GRIP SHAFT ブラック 19.5mm
    flightId: "seed-flight-07", // MIRARCH×L-Flight PRO MAIKA MORIMOTO ver.1 シェイプ ディープパープル
    tipId: "seed-tip-02", // Short Lippoint 2BA 50本
    level: "ADVANCED",
    createdAt: new Date("2026-09-14T21:30:00+09:00"),
  },
  {
    id: "sample-setting-50",
    userId: misakichi,
    title: "【サンプル】エイト規格のスリムで矢を詰めやすく",
    description:
      "スリムのフライトにして、矢が並んでも次の一本が入りやすくなりました。使ってみるとフライトが外れることがほとんどなく、練習のテンポも崩れません。",
    image: { fileName: "sample-setting-50.jpeg", uuid: "f67862c3-34cd-4a19-b740-b618918d61cc" },
    barrelId: "seed-barrel-04", // Mao ver.5 2BA 18g Cherry Red
    shaftId: "seed-shaft-04", // 8FLIGHT シャフト レギュラー FIXED ホワイト 29.5mm
    flightId: "seed-flight-04", // 8FLIGHT スリム
    tipId: "seed-tip-04", // TIP ULTIMATE 2BA 40本
    level: "INTERMEDIATE",
    createdAt: new Date("2026-09-15T20:05:00+09:00"),
  },
  {
    id: "sample-setting-51",
    userId: ponzu,
    title: "【サンプル】重めのバレルを細身のシャフトで整えた構成",
    description:
      "重めのバレルに細身のシャフトを合わせ、後ろが重くなりすぎないように整えました。シェイプのフライトとの組み合わせで、飛びの角度が安定しています。",
    image: { fileName: "sample-setting-51.jpeg", uuid: "76932537-2e7e-43ba-ab9d-e15f06065b48" },
    barrelId: "seed-barrel-08", // SIRIUS G4 21g JAPAN 2025 CONSTRUCTORS CHAMPION 2BA 林雄太選手モデル
    shaftId: "seed-shaft-01", // L-SHaft Carbon ロック スリム 37.0mm
    flightId: "seed-flight-07", // MIRARCH×L-Flight PRO MAIKA MORIMOTO ver.1 シェイプ ディープパープル
    tipId: "seed-tip-02", // Short Lippoint 2BA 50本
    level: "ADVANCED",
    createdAt: new Date("2026-09-16T12:30:00+09:00"),
  },
  {
    id: "sample-setting-52",
    userId: youchan,
    title: "【サンプル】トルピードで手元を安定させる入門用",
    description:
      "始めたばかりで手元がぶれやすかったので、重さが手元に寄った形を選びました。フィット規格のフライトは付け外しが楽で、扱いに迷いません。",
    image: { fileName: "sample-setting-52.jpeg", uuid: "b05565a0-0e7c-4b19-8b1a-a775c9f93fe4" },
    barrelId: "seed-barrel-10", // A-FLOW SILVER LINE EARTH TURQUOISE 2BA
    shaftId: "seed-shaft-05", // Fit Shaft GEAR ハイブリッド ロック クリア 24.0mm
    flightId: "seed-flight-08", // Fit Flight AIR スタンダード グリーン 無地
    tipId: "seed-tip-01", // Premium Lip point 2BA 30本
    level: "BEGINNER",
    createdAt: new Date("2026-09-17T22:45:00+09:00"),
  },
  {
    id: "sample-setting-53",
    userId: misakichi,
    title: "【サンプル】ストレートのブラスでチップを替えてみた",
    description:
      "前に組んだ練習用のセッティングで、チップだけを替えてみました。刺さり方の感触が少し変わり、始めたばかりでも違いがわかっておもしろいです。",
    image: null,
    barrelId: "seed-barrel-06", // ZONE BRASS mHz-2 2BA グリーン
    shaftId: null,
    flightId: "seed-flight-02", // GAME OVER K-FLEX スタンダード ブラック 26.0mm(一体型)
    tipId: "seed-tip-03", // FIT POINT PLUS 2.0 2BA 60本
    level: "BEGINNER",
    createdAt: new Date("2026-09-18T19:40:00+09:00"),
  },
  {
    id: "sample-setting-54",
    userId: yuuto,
    title: "【サンプル】グリップ位置が迷わないくぼみ形状",
    description:
      "狙いを付けるまでの手順がシンプルになりました。くぼみに指を合わせるだけで持ち方が決まり、一体型のフライトなので組み合わせに悩むこともありません。",
    image: { fileName: "sample-setting-54.jpeg", uuid: "42cf570c-2ddd-404f-a5c2-21ada491f4b2" },
    barrelId: "seed-barrel-13", // UNITE SHRIKE 2BA
    shaftId: null,
    flightId: "seed-flight-09", // K-FLEX JAPAN LIMITED EDITION 2026 シェイプ ブルー 26.0mm(一体型)
    tipId: "seed-tip-02", // Short Lippoint 2BA 50本
    level: "INTERMEDIATE",
    createdAt: new Date("2026-09-19T13:50:00+09:00"),
  },
  {
    id: "sample-setting-55",
    userId: takkun,
    title: "【サンプル】砲弾型を友達に貸す用に組み直した",
    description:
      "前に組んだ砲弾型のバレルを、ダーツを始めたばかりの友達に貸すために組み直しました。フライトをスタンダードに替えたら飛びがゆったりして、友達にも投げやすいと言ってもらえました。",
    image: { fileName: "sample-setting-55.jpeg", uuid: "e0b7a597-5b2b-4720-ba95-032dfc69e79f" },
    barrelId: "seed-barrel-12", // TRIPLEIGHT TRUE BLUE2 2BA 鈴木さつき選手モデル
    shaftId: "seed-shaft-02", // Fit Shaft COLOR Carbon ノーマル スピン 24.0mm
    flightId: "seed-flight-08", // Fit Flight AIR スタンダード グリーン 無地
    tipId: "seed-tip-03", // FIT POINT PLUS 2.0 2BA 60本
    level: "BEGINNER",
    createdAt: new Date("2026-09-20T21:20:00+09:00"),
  },
  {
    id: "sample-setting-56",
    userId: misakichi,
    title: "【サンプル】小さめのフライトで矢速を上げた試合用",
    description:
      "小さめのフライトと細身のシャフトで、大会に向けて矢速を上げました。飛びが速くなった分、リリースの細かなずれも出やすいので、投げ込みで合わせています。",
    image: null,
    barrelId: "seed-barrel-11", // A-FLOW OBSIDIAN LINE Coral 2BA 21g 阿嘉紗香選手モデル
    shaftId: "seed-shaft-01", // L-SHaft Carbon ロック スリム 37.0mm
    flightId: "seed-flight-01", // L-Flight PRO DYNASTY Sachika ver.1 スモール
    tipId: "seed-tip-01", // Premium Lip point 2BA 30本
    level: "ADVANCED",
    createdAt: new Date("2026-09-21T20:50:00+09:00"),
  },
  {
    id: "sample-setting-57",
    userId: yuuto,
    title: "【サンプル】癖の少ないストレートで始める一本",
    description:
      "始めたばかりの人でも持ちやすい、癖の少ない形を選びました。スピンシャフトで矢同士が当たっても弾かれにくく、安心して練習できます。",
    image: { fileName: "sample-setting-57.jpeg", uuid: "5e3807c6-0b81-49f1-9aac-1d604abff50d" },
    barrelId: "seed-barrel-03", // KATANA Houju 2BA
    shaftId: "seed-shaft-02", // Fit Shaft COLOR Carbon ノーマル スピン 24.0mm
    flightId: "seed-flight-03", // Fit Flight AIR × Ami Komiyama ver.4
    tipId: "seed-tip-03", // FIT POINT PLUS 2.0 2BA 60本
    level: "BEGINNER",
    createdAt: new Date("2026-09-22T12:05:00+09:00"),
  },
  {
    id: "sample-setting-58",
    userId: youchan,
    title: "【サンプル】短めのストレートを大会用に仕上げる",
    description:
      "短めのバレルにティアドロップのフライトを合わせて、大会用に仕上げました。スピンシャフトの回り方まで確かめて、緊張した場面でも同じ飛びになるようにしています。",
    image: { fileName: "sample-setting-58.jpeg", uuid: "ace0bd09-a3a2-44fb-9402-59de7d5b5a22" },
    barrelId: "seed-barrel-09", // ENDEAVOUR G3 2BA 佐藤かす美選手モデル
    shaftId: "seed-shaft-02", // Fit Shaft COLOR Carbon ノーマル スピン 24.0mm
    flightId: "seed-flight-05", // Fit Flight AIR × 鎌田恋 ver.2 ティアドロップ クリア
    tipId: "seed-tip-05", // CRYO TIP 2BA 30本
    level: "ADVANCED",
    createdAt: new Date("2026-09-23T22:00:00+09:00"),
  },
  {
    id: "sample-setting-59",
    userId: takkun,
    title: "【サンプル】ストレートをエイト規格で細かく合わせる",
    description:
      "エイトのシャフトとスリムのフライトに替えて、自分の投げ方に合うまで何度も投げ込みました。狙いに向かって鋭く入っていく感覚が気に入っています。",
    image: { fileName: "sample-setting-59.jpeg", uuid: "aa1f757c-b119-48a7-8999-e4ac4181a79b" },
    barrelId: "seed-barrel-02", // ASTRA DARTS DRAGOON4 2BA
    shaftId: "seed-shaft-04", // 8FLIGHT シャフト レギュラー FIXED ホワイト 29.5mm
    flightId: "seed-flight-04", // 8FLIGHT スリム
    tipId: "seed-tip-01", // Premium Lip point 2BA 30本
    level: "ADVANCED",
    createdAt: new Date("2026-09-24T19:25:00+09:00"),
  },
  {
    id: "sample-setting-60",
    userId: ponzu,
    title: "【サンプル】ストレートのブラスで気軽に練習",
    description:
      "友達に誘われて始めたので、まずは手頃なブラスのバレルにしました。フライトを差し込むだけで付けられて、準備に手間取らないのが助かっています。",
    image: { fileName: "sample-setting-60.jpeg", uuid: "7ae7800c-0a66-4ffc-84e7-43d768d02ed3" },
    barrelId: "seed-barrel-06", // ZONE BRASS mHz-2 2BA グリーン
    shaftId: "seed-shaft-05", // Fit Shaft GEAR ハイブリッド ロック クリア 24.0mm
    flightId: "seed-flight-03", // Fit Flight AIR × Ami Komiyama ver.4
    tipId: "seed-tip-04", // TIP ULTIMATE 2BA 40本
    level: "BEGINNER",
    createdAt: new Date("2026-09-25T13:10:00+09:00"),
  },
];
