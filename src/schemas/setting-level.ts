import { z } from "zod";

// Prismaの SettingLevel enum と同じ値。Client Component がPrismaに依存しないよう、こちらで定義する。
// Prisma の enum と一致しているかは setting.repository.ts で型チェックしている(ずれると typecheck で失敗する)
export const SETTING_LEVELS = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

// セッティングの対象レベル
export const settingLevelSchema = z.enum(SETTING_LEVELS, {
  error: "対象レベルの選択が正しくありません",
});

export type SettingLevel = z.infer<typeof settingLevelSchema>;

// 画面に表示する名前。Record にしているので、SETTING_LEVELS に値を増やすとここが型エラーになり、表示名の漏れに気づける
export const SETTING_LEVEL_LABELS: Record<SettingLevel, string> = {
  BEGINNER: "初心者向け",
  INTERMEDIATE: "中級者向け",
  ADVANCED: "上級者向け",
};
