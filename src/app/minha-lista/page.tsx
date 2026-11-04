import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/PageHeader";
import { MyListDashboard } from "@/components/library/MyListDashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Minha lista" };

export default function MyListPage() {
  return <div className="pb-24"><PageHeader eyebrow="Seu espaço" title="Minha lista" description="Favoritos, progresso e lembretes reunidos em um só lugar. Tudo fica salvo no perfil da sala e continua disponível quando você voltar." /><MyListDashboard /></div>;
}
