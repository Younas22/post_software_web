import type { BrandTheme, BusinessTypeBranding, SidebarStyle, Terminology } from "@/types";

/**
 * Per-business-type branding: the one Universal POS codebase re-skins and
 * re-words itself for each trade (colours, sidebar style, login copy,
 * "Patient" vs "Customer"). The data comes from the Super Admin's
 * Business Types screen via GET /config (logged in) or
 * GET /public/branding/{slug} (the branded /login/{slug} page).
 */

export const DEFAULT_TERMS: Terminology = {
  customer: "Customer",
  customers: "Customers",
  product: "Product",
  products: "Products",
  sale: "Sale",
  sales: "Sales",
  supplier: "Supplier",
  suppliers: "Suppliers",
  purchase: "Purchase",
  purchases: "Purchases",
  category: "Category",
  categories: "Categories",
  inventory: "Inventory",
  pos: "POS",
};

export const DEFAULT_BRAND_COLOR = "#00bf63";

export const DEFAULT_THEME: BrandTheme = {
  primary_color: DEFAULT_BRAND_COLOR,
  sidebar_style: "light",
  login_headline: "Run your business from one place",
  login_tagline: "Sales, stock, customers and reports — all in one fast, simple POS.",
  login_highlights: ["Lightning-fast checkout", "Live stock across branches", "Reports that make sense"],
  login_image_url: null,
};

export function resolveTerms(branding?: BusinessTypeBranding | null): Terminology {
  return { ...DEFAULT_TERMS, ...(branding?.terminology ?? {}) };
}

export function resolveTheme(branding?: BusinessTypeBranding | null): BrandTheme {
  return { ...DEFAULT_THEME, ...(branding?.theme ?? {}) };
}

/* ───────────── colour maths ───────────── */

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: RGB): string {
  return `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;
}

/** Mix `color` toward `target` by `amount` (0–1). */
function mix(color: RGB, target: RGB, amount: number): RGB {
  return [0, 1, 2].map((i) => color[i] + (target[i] - color[i]) * amount) as RGB;
}

function luminance([r, g, b]: RGB): number {
  const c = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [0, 0, 0];

/** CSS custom properties consumed by globals.css (--brand, --brand-hover, ...). */
export function brandCssVars(hex: string): Record<string, string> {
  const rgb = hexToRgb(hex) ?? hexToRgb(DEFAULT_BRAND_COLOR)!;
  // Very light brand colours get dark text on top; everything else white.
  const fg = luminance(rgb) > 0.45 ? "#111111" : "#ffffff";
  return {
    "--brand": rgbToHex(rgb),
    "--brand-hover": rgbToHex(mix(rgb, BLACK, 0.1)),
    "--brand-active": rgbToHex(mix(rgb, BLACK, 0.2)),
    "--brand-fg": fg,
    "--brand-soft": rgbToHex(mix(rgb, WHITE, 0.9)),
    "--brand-soft-dark": rgbToHex(mix(rgb, BLACK, 0.78)),
    "--brand-deep": rgbToHex(mix(rgb, BLACK, 0.45)),
    "--brand-rgb": rgb.join(" "),
  };
}

/* ───────────── applying to the document ───────────── */

const BRAND_CACHE_KEY = "pos_brand";
const LOGIN_SLUG_KEY = "pos_login_slug";

const VAR_NAMES = Object.keys(brandCssVars(DEFAULT_BRAND_COLOR));

/**
 * Paints the brand colour + sidebar style onto <html>. Passing null resets
 * to the platform default. `persist` caches it so the next hard load paints
 * the right colours before React hydrates (see BRAND_PREPAINT_SCRIPT).
 */
export function applyBrandTheme(theme: Pick<BrandTheme, "primary_color" | "sidebar_style"> | null, persist = true) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  if (!theme) {
    VAR_NAMES.forEach((name) => root.style.removeProperty(name));
    root.removeAttribute("data-sidebar");
    if (persist) safeStorage.remove(BRAND_CACHE_KEY);
    return;
  }

  const vars = brandCssVars(theme.primary_color || DEFAULT_BRAND_COLOR);
  Object.entries(vars).forEach(([name, value]) => root.style.setProperty(name, value));
  const sidebar: SidebarStyle = theme.sidebar_style ?? "light";
  root.setAttribute("data-sidebar", sidebar);

  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = vars["--brand"];

  if (persist) safeStorage.set(BRAND_CACHE_KEY, JSON.stringify({ vars, sidebar }));
}

/**
 * Inline <head> script: re-applies the cached brand before first paint so a
 * restaurant's orange POS never flashes the default green on reload.
 */
export const BRAND_PREPAINT_SCRIPT = `(function(){try{var c=JSON.parse(localStorage.getItem("${BRAND_CACHE_KEY}")||"null");if(!c)return;var r=document.documentElement;for(var k in c.vars){r.style.setProperty(k,c.vars[k])}if(c.sidebar)r.setAttribute("data-sidebar",c.sidebar)}catch(e){}})();`;

/** Remembers which branded login page this user belongs to, so logout returns there. */
export function rememberLoginSlug(slug: string | null | undefined) {
  if (slug) safeStorage.set(LOGIN_SLUG_KEY, slug);
}

export function loginPath(): string {
  const slug = safeStorage.get(LOGIN_SLUG_KEY);
  return slug ? `/login/${encodeURIComponent(slug)}` : "/login";
}

const safeStorage = {
  get(key: string): string | null {
    try {
      return typeof window === "undefined" ? null : window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* storage blocked — branding still applies for this page view */
    }
  },
  remove(key: string) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
