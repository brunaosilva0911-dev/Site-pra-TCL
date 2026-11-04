import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, aside }: { eyebrow: string; title: string; description: string; aside?: ReactNode }) {
  return (
    <header className="relative overflow-hidden border-b border-white/8 px-[4.5vw] pb-10 pt-24">
      <div className="absolute right-[8%] top-0 h-64 w-64 rounded-full bg-[#d9ff63]/6 blur-[100px]" />
      <div className="relative flex items-end justify-between gap-10">
        <div className="max-w-[980px]">
          <p className="animate-enter-up text-sm font-black uppercase tracking-[0.25em] text-[#d9ff63]">{eyebrow}</p>
          <h1 className="animate-enter-up mt-4 text-6xl font-black leading-none tracking-[-0.06em] [animation-delay:80ms] xl:text-7xl">{title}</h1>
          <p className="animate-enter-up mt-5 max-w-[850px] text-xl leading-relaxed text-white/52 [animation-delay:150ms]">{description}</p>
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </div>
    </header>
  );
}
