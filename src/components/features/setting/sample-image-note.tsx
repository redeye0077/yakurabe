import { cn } from "@/lib/utils";

// サンプルのセッティング(seed で登録)の画像は AI で生成しているため、サンプルが並ぶ一覧に添える一文。
// 一覧ページとトップの新着で共有する
export const SAMPLE_IMAGE_NOTE =
  "【サンプル】の投稿の画像はAIで生成したイメージで、実際の商品とは色や形が異なります。";

type SampleImageNoteProps = {
  // 見出しとの間隔など、置く場所に合わせた余白を呼び出し側が渡す
  className?: string;
};

// 補足の一文なので、見出しやカードより目立たない控えめな見た目にする
export function SampleImageNote({ className }: SampleImageNoteProps) {
  return (
    <p className={cn("text-[13px] leading-[1.8] text-brand-muted", className)}>
      {SAMPLE_IMAGE_NOTE}
    </p>
  );
}
