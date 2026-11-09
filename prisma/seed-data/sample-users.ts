export const SAMPLE_USER_IDS = {
  takkun: "sample-user-01",
  misakichi: "sample-user-02",
  youchan: "sample-user-03",
  ponzu: "sample-user-04",
  yuuto: "sample-user-05",
} as const;

// サンプルセッティングの投稿者(5人)。ログインはできない(UserService.upsertSampleUser を参照)
export const sampleUsers: { id: string; email: string; username: string }[] = [
  { id: SAMPLE_USER_IDS.takkun, email: "sample-user-01@yakurabe.invalid", username: "たっくん" },
  { id: SAMPLE_USER_IDS.misakichi, email: "sample-user-02@yakurabe.invalid", username: "みさきち" },
  { id: SAMPLE_USER_IDS.youchan, email: "sample-user-03@yakurabe.invalid", username: "ようちゃん" },
  { id: SAMPLE_USER_IDS.ponzu, email: "sample-user-04@yakurabe.invalid", username: "ぽんず" },
  { id: SAMPLE_USER_IDS.yuuto, email: "sample-user-05@yakurabe.invalid", username: "ゆうと" },
];
