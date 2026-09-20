import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Settings is a place, not a panel.
 *
 * The open section lives in the address as `?settings=<section>`, and that
 * address works cold: paste it, reload, come back tomorrow, and it opens on
 * that section. That is what lets you send someone a link to the exact setting
 * you mean.
 */

export const SETTINGS_PARAM = "settings";

export const SETTINGS_SECTIONS = [
  { id: "account", label: "Account" },
  { id: "money", label: "Money" },
] as const;

export type SettingsSectionId = (typeof SETTINGS_SECTIONS)[number]["id"];

export const DEFAULT_SETTINGS_SECTION: SettingsSectionId = "account";

function parse(raw: string | null): SettingsSectionId | null {
  if (!raw) return null;
  const match = SETTINGS_SECTIONS.find((section) => section.id === raw);
  return match ? match.id : null;
}

export function useSettingsUrl() {
  const [params, setParams] = useSearchParams();
  const section = parse(params.get(SETTINGS_PARAM));

  const openSettings = useCallback(
    (next: SettingsSectionId = DEFAULT_SETTINGS_SECTION) => {
      setParams(
        (current) => {
          const updated = new URLSearchParams(current);
          updated.set(SETTINGS_PARAM, next);
          return updated;
        },
        { replace: false },
      );
    },
    [setParams],
  );

  const closeSettings = useCallback(() => {
    setParams(
      (current) => {
        const updated = new URLSearchParams(current);
        updated.delete(SETTINGS_PARAM);
        return updated;
      },
      { replace: false },
    );
  }, [setParams]);

  return useMemo(
    () => ({ section, isOpen: section !== null, openSettings, closeSettings }),
    [section, openSettings, closeSettings],
  );
}
