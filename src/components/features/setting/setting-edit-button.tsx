import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

type SettingEditButtonProps = {
  id: string;
};

// マイページの自分の投稿カードに置く編集ボタン。遷移するだけなので、見た目だけボタンに揃えたリンクにする
export function SettingEditButton({ id }: SettingEditButtonProps) {
  return (
    <Link
      href={`/settings/${id}/edit`}
      className={buttonVariants({ variant: "outline", size: "sm" })}
    >
      編集
    </Link>
  );
}
