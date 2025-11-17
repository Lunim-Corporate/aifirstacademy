export type Theme = "light" | "dark" | "auto";

const THEME_KEY = "theme-preference";

function isSystemDark() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {}

  const dark = theme === "dark" || (theme === "auto" && isSystemDark());
  document.documentElement.classList.toggle("dark", dark);
  // Helps native form controls match theme
  (document.documentElement as HTMLElement & { style: any }).style.colorScheme = dark ? "dark" : "light";
}

export function loadAndApplyTheme() {
  let stored: Theme = "auto";
  try {
    stored = (localStorage.getItem(THEME_KEY) as Theme) || "auto";
  } catch {}
  applyTheme(stored);

  // Attach a single global listener for system theme changes when using auto
  const w = window as any;
  if (!w.__themeListener) {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      let curr: Theme = "auto";
      try {
        curr = (localStorage.getItem(THEME_KEY) as Theme) || "auto";
      } catch {}
      if (curr === "auto") applyTheme("auto");
    };
    if (mql.addEventListener) mql.addEventListener("change", handler);
    else (mql as any).addListener(handler);
    w.__themeListener = { mql, handler };
  }
}

export function getStoredTheme(): Theme {
  try {
    return (localStorage.getItem(THEME_KEY) as Theme) || "auto";
  } catch {
    return "auto";
  }
}