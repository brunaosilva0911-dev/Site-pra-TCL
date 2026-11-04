"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from "react";

type Direction = "left" | "right" | "up" | "down";
const focusSelector = '[data-tv-focus="true"]:not([disabled]):not([aria-disabled="true"])';
const directionKeys: Record<string, Direction | undefined> = {
  ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down",
};
const backKeys = new Set(["Escape", "BrowserBack", "GoBack"]);

type NavigationContextValue = { focusFirst: (scope?: ParentNode) => void };
const NavigationContext = createContext<NavigationContextValue>({ focusFirst: () => undefined });

function isVisible(element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none" && !element.closest("[hidden]");
}

function topScope(active: HTMLElement | null): HTMLElement | null {
  const scopes = Array.from(document.querySelectorAll<HTMLElement>("[data-focus-trap]")).filter(isVisible);
  if (active) {
    const own = active.closest<HTMLElement>("[data-focus-trap]");
    if (own) return own;
  }
  return scopes.at(-1) ?? null;
}

export function SpatialNavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const focusFirst = useCallback((scope: ParentNode = document) => {
    const target = scope.querySelector<HTMLElement>("[data-autofocus]") ?? scope.querySelector<HTMLElement>(focusSelector);
    target?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (topScope(document.activeElement as HTMLElement)) return;
      const main = document.querySelector<HTMLElement>("main");
      const target = main?.querySelector<HTMLElement>("[data-autofocus]");
      target?.focus({ preventScroll: true });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const move = (direction: Direction) => {
      const active = document.activeElement as HTMLElement | null;
      const scope = topScope(active);
      const root: ParentNode = scope ?? document;
      const candidates = Array.from(root.querySelectorAll<HTMLElement>(focusSelector)).filter((element) => isVisible(element) && element !== active);
      if (!active || !active.matches(focusSelector)) {
        focusFirst(root);
        return;
      }
      const origin = active.getBoundingClientRect();
      const ox = origin.left + origin.width / 2;
      const oy = origin.top + origin.height / 2;
      let winner: HTMLElement | null = null;
      let bestScore = Number.POSITIVE_INFINITY;

      for (const candidate of candidates) {
        const rect = candidate.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = cx - ox;
        const dy = cy - oy;
        const horizontal = direction === "left" || direction === "right";
        const primary = horizontal ? (direction === "right" ? dx : -dx) : (direction === "down" ? dy : -dy);
        if (primary <= 4) continue;
        const cross = horizontal ? Math.abs(dy) : Math.abs(dx);
        const primaryLength = horizontal ? Math.abs(dx) : Math.abs(dy);
        const overlap = horizontal
          ? Math.min(origin.bottom, rect.bottom) - Math.max(origin.top, rect.top)
          : Math.min(origin.right, rect.right) - Math.max(origin.left, rect.left);
        const anglePenalty = cross / Math.max(primaryLength, 1) > 2.4 ? 1000 : 0;
        const sameRow = active.dataset.navRow && active.dataset.navRow === candidate.dataset.navRow;
        const score = primary + cross * (overlap > 0 ? 0.65 : 2.25) + (overlap > 0 ? 0 : 260) + anglePenalty - (sameRow ? 80 : 0);
        if (score < bestScore) {
          bestScore = score;
          winner = candidate;
        }
      }

      if (!winner && direction === "left" && !active.closest("[data-sidebar]")) {
        winner = document.querySelector<HTMLElement>('[data-sidebar] [aria-current="page"]') ?? document.querySelector<HTMLElement>(`[data-sidebar] ${focusSelector}`);
      }
      if (!winner && scope) {
        const trapped = Array.from(scope.querySelectorAll<HTMLElement>(focusSelector)).filter(isVisible);
        const index = trapped.indexOf(active);
        if (trapped.length && (direction === "right" || direction === "down")) winner = trapped[(index + 1) % trapped.length];
        if (trapped.length && (direction === "left" || direction === "up")) winner = trapped[(index - 1 + trapped.length) % trapped.length];
      }
      winner?.focus({ preventScroll: true });
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const key = event.key || ({ 37: "ArrowLeft", 38: "ArrowUp", 39: "ArrowRight", 40: "ArrowDown", 13: "Enter", 461: "GoBack", 10009: "GoBack" } as Record<number, string>)[event.keyCode];
      const direction = directionKeys[key];
      if (direction) {
        const target = event.target as HTMLElement;
        if ((target instanceof HTMLInputElement && ["text", "search", "email", "password"].includes(target.type)) || target instanceof HTMLTextAreaElement) {
          if (direction === "left" || direction === "right") return;
        }
        event.preventDefault();
        move(direction);
        return;
      }
      if (backKeys.has(key) || event.keyCode === 461 || event.keyCode === 10009 || (key === "Backspace" && !(event.target instanceof HTMLInputElement))) {
        event.preventDefault();
        const backEvent = new CustomEvent("viva:back", { cancelable: true });
        window.dispatchEvent(backEvent);
        if (!backEvent.defaultPrevented) {
          const active = document.activeElement as HTMLElement | null;
          if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) active.blur();
          else if (window.history.length > 1) window.history.back();
        }
        return;
      }
      if ((key === "Enter" || key === " ") && event.target instanceof HTMLElement) {
        const target = event.target;
        if (target.getAttribute("role") === "button" && !["BUTTON", "A", "INPUT"].includes(target.tagName)) {
          event.preventDefault();
          target.click();
        }
      }
    };

    const onFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (!target.matches?.(focusSelector)) return;
      document.documentElement.dataset.tvFocused = "true";
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.reducedMotion === "true";
      window.requestAnimationFrame(() => target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest", inline: "center" }));
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocus);
    };
  }, [focusFirst]);

  const value = useMemo(() => ({ focusFirst }), [focusFirst]);
  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
}

export function useSpatialNavigation() {
  return useContext(NavigationContext);
}
