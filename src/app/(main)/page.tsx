import { auth } from "@/lib/auth";
import { getLatestSettings } from "@/mocks/latest-settings";
import { HeroSection } from "@/components/features/top/hero-section";
import { BeginnerBanner } from "@/components/features/top/beginner-banner";
import { LatestSettings } from "@/components/features/top/latest-settings";

export default async function Home() {
  const [session, latestSettings] = await Promise.all([
    auth(),
    getLatestSettings(),
  ]);

  return (
    <>
      <HeroSection isLoggedIn={!!session?.user} />
      <BeginnerBanner />
      <LatestSettings settings={latestSettings} />
    </>
  );
}
