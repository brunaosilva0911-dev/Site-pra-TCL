import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#080b0c] p-12 text-center">
      <div className="max-w-[760px]"><SearchX className="mx-auto h-20 w-20 text-[#d9ff63]" /><p className="mt-7 text-sm font-black uppercase tracking-[0.25em] text-[#d9ff63]">Erro 404</p><h1 className="mt-4 text-6xl font-black tracking-[-0.06em]">Este sinal saiu do ar.</h1><p className="mt-5 text-2xl leading-relaxed text-white/50">O título pode ter sido removido, o evento terminou ou o item foi bloqueado pela política de curadoria familiar.</p><Link href="/" data-tv-focus="true" data-autofocus tabIndex={0} className="tv-focus mx-auto mt-9 flex h-16 w-fit items-center gap-3 rounded-full bg-[#d9ff63] px-8 text-xl font-black text-black"><ArrowLeft className="h-6 w-6" /> Voltar ao início</Link></div>
    </main>
  );
}
