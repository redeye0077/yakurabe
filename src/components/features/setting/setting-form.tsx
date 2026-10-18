"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import {
  createSettingAction,
  type CreateSettingActionState,
} from "@/app/(main)/settings/new/actions";
import type { CreateSettingField } from "@/schemas/setting";
import type { BarrelListItemDto } from "@/server/dto/barrel.dto";
import type { ShaftListItemDto } from "@/server/dto/shaft.dto";
import type { FlightListItemDto } from "@/server/dto/flight.dto";
import type { TipListItemDto } from "@/server/dto/tip.dto";
import { filterShaftsByFlight, isShaftIntegrated } from "@/lib/shaft-compatibility";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SettingFormProps = {
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

export function SettingForm({ barrels, shafts, flights, tips }: SettingFormProps) {
  const [state, formAction, isPending] = useActionState<CreateSettingActionState, FormData>(
    createSettingAction,
    null
  );

  // フライトとシャフトは選択に応じて表示を切り替えるため state で管理する
  const [flightId, setFlightId] = useState("");
  const [shaftId, setShaftId] = useState("");

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

  // <form action> に渡すと React 19 が Action の完了後にフォームをリセットし、
  // select が先頭の option に戻ってしまう(制御・非制御とも)。リセットさせないよう onSubmit から呼ぶ
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  }

  const errors = state?.fieldErrors ?? {};
  const values = state?.values;

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

      <Button
        type="submit"
        disabled={isPending}
        className="mt-1 h-12 w-full rounded-[10px] bg-brand-green text-[15px] font-semibold tracking-[0.02em] text-brand-cream hover:bg-brand-green/90"
      >
        {isPending ? "登録中..." : "登録する"}
      </Button>
    </form>
  );
}
