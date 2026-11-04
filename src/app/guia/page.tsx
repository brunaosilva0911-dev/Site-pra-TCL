import type { Metadata } from "next";
import { EpgGrid } from "@/components/epg/EpgGrid";
import { PageHeader } from "@/components/layout/PageHeader";
import { getLivePayload } from "@/lib/server/streaming";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Guia de TV" };

export default async function GuidePage() {
  const live = await getLivePayload();
  return (
    <div className="pb-24">
      <PageHeader eyebrow="Programação em tempo real" title="Guia de TV" description="Explore seis horas por vez, navegue pelos canais e abra a sinopse de cada programa. Se estiver no ar, assista; se estiver por vir, salve um lembrete." />
      <EpgGrid channels={live.channels} categories={live.categories} programs={live.epg} />
    </div>
  );
}
