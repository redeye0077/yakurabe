"use client";

import { startTransition, useActionState, useMemo, useRef, useState, type FormEvent } from "react";
import { unstable_rethrow } from "next/navigation";
import type { CreateSettingField } from "@/schemas/setting";
import type {
  SettingFormAction,
  SettingFormActionState,
  SettingFormValues,
  SettingImageUploadAction,
} from "@/types/setting-form";
import type { BarrelListItemDto } from "@/server/dto/barrel.dto";
import type { ShaftListItemDto } from "@/server/dto/shaft.dto";
import type { FlightListItemDto } from "@/server/dto/flight.dto";
import type { TipListItemDto } from "@/server/dto/tip.dto";
import { filterShaftsByFlight, isShaftIntegrated } from "@/lib/shaft-compatibility";
import { SETTING_IMAGE_TYPES, SETTING_IMAGE_UPLOAD_FAILED_MESSAGE } from "@/lib/setting-image";
import { checkSettingImageFile, uploadSettingImage } from "@/lib/setting-image-upload";
import { withFormError } from "@/lib/with-form-error";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SettingFormProps = {
  // 登録では createSettingAction、編集では id を bind した updateSettingAction を渡す
  action: SettingFormAction;
  // 画像のアップロード先を発行する Action。渡すと画像の入力欄を表示する(登録のみ。編集は画像を変更しない)
  imageUploadAction?: SettingImageUploadAction;
  // 編集時の初期値。省略すると空のフォーム(登録)になる
  defaultValues?: SettingFormValues;
  submitLabel?: string;
  pendingLabel?: string;
  barrels: BarrelListItemDto[];
  shafts: ShaftListItemDto[];
  flights: FlightListItemDto[];
  tips: TipListItemDto[];
};

const labelClass = "text-[13px] font-medium text-[#3A392F]";
const controlClass =
  "w-full rounded-[10px] border border-brand-border bg-white px-3.5 text-[15px] text-brand-ink outline-none focus-visible:border-brand-brass focus-visible:ring-[3px] focus-visible:ring-brand-brass/25 aria-invalid:border-destructive";
const errorClass = "text-[13px] text-destructive";

// 項目ごとの id。label の htmlFor とエラー文言の aria-describedby で使う
const fieldId = (field: CreateSettingField) => `setting-${field}`;
const errorId = (field: CreateSettingField) => `setting-${field}-error`;

export function SettingForm({
  action,
  imageUploadAction,
  defaultValues,
  submitLabel = "登録する",
  pendingLabel = "登録中...",
  barrels,
  shafts,
  flights,
  tips,
}: SettingFormProps) {
  // 保存の Action が例外を投げても error.tsx に飛ばさず、フォームのエラーとして表示する
  const safeAction = useMemo(() => withFormError(action), [action]);
  const [state, formAction, isPending] = useActionState<SettingFormActionState, FormData>(
    safeAction,
    null
  );

  // 画像のアップロード中(保存の Action を呼ぶ前)も送信ボタンを無効にする
  const [isUploading, setIsUploading] = useState(false);
  // 送信前の画面側の確認・アップロードで出た画像のエラー。サーバーから返った画像のエラーより優先して表示する
  const [imageError, setImageError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // フライトとシャフトは選択に応じて表示を切り替えるため state で管理する。
  // 初期値は編集時の値をそのまま使い、初期表示ではシャフトのリセット(handleFlightChange)を通さない
  const [flightId, setFlightId] = useState(defaultValues?.flightId ?? "");
  const [shaftId, setShaftId] = useState(defaultValues?.shaftId ?? "");

  const selectedFlight = flights.find((flight) => flight.id === flightId);
  const shaftOptions = filterShaftsByFlight(shafts, selectedFlight);
  const showShaft = !isShaftIntegrated(selectedFlight);

  function handleFlightChange(nextFlightId: string) {
    setFlightId(nextFlightId);
    // 一体型に変えた場合や、今のシャフトが新しいフライトと規格が合わない場合は選択を空に戻す
    const nextFlight = flights.find((flight) => flight.id === nextFlightId);
    if (!filterShaftsByFlight(shafts, nextFlight).some((shaft) => shaft.id === shaftId)) {
      setShaftId("");
    }
  }

  /**
   * 画像が選ばれていれば、保存の前にブラウザから S3 に直接アップロードし、保存先キーを imageKey として送る。
   * ファイル本体は保存の Action に送らない(Server Action の本文サイズ上限を超えないようにするため)
   */
  async function uploadImage(formData: FormData): Promise<boolean> {
    formData.delete("image");
    const file = imageInputRef.current?.files?.[0];
    if (!imageUploadAction || !file || file.size === 0) {
      return true;
    }

    const checked = await checkSettingImageFile(file);
    if (!checked.ok) {
      setImageError(checked.message);
      return false;
    }

    setIsUploading(true);
    try {
      const result = await imageUploadAction({ contentType: checked.type, size: file.size });
      if (result.status === "invalid") {
        setImageError(result.message);
        return false;
      }
      // 未ログインなら画像なしで保存の Action を呼び、そちらでログイン画面へリダイレクトさせる
      if (result.status === "success") {
        await uploadSettingImage(result.upload, file);
        formData.set("imageKey", result.upload.key);
      }
      return true;
    } catch (error) {
      unstable_rethrow(error);
      console.error("[setting-form] 画像のアップロードに失敗しました", error);
      setImageError(SETTING_IMAGE_UPLOAD_FAILED_MESSAGE);
      return false;
    } finally {
      setIsUploading(false);
    }
  }

  // <form action> に渡すと React 19 が Action の完了後にフォームをリセットし、
  // select が先頭の option に戻ってしまう(制御・非制御とも)。リセットさせないよう onSubmit から呼ぶ
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setImageError(null);

    if (!(await uploadImage(formData))) {
      return;
    }
    startTransition(() => {
      formAction(formData);
    });
  }

  const errors = {
    ...state?.fieldErrors,
    ...(imageError !== null && { imageKey: imageError }),
  };
  const isSubmitting = isPending || isUploading;
  // エラーで戻ってきたら送信した値、それ以外は編集時の初期値(登録では undefined)を表示する
  const values = state?.values ?? defaultValues;

  // エラーがある項目に aria-invalid と aria-describedby を付ける
  const errorProps = (field: CreateSettingField) =>
    errors[field]
      ? { "aria-invalid": true, "aria-describedby": errorId(field) }
      : {};

  const fieldError = (field: CreateSettingField) =>
    errors[field] ? (
      <p id={errorId(field)} className={errorClass}>
        {errors[field]}
      </p>
    ) : null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {state?.message && (
        <p role="alert" className={errorClass}>
          {state.message}
        </p>
      )}
      {state?.formError && (
        <p role="alert" className={errorClass}>
          {state.formError}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor={fieldId("title")} className={labelClass}>
          タイトル
        </Label>
        <input
          id={fieldId("title")}
          name="title"
          type="text"
          defaultValue={values?.title ?? ""}
          className={cn(controlClass, "h-[46px]")}
          {...errorProps("title")}
        />
        {fieldError("title")}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={fieldId("barrelId")} className={labelClass}>
          バレル
        </Label>
        <select
          id={fieldId("barrelId")}
          name="barrelId"
          defaultValue={values?.barrelId ?? ""}
          className={cn(controlClass, "h-[46px]")}
          {...errorProps("barrelId")}
        >
          <option value="">選択してください</option>
          {barrels.map((barrel) => (
            <option key={barrel.id} value={barrel.id}>
              {barrel.name}（{barrel.weight.toFixed(1)}g）
            </option>
          ))}
        </select>
        {fieldError("barrelId")}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={fieldId("flightId")} className={labelClass}>
          フライト
        </Label>
        <select
          id={fieldId("flightId")}
          name="flightId"
          value={flightId}
          onChange={(e) => handleFlightChange(e.target.value)}
          className={cn(controlClass, "h-[46px]")}
          {...errorProps("flightId")}
        >
          <option value="">選択してください</option>
          {flights.map((flight) => (
            <option key={flight.id} value={flight.id}>
              {flight.name}
            </option>
          ))}
        </select>
        {fieldError("flightId")}
      </div>

      {/* 一体型フライトではシャフトを選ばないため描画しない(送信されず、Action 側で null になる) */}
      {showShaft && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={fieldId("shaftId")} className={labelClass}>
            シャフト
          </Label>
          <select
            id={fieldId("shaftId")}
            name="shaftId"
            value={shaftId}
            onChange={(e) => setShaftId(e.target.value)}
            className={cn(controlClass, "h-[46px]")}
            {...errorProps("shaftId")}
          >
            <option value="">選択してください</option>
            {shaftOptions.map((shaft) => (
              <option key={shaft.id} value={shaft.id}>
                {shaft.name}
              </option>
            ))}
          </select>
          {fieldError("shaftId")}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor={fieldId("tipId")} className={labelClass}>
          チップ
        </Label>
        <select
          id={fieldId("tipId")}
          name="tipId"
          defaultValue={values?.tipId ?? ""}
          className={cn(controlClass, "h-[46px]")}
          {...errorProps("tipId")}
        >
          <option value="">選択してください</option>
          {tips.map((tip) => (
            <option key={tip.id} value={tip.id}>
              {tip.name}
            </option>
          ))}
        </select>
        {fieldError("tipId")}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={fieldId("description")} className={labelClass}>
          特徴・使用感(任意)
        </Label>
        <textarea
          id={fieldId("description")}
          name="description"
          rows={4}
          defaultValue={values?.description ?? ""}
          className={cn(controlClass, "py-2.5")}
          {...errorProps("description")}
        />
        {fieldError("description")}
      </div>

      {imageUploadAction && (
        <div className="flex flex-col gap-2">
          <Label htmlFor={fieldId("imageKey")} className={labelClass}>
            画像(任意)
          </Label>
          {/* 選択したファイルは送信時にアップロードする。エラーで戻っても選択は残り、次の送信でアップロードし直す */}
          <input
            ref={imageInputRef}
            id={fieldId("imageKey")}
            name="image"
            type="file"
            accept={SETTING_IMAGE_TYPES.join(",")}
            className="text-[14px] text-brand-ink file:mr-3 file:rounded-[8px] file:border file:border-brand-border file:bg-white file:px-3 file:py-1.5 file:text-[13px]"
            {...errorProps("imageKey")}
          />
          <p className="text-[12px] text-brand-muted">JPEG・PNG・WebP、5MB まで</p>
          {fieldError("imageKey")}
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 h-12 w-full rounded-[10px] bg-brand-green text-[15px] font-semibold tracking-[0.02em] text-brand-cream hover:bg-brand-green/90"
      >
        {isSubmitting ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
