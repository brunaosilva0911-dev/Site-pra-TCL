"use client";

import { CheckCircle2, WifiOff } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ContentKind, FavoriteRecord, ReminderRecord } from "@/lib/types";

type FavoriteInput = { itemId: string; itemType: ContentKind; title: string; image?: string };
type ReminderInput = { eventId: string; title: string; startsAt: string };
type LibraryContextValue = {
  favorites: FavoriteRecord[];
  reminders: ReminderRecord[];
  loading: boolean;
  error: string | null;
  isFavorite: (id: string) => boolean;
  isReminder: (id: string) => boolean;
  toggleFavorite: (item: FavoriteInput) => Promise<void>;
  toggleReminder: (item: ReminderInput) => Promise<void>;
  refresh: () => Promise<void>;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [reminders, setReminders] = useState<ReminderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [favoriteResponse, reminderResponse] = await Promise.all([fetch("/api/favorites"), fetch("/api/reminders")]);
      if (!favoriteResponse.ok || !reminderResponse.ok) throw new Error("Não foi possível carregar sua biblioteca");
      const [favoriteData, reminderData] = await Promise.all([favoriteResponse.json(), reminderResponse.json()]);
      setFavorites(favoriteData.items ?? []);
      setReminders(reminderData.items ?? []);
      setError(null);
    } catch {
      setError("Biblioteca offline. Seus dados permanecem salvos no servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, [refresh]);

  const toggleFavorite = useCallback(async (item: FavoriteInput) => {
    const exists = favorites.some((favorite) => favorite.itemId === item.itemId);
    setFavorites((current) => exists ? current.filter((favorite) => favorite.itemId !== item.itemId) : [{ ...item, createdAt: new Date().toISOString() }, ...current]);
    try {
      const response = await fetch(exists ? `/api/favorites?itemId=${encodeURIComponent(item.itemId)}` : "/api/favorites", {
        method: exists ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        ...(exists ? {} : { body: JSON.stringify(item) }),
      });
      if (!response.ok) throw new Error();
      notify(exists ? "Removido da Minha lista" : "Salvo na Minha lista");
    } catch {
      setFavorites((current) => exists ? current : current.filter((favorite) => favorite.itemId !== item.itemId));
      notify("Não foi possível atualizar. Tente novamente.");
    }
  }, [favorites, notify]);

  const toggleReminder = useCallback(async (item: ReminderInput) => {
    const exists = reminders.some((reminder) => reminder.eventId === item.eventId);
    setReminders((current) => exists ? current.filter((reminder) => reminder.eventId !== item.eventId) : [{ ...item, createdAt: new Date().toISOString() }, ...current]);
    try {
      const response = await fetch(exists ? `/api/reminders?eventId=${encodeURIComponent(item.eventId)}` : "/api/reminders", {
        method: exists ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        ...(exists ? {} : { body: JSON.stringify(item) }),
      });
      if (!response.ok) throw new Error();
      notify(exists ? "Lembrete removido" : "Lembrete salvo em Minha lista");
    } catch {
      setReminders((current) => exists ? current : current.filter((reminder) => reminder.eventId !== item.eventId));
      notify("Não foi possível salvar o lembrete.");
    }
  }, [reminders, notify]);

  const value = useMemo<LibraryContextValue>(() => ({
    favorites, reminders, loading, error,
    isFavorite: (id) => favorites.some((item) => item.itemId === id),
    isReminder: (id) => reminders.some((item) => item.eventId === id),
    toggleFavorite, toggleReminder, refresh,
  }), [favorites, reminders, loading, error, toggleFavorite, toggleReminder, refresh]);

  return (
    <LibraryContext.Provider value={value}>
      {children}
      <div aria-live="polite" className={`pointer-events-none fixed bottom-10 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-3 rounded-2xl border px-6 py-4 text-lg font-semibold shadow-2xl transition-all duration-300 ${toast ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} ${error ? "border-white/15 bg-[#181c1d]" : "border-[#d9ff63]/30 bg-[#151b13]"}`}>
        {error ? <WifiOff className="h-6 w-6 text-white/60" /> : <CheckCircle2 className="h-6 w-6 text-[#d9ff63]" />}
        <span>{toast}</span>
      </div>
    </LibraryContext.Provider>
  );
}

export function useLibrary() {
  const value = useContext(LibraryContext);
  if (!value) throw new Error("useLibrary must be used inside LibraryProvider");
  return value;
}
