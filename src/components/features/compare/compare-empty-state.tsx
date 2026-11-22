import Link from "next/link";
import { SETTINGS_LIST_PATH } from "@/schemas/setting-list-query";

type CompareEmptyStateProps = {
  message: string;
};

// ids が不正な場合と、セッティングが見つからない場合に表示する。案内の文言は呼び出し側から受け取り、どちらも一覧へ戻す
export function CompareEmptyState({ message }: CompareEmptyStateProps) {
  return (
    <div className="mx-auto max-w-[480px] rounded-[12px] border border-brand-border bg-white px-6 py-10 text-center">
      <p className="text-[14px] text-brand-ink">{message}</p>
      <Link
        href={SETTINGS_LIST_PATH}
        className="mt-5 inline-block rounded-[9px] bg-brand-brass px-6 py-3 text-[14px] font-bold text-brand-green transition-opacity hover:opacity-90"
      >
        セッティング一覧へ
      </Link>
    </div>
  );
}
