import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PaginationNavItem =
  | { type: "page"; page: number; href: string; current: boolean }
  | { type: "ellipsis" };

type PaginationNavProps = {
  items: PaginationNavItem[];
  // 前へ/次へのリンク先。端のページでは null を渡し、無効の表示にする
  prevHref: string | null;
  nextHref: string | null;
  className?: string;
};

const pageClassName = cn(buttonVariants({ variant: "ghost", size: "icon" }), "text-brand-ink");
const currentClassName = cn(
  buttonVariants({ variant: "default", size: "icon" }),
  "bg-brand-green text-brand-cream hover:bg-brand-green",
);
const stepClassName = cn(buttonVariants({ variant: "outline", size: "default" }), "text-brand-ink");
const disabledStepClassName = cn(stepClassName, "pointer-events-none opacity-50");

/**
 * 一覧のページネーション。リンク先(href)は呼び出し側で組み立てて渡す
 * (関数を props で受け取らないので、Client Component から使っても props をそのまま渡せる)
 */
export function PaginationNav({ items, prevHref, nextHref, className }: PaginationNavProps) {
  return (
    <nav aria-label="ページ" className={cn("flex flex-wrap items-center justify-center gap-1", className)}>
      {prevHref === null ? (
        <span aria-disabled="true" className={disabledStepClassName}>
          <ChevronLeft aria-hidden="true" />
          前へ
        </span>
      ) : (
        <Link href={prevHref} className={stepClassName}>
          <ChevronLeft aria-hidden="true" />
          前へ
        </Link>
      )}

      <ul className="flex flex-wrap items-center gap-1">
        {items.map((item, index) => (
          <li key={item.type === "page" ? `page-${item.page}` : `ellipsis-${index}`}>
            {item.type === "ellipsis" ? (
              <span aria-hidden="true" className="inline-flex size-8 items-center justify-center text-brand-muted">
                …
              </span>
            ) : item.current ? (
              <Link href={item.href} aria-current="page" className={currentClassName}>
                {item.page}
              </Link>
            ) : (
              <Link href={item.href} className={pageClassName}>
                {item.page}
              </Link>
            )}
          </li>
        ))}
      </ul>

      {nextHref === null ? (
        <span aria-disabled="true" className={disabledStepClassName}>
          次へ
          <ChevronRight aria-hidden="true" />
        </span>
      ) : (
        <Link href={nextHref} className={stepClassName}>
          次へ
          <ChevronRight aria-hidden="true" />
        </Link>
      )}
    </nav>
  );
}
