import { connection } from "next/server";
import { BarrelService } from "@/server/services/barrel.service";
import { ShaftService } from "@/server/services/shaft.service";
import { FlightService } from "@/server/services/flight.service";
import { TipService } from "@/server/services/tip.service";
import { SettingForm } from "@/components/features/setting/setting-form";
import { createSettingAction } from "@/app/(main)/settings/new/actions";

export default async function NewSettingPage() {
  // 商品マスタの最新を毎回表示する。ビルド時に事前生成させない
  await connection();

  // 未ログイン時は middleware でログイン画面へリダイレクトされる
  // 商品は件数が少ないため全件を渡し、シャフトの絞り込みは画面側で行う
  const [barrels, shafts, flights, tips] = await Promise.all([
    BarrelService.listAll(),
    ShaftService.listAll(),
    FlightService.listAll(),
    TipService.listAll(),
  ]);

  return (
    <section className="px-6 pt-10 pb-16 md:px-12">
      {/* 入力欄が横に広がりすぎないよう幅を絞り、見出しと一緒に中央に寄せる */}
      <div className="mx-auto max-w-[560px]">
        <h1 className="font-heading text-[24px] font-semibold text-brand-ink">
          セッティングを登録
        </h1>
        <div className="mt-6">
          <SettingForm
            action={createSettingAction}
            barrels={barrels}
            shafts={shafts}
            flights={flights}
            tips={tips}
          />
        </div>
      </div>
    </section>
  );
}
