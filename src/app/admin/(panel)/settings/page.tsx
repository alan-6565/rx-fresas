import { headers } from "next/headers";
import { getBusinessInfo } from "@/lib/business-info";
import { getSpots } from "@/lib/catalog";
import { getIntake, getIntakeToken } from "@/lib/intake";
import { PageHeader } from "@/components/admin/ui";
import { SettingsView } from "./SettingsView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [token, intake, info, spots, h] = await Promise.all([getIntakeToken(), getIntake(), getBusinessInfo(), getSpots(), headers()]);
  const host = h.get("host") ?? "rx-fresas.vercel.app";
  const origin = `${h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https")}://${host}`;
  return (
    <>
      <PageHeader title="Settings" sub="The owners' questionnaire, plus the contact info and social links shown on the website." />
      <SettingsView origin={origin} token={token} intake={intake} info={info} spotNames={Object.fromEntries(spots.map((s) => [s.id, s.name]))} />
    </>
  );
}
