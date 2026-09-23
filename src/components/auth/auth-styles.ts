// ログイン・登録フォームで共通のスタイル。shadcn/uiの既定クラスを cn() で上書きする

export const authLabelClass = "text-[13px] font-medium text-[#3A392F]";

export const authInputClass =
  "h-[46px] rounded-[10px] border-brand-border bg-white px-3.5 text-[15px] text-brand-ink placeholder:text-[#B4B0A4] focus-visible:border-brand-brass focus-visible:ring-brand-brass/25 md:text-[15px]";

export const authSubmitClass =
  "mt-1 h-12 w-full rounded-[10px] bg-brand-green text-[15px] font-semibold tracking-[0.02em] text-brand-cream hover:bg-brand-green/90";

export const authLinkClass =
  "font-semibold text-brand-brass hover:text-brand-brass-dark hover:underline";

export const authToggleClass =
  "absolute top-1/2 right-3 flex size-6 -translate-y-1/2 items-center justify-center text-[#8B8878] hover:text-brand-ink";
