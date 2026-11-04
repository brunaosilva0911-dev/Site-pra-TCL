import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { SportsBoard } from "@/components/content/SportsBoard";
import { getLivePayload } from "@/lib/server/streaming";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Esportes" };

export default async function SportsPage() {
  const live = await getLivePayload();
  return (
    <div className="pb-24">
      <PageHeader eyebrow="Sua agenda, sem spoilers" title="Esportes" description="Acompanhe partidas no ar, descubra os próximos confrontos e salve lembretes. Os estados e horários vêm diretamente da agenda esportiva, sem placares ou contagens inventadas." />
      <SportsBoard events={live.events} />
    </div>
  );
}
