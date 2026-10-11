import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { SettingService } from "@/server/services/setting.service";
import { HeroSection } from "@/components/features/top/hero-section";
import { BeginnerBanner } from "@/components/features/top/beginner-banner";
import { LatestSettings } from "@/components/features/top/latest-settings";

// トップの新着に表示する件数
const LATEST_SETTINGS_LIMIT = 4;

export default async function Home() {
  // DBの最新を毎回表示する。ビルド時に事前生成させない
  await connection();

  const [session, latestSettings] = await Promise.all([
    auth(),
    SettingService.listLatest({ limit: LATEST_SETTINGS_LIMIT }),
  ]);

  return (
    <>
      <HeroSection isLoggedIn={!!session?.user} />
      <BeginnerBanner />
      <LatestSettings settings={latestSettings} />
    </>
  );
}
