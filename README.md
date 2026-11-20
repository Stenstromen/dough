# Dough

![Dough](./public/icons/icon-512-maskable.png)

A responsive finance widget app for Cloudflare Pages. Switch between calculators from the sidebar (desktop) or bottom dock (mobile).

## Widgets

- **Loan-to-value (LTV)** — enter property value and mortgage balance to see your ratio, equity, and leverage band.
- **Mortgage payment plan** — split a mortgage into parts with different rates, choose what to amortize, and view a 12-month payment plan.
- **Financing planner** — compare original vs adjusted consumer-financing installments, costs, and an expandable payment schedule.
- **50 / 30 / 20** — split monthly take-home pay into needs, wants, and savings targets.
- **Day budget** — divide remaining money by days until payday, minus known expenses.

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

### Budget sync (Pages Function + KV)

Day/week budget pages can sync via `/api/sync/:id`.

1. Create KV namespaces and put the ids in `wrangler.toml`:

```bash
npx wrangler kv namespace create SYNC
npx wrangler kv namespace create SYNC --preview
```

2. Set the server-only pepper (never expose this to the client):

```bash
cp .dev.vars.example .dev.vars
# edit WORKER_SECRET in .dev.vars

npx wrangler pages secret put WORKER_SECRET
```

3. Run with Functions locally:

```bash
npm run pages:dev
```

Plain `npm run dev` serves the Vite app only — sync API calls need `pages:dev` or a deployed Pages project.

## Deploy to Cloudflare Pages

```bash
npm run deploy
```

Or connect the repo in the Cloudflare dashboard:

- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Framework preset:** Vite
- Bind the `SYNC` KV namespace and set the `WORKER_SECRET` pages secret
