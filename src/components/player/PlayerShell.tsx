"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft, Check, Gauge, LoaderCircle, Maximize, MessageCircle, Minimize,
  Pause, Play, RefreshCw, RotateCcw, RotateCw, Send, Settings2, Volume1, Volume2, VolumeX, X,
} from "lucide-react";
import type Hls from "hls.js";
import { useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import type { ContentKind } from "@/lib/types";

interface ChatMessage { id: number; author: string; message: string; createdAt: string }

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const value = Math.floor(seconds);
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const rest = value % 60;
  return `${hours ? `${String(hours).padStart(2, "0")}:` : ""}${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function ControlButton({ label, children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return <button type="button" data-tv-focus="true" tabIndex={0} aria-label={label} title={label} {...props} className={`tv-focus grid h-14 w-14 shrink-0 place-items-center rounded-full text-white ${className}`}>{children}</button>;
}

export function PlayerShell({ itemId, title, src, poster, kind, isLive, description }: {
  itemId: string; title: string; src: string; poster?: string; kind: ContentKind; isLive: boolean; description?: string;
}) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [levels, setLevels] = useState<{ index: number; label: string }[]>([]);
  const [quality, setQuality] = useState(-1);
  const [showQuality, setShowQuality] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [rate, setRate] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const isEmbed = !/\.(?:m3u8|mp4|webm)(?:$|[?#])/i.test(src);

  const saveHistory = useCallback((beacon = false) => {
    const video = videoRef.current;
    if (!video || !itemId) return;
    const payload = JSON.stringify({ itemId, itemType: kind, title, image: poster, position: video.currentTime || 0, duration: video.duration || 0 });
    if (beacon && navigator.sendBeacon) {
      navigator.sendBeacon("/api/history", new Blob([payload], { type: "application/json" }));
      return;
    }
    void fetch("/api/history", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => undefined);
  }, [itemId, kind, title, poster]);

  useEffect(() => {
    let cancelled = false;
    let networkRetried = false;
    let mediaRetried = false;
    const video = videoRef.current;
    setError(null); setReady(false); setBuffering(true); setLevels([]); setQuality(-1);
    if (isEmbed) {
      setBuffering(false);
      return () => { cancelled = true; };
    }
    if (!video) return;
    video.pause();
    video.removeAttribute("src");
    video.load();
    hlsRef.current?.destroy();
    hlsRef.current = null;

    const autoplay = localStorage.getItem("viva-autoplay") !== "false";
    const tryPlay = () => {
      if (cancelled || !autoplay) return;
      video.play().catch(() => setPlaying(false));
    };
    const setupNative = () => {
      video.src = src;
      video.load();
      if (autoplay) tryPlay();
    };

    const isNativeFile = /\.(?:mp4|webm)(?:$|[?#])/i.test(src);
    const isHls = /\.m3u8(?:$|[?#])/i.test(src);
    if (isNativeFile) setupNative();
    else if (isHls) {
      void import("hls.js").then(({ default: HlsEngine }) => {
        if (cancelled) return;
        if (HlsEngine.isSupported()) {
          const hls = new HlsEngine({
            enableWorker: true,
            lowLatencyMode: isLive,
            backBufferLength: 60,
            manifestLoadingMaxRetry: 3,
            manifestLoadingTimeOut: 12000,
            levelLoadingMaxRetry: 4,
            fragLoadingMaxRetry: 5,
          });
          hlsRef.current = hls;
          hls.on(HlsEngine.Events.MANIFEST_PARSED, () => {
            if (cancelled) return;
            setLevels(hls.levels.map((level, index) => ({ index, label: level.height ? `${level.height}p` : `${Math.round(level.bitrate / 1000)} kbps` })));
            setReady(true); setBuffering(false); tryPlay();
          });
          hls.on(HlsEngine.Events.ERROR, (_event, data) => {
            if (!data.fatal || cancelled) return;
            if (data.type === HlsEngine.ErrorTypes.NETWORK_ERROR && !networkRetried) {
              networkRetried = true; setBuffering(true); hls.startLoad(); return;
            }
            if (data.type === HlsEngine.ErrorTypes.MEDIA_ERROR && !mediaRetried) {
              mediaRetried = true; setBuffering(true); hls.recoverMediaError(); return;
            }
            setError("O sinal não pôde ser iniciado. A emissora pode estar offline ou o formato não é compatível com esta TV.");
            setBuffering(false);
          });
          hls.loadSource(src);
          hls.attachMedia(video);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) setupNative();
        else { setError("Este navegador não oferece suporte a HLS. Atualize o WebView da Android TV e tente novamente."); setBuffering(false); }
      }).catch(() => { if (!cancelled) { setError("Não foi possível carregar o mecanismo de vídeo."); setBuffering(false); } });
    } else {
      setError("Formato de transmissão não reconhecido. A fonte precisa ser um vídeo MP4/WebM, uma playlist HLS ou um endereço de incorporação.");
      setBuffering(false);
    }

    return () => {
      cancelled = true;
      saveHistory(true);
      hlsRef.current?.destroy();
      hlsRef.current = null;
      video.pause();
      video.removeAttribute("src");
    };
  }, [src, isLive, reloadKey, saveHistory]);

  useEffect(() => {
    if (isLive) return;
    let resumeAt = 0;
    let disposed = false;
    const video = videoRef.current;
    fetch(`/api/history?itemId=${encodeURIComponent(itemId)}`).then((response) => response.ok ? response.json() : null).then((data) => {
      resumeAt = Number(data?.items?.[0]?.position) || 0;
      if (disposed || !video || !resumeAt) return;
      if (video.readyState >= 1 && (!video.duration || resumeAt < video.duration - 15)) video.currentTime = resumeAt;
    }).catch(() => undefined);
    const onMetadata = () => { if (resumeAt && video && (!video.duration || resumeAt < video.duration - 15)) video.currentTime = resumeAt; };
    video?.addEventListener("loadedmetadata", onMetadata);
    return () => { disposed = true; video?.removeEventListener("loadedmetadata", onMetadata); };
  }, [itemId, isLive]);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (videoRef.current && !videoRef.current.paused && !showQuality && !showChat) {
      timerRef.current = setTimeout(() => { setControlsVisible(false); rootRef.current?.focus({ preventScroll: true }); }, 5500);
    }
  }, [showQuality, showChat]);

  useEffect(() => {
    revealControls();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [playing, revealControls]);

  useEffect(() => {
    const timer = window.setTimeout(() => rootRef.current?.querySelector<HTMLElement>("[data-player-primary]")?.focus({ preventScroll: true }), 180);
    const onBack = (event: Event) => {
      event.preventDefault();
      if (showQuality) { setShowQuality(false); window.setTimeout(() => rootRef.current?.querySelector<HTMLElement>("[data-quality-button]")?.focus(), 0); return; }
      if (showChat) { setShowChat(false); return; }
      if (controlsVisible) { setControlsVisible(false); rootRef.current?.focus(); return; }
      saveHistory(); router.back();
    };
    window.addEventListener("viva:back", onBack);
    return () => { window.clearTimeout(timer); window.removeEventListener("viva:back", onBack); };
  }, [controlsVisible, showQuality, showChat, router, saveHistory]);

  useEffect(() => {
    if (!showChat) return;
    const load = () => fetch(`/api/chat?channelId=${encodeURIComponent(itemId)}`).then((response) => response.ok ? response.json() : Promise.reject()).then((data) => { setMessages(data.items ?? []); setChatError(null); }).catch(() => setChatError("Chat indisponível no momento."));
    void load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, [showChat, itemId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ block: "nearest" }); }, [messages]);
  useEffect(() => {
    if (error) {
      setControlsVisible(true);
      const timer = window.setTimeout(() => rootRef.current?.querySelector<HTMLElement>("[data-error-retry]")?.focus(), 60);
      return () => window.clearTimeout(timer);
    }
  }, [error]);
  useEffect(() => {
    if (!showQuality) return;
    const timer = window.setTimeout(() => {
      const menu = rootRef.current?.querySelector<HTMLElement>("[data-quality-menu]");
      (menu?.querySelector<HTMLElement>("[data-autofocus]") ?? menu?.querySelector<HTMLElement>('[data-tv-focus="true"]'))?.focus();
    }, 60);
    return () => window.clearTimeout(timer);
  }, [showQuality]);
  useEffect(() => {
    const onFullscreen = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || error || isEmbed) return;
    revealControls();
    if (video.paused) video.play().catch(() => setError("Não foi possível iniciar a reprodução. Tente novamente."));
    else video.pause();
  }, [error, isEmbed, revealControls]);

  const seek = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video || isLive || !Number.isFinite(video.duration)) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    revealControls();
  }, [isLive, revealControls]);

  const changeVolume = useCallback((value: number) => {
    const video = videoRef.current;
    if (!video) return;
    const next = Math.max(0, Math.min(1, value));
    video.volume = next; video.muted = next === 0; setVolume(next); setMuted(next === 0); revealControls();
  }, [revealControls]);

  const onRootKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const key = event.key || ({ 13: "Enter", 415: "MediaPlay", 19: "MediaPause", 179: "MediaPlayPause" } as Record<number, string>)[event.keyCode];
    const target = event.target as HTMLElement;
    if (target instanceof HTMLInputElement && target.type === "range" && (key === "ArrowLeft" || key === "ArrowRight")) {
      event.preventDefault(); event.stopPropagation();
      const delta = key === "ArrowRight" ? 1 : -1;
      if (target.dataset.control === "volume") changeVolume(volume + delta * 0.05);
      else seek(delta * 5);
      return;
    }
    if (["MediaPlayPause", "MediaPlay", "MediaPause", "Play", "Pause"].includes(key)) {
      event.preventDefault(); event.stopPropagation();
      if (key === "MediaPlay") videoRef.current?.play().catch(() => undefined);
      else if (key === "MediaPause") videoRef.current?.pause();
      else togglePlay();
      return;
    }
    if (!controlsVisible && ["Enter", " "].includes(key)) { event.preventDefault(); event.stopPropagation(); togglePlay(); return; }
    if (!controlsVisible && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(key)) {
      event.preventDefault(); event.stopPropagation(); revealControls();
      if (!isLive && key === "ArrowLeft") seek(-10);
      if (!isLive && key === "ArrowRight") seek(10);
    }
  };

  const submitChat = async (event: FormEvent) => {
    event.preventDefault();
    if (!chatInput.trim() || sending) return;
    setSending(true); setChatError(null);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channelId: itemId, message: chatInput }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Mensagem não enviada");
      setMessages((current) => [...current, data.item]); setChatInput("");
    } catch (chatFailure) { setChatError(chatFailure instanceof Error ? chatFailure.message : "Mensagem não enviada"); }
    finally { setSending(false); }
  };

  return (
    <div ref={rootRef} data-focus-trap tabIndex={-1} onKeyDown={onRootKeyDown} onMouseMove={revealControls}
      className="fixed inset-0 z-[100] overflow-hidden bg-black outline-none" aria-label={`Reprodutor: ${title}`}>
      {isEmbed ? (
        <iframe key={`${src}-${reloadKey}`} src={src} title={`Transmissão: ${title}`} className="h-full w-full border-0 bg-black" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" onLoad={() => { setReady(true); setBuffering(false); }} />
      ) : <video ref={videoRef} className="h-full w-full object-contain" poster={poster} playsInline preload="auto"
        onClick={togglePlay}
        onPlay={() => { setPlaying(true); setBuffering(false); revealControls(); }}
        onPause={() => { setPlaying(false); setControlsVisible(true); saveHistory(); }}
        onWaiting={() => setBuffering(true)} onCanPlay={() => { setReady(true); setBuffering(false); }}
        onLoadedMetadata={(event) => { setDuration(event.currentTarget.duration); setReady(true); }}
        onDurationChange={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => {
          const video = event.currentTarget; setCurrentTime(video.currentTime);
          if (!isLive && video.currentTime - lastSavedRef.current > 12) { lastSavedRef.current = video.currentTime; saveHistory(); }
        }}
        onVolumeChange={(event) => { setVolume(event.currentTarget.volume); setMuted(event.currentTarget.muted); }}
        onEnded={() => { setPlaying(false); setControlsVisible(true); saveHistory(); }}
        onError={() => { if (!hlsRef.current && src) { setError("O vídeo não pôde ser carregado. Verifique sua conexão ou tente novamente."); setBuffering(false); } }}
      />}

      {!ready && !error && <div className="pointer-events-none absolute inset-0 grid place-items-center"><LoaderCircle className="h-16 w-16 animate-spin text-[#d9ff63]" /><span className="sr-only">Carregando vídeo</span></div>}
      {buffering && ready && !error && <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/15"><LoaderCircle className="h-14 w-14 animate-spin text-white" /></div>}

      <div className={`absolute inset-x-0 top-0 flex items-start justify-between gap-8 bg-gradient-to-b from-black/85 to-transparent p-8 transition-all duration-300 ${controlsVisible ? "visible translate-y-0 opacity-100" : "invisible -translate-y-5 opacity-0"}`}>
        <div className="flex items-center gap-5">
          <ControlButton label="Voltar" onClick={() => { saveHistory(); router.back(); }} className="bg-black/35"><ArrowLeft className="h-7 w-7" /></ControlButton>
          <div><div className="flex items-center gap-3">{isLive && <span className="rounded-full bg-[#ff4d53] px-3 py-1 text-xs font-black uppercase tracking-widest">Ao vivo</span>}<span className="text-sm font-bold uppercase tracking-[0.2em] text-[#d9ff63]">VIVA Player</span></div><h1 className="mt-2 max-w-[900px] truncate text-3xl font-bold tracking-[-0.035em]">{title}</h1>{description && <p className="mt-1 max-w-[750px] truncate text-base text-white/45">{description}</p>}</div>
        </div>
        <ControlButton label={showChat ? "Fechar chat" : "Abrir chat desta sala"} onClick={() => { setShowChat((value) => !value); setShowQuality(false); }} className={showChat ? "bg-[#d9ff63] text-black" : "bg-black/35"}><MessageCircle className="h-6 w-6" /></ControlButton>
      </div>

      {!controlsVisible && !error && <button type="button" tabIndex={-1} aria-label="Mostrar controles" onClick={revealControls} className="absolute inset-0 h-full w-full cursor-none" />}

      <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent px-8 pb-7 pt-24 transition-all duration-300 ${controlsVisible ? "visible translate-y-0 opacity-100" : "invisible translate-y-6 opacity-0"}`}>
        {!isLive && <div className="mb-4 flex items-center gap-5">
          <span className="w-20 text-right text-base font-semibold tabular-nums text-white/70">{formatTime(currentTime)}</span>
          <input data-tv-focus="true" data-control="progress" tabIndex={0} type="range" min={0} max={duration || 100} step={0.1} value={Math.min(currentTime, duration || 100)} onChange={(event) => { const video = videoRef.current; if (video) video.currentTime = Number(event.target.value); }} aria-label="Posição do vídeo" className="h-2 flex-1" />
          <span className="w-20 text-base font-semibold tabular-nums text-white/50">{formatTime(duration)}</span>
        </div>}
        <div className="flex items-center gap-2">
          {!isEmbed && <div className="contents"><ControlButton data-player-primary label={playing ? "Pausar" : "Reproduzir"} onClick={togglePlay} className="h-16 w-16 bg-[#d9ff63] text-black">{playing ? <Pause className="h-7 w-7 fill-current" /> : <Play className="ml-1 h-7 w-7 fill-current" />}</ControlButton>
          {!isLive && <><ControlButton label="Voltar 10 segundos" onClick={() => seek(-10)}><RotateCcw className="h-7 w-7" /><span className="absolute text-[9px] font-black">10</span></ControlButton><ControlButton label="Avançar 10 segundos" onClick={() => seek(10)}><RotateCw className="h-7 w-7" /><span className="absolute text-[9px] font-black">10</span></ControlButton></>}
          <ControlButton label={muted ? "Ativar som" : "Silenciar"} onClick={() => { const video = videoRef.current; if (video) { video.muted = !video.muted; revealControls(); } }}>{muted || volume === 0 ? <VolumeX className="h-7 w-7" /> : volume < 0.55 ? <Volume1 className="h-7 w-7" /> : <Volume2 className="h-7 w-7" />}</ControlButton>
          <input data-tv-focus="true" data-control="volume" tabIndex={0} type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={(event) => changeVolume(Number(event.target.value))} aria-label="Volume" className="mx-2 w-36" />
          <span className="ml-3 text-sm font-bold uppercase tracking-widest text-white/35">{isLive ? "Transmissão em tempo real" : `${formatTime(Math.max(0, duration - currentTime))} restantes`}</span>
          <div className="ml-auto flex items-center gap-2">
            {!isLive && <ControlButton label={`Velocidade ${rate}x`} onClick={() => { const rates = [1, 1.25, 1.5, 0.75]; const next = rates[(rates.indexOf(rate) + 1) % rates.length]; setRate(next); if (videoRef.current) videoRef.current.playbackRate = next; revealControls(); }} className="w-auto min-w-14 px-3"><Gauge className="h-6 w-6" /><span className="ml-1 text-sm font-bold">{rate}x</span></ControlButton>}
            {levels.length > 1 && <div className="relative"><ControlButton data-quality-button label="Qualidade de vídeo" onClick={() => { setShowQuality((value) => !value); setShowChat(false); }} className={showQuality ? "bg-white/20" : ""}><Settings2 className="h-7 w-7" /></ControlButton>
              {showQuality && <div data-focus-trap data-quality-menu role="menu" className="absolute bottom-20 right-0 w-72 rounded-2xl border border-white/15 bg-[#121718] p-3 shadow-2xl"><p className="px-4 py-2 text-xs font-black uppercase tracking-widest text-white/40">Qualidade</p>{[{ index: -1, label: "Automática" }, ...levels].map((level) => <button key={level.index} type="button" data-tv-focus="true" data-autofocus={quality === level.index ? "" : undefined} tabIndex={0} onClick={() => { if (hlsRef.current) hlsRef.current.currentLevel = level.index; setQuality(level.index); setShowQuality(false); window.setTimeout(() => rootRef.current?.querySelector<HTMLElement>("[data-quality-button]")?.focus(), 0); }} className={`tv-focus flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-lg font-semibold ${quality === level.index ? "bg-white/10 text-[#d9ff63]" : ""}`}>{level.label}{quality === level.index && <Check className="h-5 w-5" />}</button>)}</div>}
            </div>}
            
            </div>}
            <ControlButton label={fullscreen ? "Sair da tela cheia" : "Tela cheia"} onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void rootRef.current?.requestFullscreen().catch(() => undefined); revealControls(); }}>{fullscreen ? <Minimize className="h-7 w-7" /> : <Maximize className="h-7 w-7" />}</ControlButton>
          </div>
        </div>
        <p className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-white/25">{isEmbed ? "Use os controles da própria transmissão • Tela cheia disponível aqui" : "OK reproduz/pausa • Setas navegam • Voltar fecha os controles"}</p>
      </div>

      {showChat && <aside className="absolute bottom-0 right-0 top-0 z-30 flex w-[480px] flex-col border-l border-white/10 bg-[#0c1011]/95 p-6 pt-28 shadow-2xl backdrop-blur-xl" aria-label="Chat desta sala">
        <div className="flex items-center justify-between"><div><h2 className="text-2xl font-bold">Chat desta sala</h2><p className="mt-1 text-sm text-white/40">Conversa persistente deste canal</p></div><ControlButton label="Fechar chat" onClick={() => setShowChat(false)}><X className="h-6 w-6" /></ControlButton></div>
        <div className="no-scrollbar mt-5 flex-1 space-y-4 overflow-y-auto border-y border-white/8 py-5">
          {!messages.length && !chatError && <div className="rounded-2xl bg-white/5 p-5 text-lg leading-relaxed text-white/45">Nenhuma mensagem ainda. Escreva abaixo para iniciar a conversa desta sala.</div>}
          {messages.map((message) => <div key={message.id} className="rounded-2xl bg-white/5 p-4"><div className="flex items-center justify-between"><strong className="text-base text-[#d9ff63]">{message.author}</strong><span className="text-xs text-white/30">{new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(message.createdAt))}</span></div><p className="mt-2 break-words text-lg text-white/75">{message.message}</p></div>)}
          {chatError && <p role="alert" className="rounded-xl bg-[#ff4d53]/10 p-4 text-base text-[#ff9296]">{chatError}</p>}<div ref={chatEndRef} />
        </div>
        <form onSubmit={submitChat} className="mt-5"><label htmlFor="chat-message" className="text-sm font-bold uppercase tracking-wider text-white/40">Sua mensagem</label><textarea id="chat-message" data-tv-focus="true" tabIndex={0} value={chatInput} onChange={(event) => setChatInput(event.target.value)} maxLength={280} rows={3} placeholder="Selecione OK para digitar" className="mt-3 w-full resize-none rounded-2xl border border-white/12 bg-white/6 p-4 text-lg outline-none placeholder:text-white/25 focus:border-[#d9ff63]" /><div className="mt-3 flex items-center justify-between"><span className="text-sm text-white/30">{chatInput.length}/280</span><button type="submit" data-tv-focus="true" tabIndex={0} disabled={sending || !chatInput.trim()} className="tv-focus flex h-13 items-center gap-2 rounded-full bg-[#d9ff63] px-5 font-bold text-black disabled:opacity-35"><Send className="h-5 w-5" /> Enviar</button></div></form>
      </aside>}

      {error && <div role="alert" data-focus-trap className="absolute inset-0 z-50 grid place-items-center bg-[#080b0c]/95 p-12"><div className="max-w-[760px] text-center"><div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[#ff4d53]/10"><RefreshCw className="h-11 w-11 text-[#ff6b70]" /></div><h2 className="mt-7 text-5xl font-black tracking-[-0.05em]">Sinal interrompido</h2><p className="mt-5 text-2xl leading-relaxed text-white/55">{error}</p><div className="mt-9 flex justify-center gap-4"><button type="button" data-tv-focus="true" data-autofocus data-error-retry tabIndex={0} onClick={() => setReloadKey((value) => value + 1)} className="tv-focus flex h-16 items-center gap-3 rounded-full bg-[#d9ff63] px-8 text-xl font-black text-black"><RefreshCw className="h-6 w-6" /> Tentar novamente</button><button type="button" data-tv-focus="true" tabIndex={0} onClick={() => router.back()} className="tv-focus h-16 rounded-full border border-white/15 px-8 text-xl font-bold">Voltar</button></div></div></div>}
    </div>
  );
}
