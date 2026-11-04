import type { Metadata } from "next";
import { Radio } from "lucide-react";
import { ChannelDirectory } from "@/components/content/ChannelDirectory";
import { PageHeader } from "@/components/layout/PageHeader";
import { getLivePayload } from "@/lib/server/streaming";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Canais ao vivo" };

export default async function ChannelsPage() {
  const live = await getLivePayload();
  return (
    <div className="pb-24">
      <PageHeader eyebrow="TV em tempo real" title="Canais ao vivo" description="Notícias, esportes, cinema e entretenimento. Escolha uma categoria ou encontre sua emissora pelo nome — tudo com curadoria familiar antes de chegar à tela."
        aside={<div className="glass flex items-center gap-4 rounded-2xl px-6 py-5"><Radio className="h-8 w-8 text-[#d9ff63]" /><div><strong className="block text-3xl">{live.channels.length}</strong><span className="text-sm text-white/45">sinais disponíveis</span></div></div>} />
      <ChannelDirectory channels={live.channels} categories={live.categories} epg={live.epg} />
    </div>
  );
}
