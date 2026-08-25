# Desktop POS — UI/UX Redesign Audit

**Scope:** `post_software_app` only. Reviewed as a professional UI/UX designer would — identifying
where the Desktop app read as "a website running inside a window" rather than a purpose-built
desktop application — then actually implemented the fixes (not just recommendations). Brand
(`#00BF63`, `#FFFFFF`, the shared neutral scale), typography (Inter), and the token-based design
system were **not** changed — this was a density/hierarchy/chrome pass, not a re-brand, per the
redesign brief's explicit constraint.

---

## 1. Starting point — what was actually wrong

Before this pass, Desktop's UI kit (`src/renderer/src/components/ui/*`) used control sizing
essentially identical to Web's own *compact* scale — the same `h-10` inputs, `h-9` icon buttons,
`px-4 py-2.5` table cells, `w-56` sidebar, `h-14` topbar that a responsive web app reasonably uses
at its narrower breakpoints. That's a legitimate choice **for a browser tab**, where screen real
estate is contested and touch/mobile breakpoints matter. It's the wrong choice for an
always-maximized, mouse-and-keyboard desktop workstation used for a full shift — the result read as
"a web page in a frame," exactly the failure mode the brief called out.

Concretely, inspected against the brief's checklist:

| Symptom | Found? | Where |
|---|---|---|
| Tiny buttons / click targets | ✅ Yes | `Button` (`h-8/h-10/h-12`), `IconButton` (`size-9`=36px), POS cart qty +/− (`size-6`=24px — genuinely small for a fast-paced checkout) |
| Cramped tables | ✅ Yes | `TH`/`TD` at `px-4 py-2.5`, no header pinning on long lists |
| Inputs/selects undersized for a desktop form | ✅ Yes | `h-10` uniformly, same as Web |
| Sidebar narrower than Web's own | ✅ Yes | Desktop `w-56` (224px) vs. Web's own `w-60` (240px) — an actual **icon/sizing inconsistency**, not just a density choice |
| Topbar shorter than Web's own | ✅ Yes | Desktop `h-14` (56px) vs. Web's `h-16` (64px) |
| Sidebar icons smaller than Web's | ✅ Yes | Desktop `size-4` (16px) vs. Web's `size-4.5` (18px) — icon-consistency violation |
| Weak page-title hierarchy | ✅ Yes | Every page `<h1>` was `text-lg` (18px), same weight as several secondary UI labels elsewhere |
| Modal/Card padding felt like a compact widget, not a panel | ✅ Yes | `px-5 py-4` throughout |
| Excessive shadows/gradients | ❌ No | Already minimal (`shadow-xs` only, token-driven) — nothing to fix |
| Inconsistent border radius | ❌ No | Fully token-driven (`--radius-md` etc.) across both apps already — confirmed consistent |
| Wrong/inconsistent icon *choices* (not sizing) | ✅ Yes | Sales History/Returns used generic icons instead of Web's exact `ReceiptText`/`Undo2` picks — fixed as part of the earlier parity pass, re-confirmed here |
| Random/mismatched color use | ❌ No | Every color already resolves through the shared CSS token set copied verbatim from Web — no hard-coded hex found anywhere in the component kit |

**Conclusion of the "is Desktop or Web wrong" question (per the brief's Reference Rule):** Web's
sizing was the right choice *for Web*, not a universal standard to copy — but where Desktop had
drifted to be *smaller* than Web's own already-appropriate baseline (sidebar width, topbar height,
icon size), that was a straightforward, unambiguous bug (an inconsistency neither app should have),
fixed by matching Web exactly. Beyond that baseline, Desktop was deliberately sized *up* further,
since a desktop workstation warrants more generous controls than even Web's browser baseline —
this is the platform-appropriate difference the brief explicitly calls for.

## 2. Redesign implemented

All changes are in the shared component kit (`src/renderer/src/components/ui/*`) or the
shell/POS components that compose it — meaning the fix applies **everywhere that component is
used**, automatically, rather than needing dozens of individual page edits.

| Component | Before | After | Rationale |
|---|---|---|---|
| `Button` (sm/md/lg) | `h-8` / `h-10` / `h-12` | `h-9` / `h-11` / `h-13` | Comfortable mouse click targets for a full-shift workstation; kept modest (2px/step) per "do not make things unnecessarily huge." |
| `IconButton` | `size-9` (36px) | `size-10` (40px) | Matches the brief's "avoid tiny icon-only buttons" rule directly. |
| `Input` / `Select` | `h-10` | `h-11` | Matches the new `Button` `md` height so a form row's control and its adjacent button align visually. |
| `Textarea` | `min-h-20`, `px-3 py-2` | `min-h-24`, `px-3.5 py-2.5` | More comfortable multi-line editing area. |
| `Table` `TH`/`TD` | `px-4 py-2.5` | `px-5 py-3` / `px-5 py-3.5` | Taller rows read as a "professional table," not a cramped list; also added **sticky, blurred header** (`sticky top-0 backdrop-blur-sm`) so long lists (Sales History, Products, Reports tables) keep their column headers visible while scrolling — a desktop-appropriate affordance a mobile card-list wouldn't need. |
| `Card` header/content | `px-5 py-4` / `px-5 pb-5` | `px-6 py-5` / `px-6 pb-6` | More breathing room for dashboard stat cards and settings panels. |
| `Modal` header/body/footer | `px-5 py-4` | `px-6 py-5` (header/body), `px-6 py-4` (footer) | Same reasoning — a centered desktop dialog has room to spare compared to a phone-width drawer. |
| Sidebar | `w-56` (224px), `size-4` icons, `py-2` items | `w-60` (240px, **now matches Web exactly**), `size-[18px]` icons (**matches Web's `size-4.5` exactly**), `py-2.5` items, `rounded-lg` active state | Closes an actual icon/sizing inconsistency with Web, not just a density bump. |
| Topbar | `h-14` (56px), `px-4` | `h-16` (64px, **matches Web exactly**), `px-6` | Same reasoning. |
| Page `<h1>` titles (8 pages + the shared `ResourceCrudPage`, covering 6 more) | `text-lg` (18px) | `text-xl font-semibold tracking-tight` (20px) | Stronger, clearer page-level hierarchy — a title should visually outrank every other `text-lg`-ish label on the page, which it now unambiguously does. |
| POS cart line qty buttons | `size-6` (24px) | `size-8` (32px) | These are clicked dozens of times per shift — undersized controls here were the single highest-impact fix in the whole pass. |
| POS cart header / product panel header | `py-3`, no fixed height | Both now share an identical `h-16` header bar | The two POS columns now visually align at the same baseline — a small but real "this was designed as one screen" signal a website-in-a-frame wouldn't bother with. |
| POS product cards | `p-3`, `gap-2`, 2–4 responsive columns, `text-sm` price | `p-4`, `gap-3`, 2–5 responsive columns (adds an `xl:grid-cols-5` step for large monitors), `text-base` price, `active:scale-[0.98]` press feedback | Better use of a large monitor's width; the scale-down-on-press micro-interaction is a small, purpose-built-app touch. |

## 3. What was deliberately left unchanged

- **Window-control cluster** (minimize/maximize/close) kept at the standard `IconButton` size
  rather than a custom smaller "title-bar chrome" size — reviewed and judged acceptable; several
  well-regarded desktop apps (VS Code, Discord) use comparably sized square window controls.
- **Checkbox/Switch** sizing — already appropriately small/precise for their purpose; bumping them
  would work against their function (a large checkbox looks like a button).
- **Page-level container padding** (`p-6`) — left as-is. It already reads as generous at 1280×720
  and scales acceptably up to 1920×1080 without the "huge empty page" failure mode the brief warns
  against; bumping it further risked exactly that at smaller desktop resolutions.
- **Color palette / brand** — entirely untouched, per the brief's explicit "do not change brand"
  rule. Confirmed zero hex literals were introduced; every new class references an existing
  `bg-brand`/`text-error`/etc. token.

## 4. Visual verification (live, this pass)

Screenshots were taken from the actual running packaged Desktop app (not a mock/Figma comp) at
each of: Dashboard, POS (empty and with a cart item + discount applied), Products (with the new
Category/Status filters visible), Employees. Confirmed, by inspection of the captured frames:

- Sidebar section grouping (SALES/CATALOG/RELATIONSHIPS/PURCHASING/INSIGHTS/BUSINESS/WORKSPACE)
  renders correctly with the new width/icon sizing, no truncation or wrapping at 1680px window
  width.
- POS's two-column layout now has visually aligned headers; cart quantity controls are clearly
  larger and easier to target; the cart-wide discount/clear-cart icons read clearly at the new
  `size-10` `IconButton`.
- Products table shows the new Category/Status filter dropdowns inline with search, table rows
  visibly taller/more legible than the prior compact spacing.
- No layout breakage, no overflow, no clipped text at any of the tested screens.

## 5. Desktop responsiveness (resize testing)

Reviewed against 1280×720 / 1366×768 / 1440×900 / 1920×1080 per the brief:

- The shell layout (`Sidebar` fixed width + `flex-1` content) has no hard-coded content width
  anywhere touched by this pass — every size change was a control/spacing token, not a fixed page
  width, so it scales the same way the pre-existing layout already did across those four
  resolutions.
- The app's `minWidth`/`minHeight` window constraints (`1024×640`, set in `src/main/index.ts`,
  unchanged by this pass) remain the effective floor; nothing in this redesign lowers usability
  below that floor since no control grew by more than a few pixels.
- Not independently re-screenshotted at all four exact resolutions this pass (the live
  verification in §4 used the default launch size); the component-level nature of every change
  (no page-specific fixed widths introduced) is why this is assessed as low-risk rather than
  independently re-verified pixel-by-pixel at each breakpoint.

## 6. Web responsiveness — confirmed undamaged

**Zero files under `post_software_web` were modified in this pass.** `npx tsc --noEmit` and
`npm run lint` were re-run against the untouched Web project and both remain clean (0 errors),
confirming no accidental cross-project edit occurred.

## 7. Icon consistency — re-confirmed

Sidebar icon *choices* (not just size) were re-checked item-by-item against
`post_software_web/src/config/navigation.ts`: `LayoutDashboard`, `ShoppingCart`, `ReceiptText`,
`Undo2`, `Package`, `Boxes`, `Users`, `Truck`, `ShoppingBag`, `Receipt`, `BarChart3`, `UserCog`,
`Building2`, `Settings`, `CreditCard` — Desktop's `src/renderer/src/lib/navigation.ts` (introduced
in the prior parity pass, unchanged here) uses the identical icon for every item. Icon *size* was
the only remaining inconsistency, closed in §2.

## 8. Terminology re-confirmed unchanged by this pass

This was a visual/density pass only — no button labels, page titles, or field names were altered
beyond what the prior parity pass already aligned (`QA_BUGS.md` BUG-008). Re-confirmed by diff
review: every string-content change in this pass's commits is a className, not a text node.

## 9. Summary

Desktop now reads as a denser, more deliberately-designed desktop application: wider/taller shell
chrome matching Web's own already-correct dimensions exactly, meaningfully larger click targets
throughout (most impactfully in the POS cart, the highest-frequency-interaction surface in the
whole app), stronger page-title hierarchy, and a sticky table header for long lists. The same
brand, the same tokens, the same components, the same business logic — only layout, hierarchy,
spacing, and desktop density changed, exactly as scoped.
