export const SAMPLE_USER_IDS = {
  takkun: "sample-user-01",
  misakichi: "sample-user-02",
  youchan: "sample-user-03",
  ponzu: "sample-user-04",
  yuuto: "sample-user-05",
} as const;

// サンプルセッティングの投稿者(5人)。ログインはできない(UserService.upsertSampleUser を参照)
// createdAt は Seed を再実行しても変わらないよう固定する(サンプルセッティングより前の日付にする)
export const sampleUsers: { id: string; email: string; username: string; createdAt: Date }[] = [
  {
    id: SAMPLE_USER_IDS.takkun,
    email: "sample-user-01@yakurabe.invalid",
    username: "たっくん",
    createdAt: new Date("2026-08-20T12:00:00+09:00"),
  },
  {
    id: SAMPLE_USER_IDS.misakichi,
    email: "sample-user-02@yakurabe.invalid",
    username: "みさきち",
    createdAt: new Date("2026-08-21T12:30:00+09:00"),
  },
  {
    id: SAMPLE_USER_IDS.youchan,
    email: "sample-user-03@yakurabe.invalid",
    username: "ようちゃん",
    createdAt: new Date("2026-08-22T11:45:00+09:00"),
  },
  {
    id: SAMPLE_USER_IDS.ponzu,
    email: "sample-user-04@yakurabe.invalid",
    username: "ぽんず",
    createdAt: new Date("2026-08-23T12:15:00+09:00"),
  },
  {
    id: SAMPLE_USER_IDS.yuuto,
    email: "sample-user-05@yakurabe.invalid",
    username: "ゆうと",
    createdAt: new Date("2026-08-24T13:00:00+09:00"),
  },
];
