import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { toSettingFormValues } from "@/lib/setting-form-values";
import { SettingController } from "@/server/controllers/setting.controller";
import { BarrelService } from "@/server/services/barrel.service";
import { ShaftService } from "@/server/services/shaft.service";
import { FlightService } from "@/server/services/flight.service";
import { TipService } from "@/server/services/tip.service";
import { SettingForm } from "@/components/features/setting/setting-form";
import { updateSettingAction } from "@/app/(main)/settings/[id]/edit/actions";

type EditSettingPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditSettingPage({ params }: EditSettingPageProps) {
  // 編集前の値と商品マスタの最新を毎回表示する。ビルド時に事前生成させない
  await connection();

  const { id } = await params;

  // middlewareで保護済みだが、セッションからuserIdを取れない場合はログイン後にこのページへ戻す
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/settings/${id}/edit`)}`);
  }

  // 対象が無い・他人の投稿の場合は、存在を知らせないよう区別せず 404 にする
  const result = await SettingController.getForEdit(userId, { id });
  if (result.status === "not_found") {
    notFound();
  }

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
          セッティングを編集
        </h1>
        <div className="mt-6">
          <SettingForm
            action={updateSettingAction.bind(null, id)}
            defaultValues={toSettingFormValues(result.setting)}
            submitLabel="更新する"
            pendingLabel="更新中..."
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
