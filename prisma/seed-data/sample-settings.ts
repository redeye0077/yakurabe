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

// 一覧が空にならないよう表示するサンプル(30件)。
// - シャフトとフライトは規格(flightSystem)をそろえ、一体型フライトの場合はシャフトを null にする
// - バレルの形状は 01〜03 がストレート、04・05 がトルピード
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
];
