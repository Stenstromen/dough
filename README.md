# Dough

A responsive finance widget app for Cloudflare Pages. Switch between calculators from the sidebar (desktop) or bottom dock (mobile).

## Widgets

- **Loan-to-value (LTV)** — enter property value and mortgage balance to see your ratio, equity, and leverage band.
- **Monthly payment** — split a mortgage into parts with different rates, choose what to amortize, and view a 12-month payment plan.
- **Financing planner** — compare original vs adjusted consumer-financing installments, costs, and an expandable payment schedule.

## UI structure

Reusable UI lives under `src/components` using atomic design:

- **Atoms** — `Button`, `Input`, `Label`, `Checkbox`, `Badge`, `Text`, `Meter`, `Stack`, `Surface`
- **Molecules** — `Field`, `Stat`, `Brand`, `Metric`, `BreakdownList`
- **Organisms** — `AppShell`, `WidgetFrame`, `ResultPanel`, `DataTable`

Import from `src/components`. Design tokens live in `src/design/tokens.css`.

## Develop

```bash
npm install
npm run dev
npm test
```

## Deploy to Cloudflare Pages

```bash
npm run deploy
```

Or connect the repo in the Cloudflare dashboard:

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Framework preset:** Vite
