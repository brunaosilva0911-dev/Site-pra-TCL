import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlayerShell } from "@/components/player/PlayerShell";
import { getVod } from "@/lib/content";
import { getLivePayload } from "@/lib/server/streaming";
import type { ContentKind } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Assistir" };

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  const vod = getVod(id);
  if (vod) {
    return <PlayerShell itemId={vod.id} title={vod.title} src={vod.streamUrl} poster={vod.backdrop} kind="vod" isLive={false} description={`${vod.genres.join(" • ")} • ${vod.year}`} />;
  }

  if (id.startsWith("canal-") || id.startsWith("evento-")) {
    const live = await getLivePayload();
    if (id.startsWith("canal-")) {
      const channelId = id.slice(6);
      const channel = live.channels.find((item) => item.id === channelId);
      if (!channel) notFound();
      return <PlayerShell itemId={id} title={channel.name} src={channel.url} poster={channel.preview || channel.image} kind={"live" satisfies ContentKind} isLive description={channel.categoryNames.join(" • ")} />;
    }
    const eventId = id.slice(7);
    const event = live.events.find((item) => item.id === eventId);
    if (!event || !event.players[0]) notFound();
    return <PlayerShell itemId={id} title={event.title} src={event.players[0]} poster={event.leagueImage} kind="event" isLive description={`${event.league} • ${event.homeTeam} x ${event.awayTeam}`} />;
  }
  notFound();
}
