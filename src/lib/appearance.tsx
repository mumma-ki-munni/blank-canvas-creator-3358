import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Appearance — the one setting that lives in the account menu.
 *
 * Three values, cycled in place: light → dark → auto → light. "auto" follows
 * the operating system. The account menu shows the current value in its own row
 * and does NOT close when you pick a new one, so you can look at the page
 * behind the open menu and click again until it is right.
 */

export type Appearance = "light" | "dark" | "auto";

const STORAGE_KEY = "theme";
const ORDER: Appearance[] = ["light", "dark", "auto"];

/** Older builds wrote "system"; treat it as "auto" so nobody loses their choice. */
export function readAppearance(): Appearance {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === "light" || raw === "dark") return raw;
  return "auto";
}

/** Paint the choice onto <html>. Exported so the boot script can call it too. */
export function applyAppearance(value: Appearance): void {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = value === "dark" || (value === "auto" && prefersDark);
  document.documentElement.classList.toggle("dark", dark);
}

interface AppearanceContextValue {
  appearance: Appearance;
  /** Move to the next value in place — the menu's whole behaviour. */
  cycleAppearance: () => void;
  setAppearance: (value: Appearance) => void;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({ children }: { children: ReactNode }) {
  const [appearance, setAppearanceState] = useState<Appearance>(() =>
    readAppearance(),
  );

  const setAppearance = useCallback((value: Appearance) => {
    setAppearanceState(value);
    window.localStorage.setItem(STORAGE_KEY, value);
    applyAppearance(value);
  }, []);

  const cycleAppearance = useCallback(() => {
    setAppearanceState((current) => {
      const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
      window.localStorage.setItem(STORAGE_KEY, next);
      applyAppearance(next);
      return next;
    });
  }, []);

  // On "auto", follow the OS while the tab is open — not just at boot.
  useEffect(() => {
    if (appearance !== "auto") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handle = () => applyAppearance("auto");
    media.addEventListener("change", handle);
    return () => media.removeEventListener("change", handle);
  }, [appearance]);

  const value = useMemo(
    () => ({ appearance, cycleAppearance, setAppearance }),
    [appearance, cycleAppearance, setAppearance],
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error("useAppearance must be used inside AppearanceProvider");
  return ctx;
}
