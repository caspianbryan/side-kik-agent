# Zola

Zola is one place to see and run your WhatsApp services bot: inbox, leads, 2-week targets and the checklists the bot sends. The same bot later gets cloned for SME clients.

## Run it locally

```bash
cp .env.example .env.local   # then set HUB_PASSWORD
npm install
npm run dev
```

Open http://localhost:3000 and sign in with your `HUB_PASSWORD`. No database to install: it uses **PGlite** (Postgres in WASM) stored in `./data`, and creates the tables, the 5 services and some demo data on first start.

- **Simulator**: chat with the bot as a customer. It runs the same code as the real webhook.
- **Inbox**: every chat, with your own replies.
- **Leads**: done-for-you requests (the bot adds one when someone replies `AGENT`) and SME clients.
- **Checklists**: edit what the bot sends. Changes apply from the next message.
- **Dashboard**: progress against the targets in `src/lib/targets.ts`.
- **Settings**: switch the bot between the government-services helper and a **shop** (products, delivery areas, orders).
- **Products / Orders**: the shop catalogue, and orders the bot takes. Customers paste their M-Pesa message to claim payment; **Orders → Reconcile M-Pesa** matches the messages *you* received and marks orders verified. The matching code lives in `src/lib/mpesa/` with no app dependencies, so it can move to a shared payments service later.

### Using Neon instead

1. In Neon, create a **new database** for the hub (not Rada's) and copy its connection string.
2. Put it in `.env.local` as `DATABASE_URL=...`
3. Run `npm run db:migrate` once. It creates the tables and the 5 services. Add `-- --demo` to also load demo chats.
   It refuses to run on a database that already has other apps' tables.
4. `npm run dev`

Leave `DATABASE_URL` empty to go back to the local database.

Clear the demo data from the dashboard banner before you go live. To start from zero, stop the server and delete the `data` folder.

## Deploying to Vercel

In Vercel → your project → Settings → Environment Variables, add `HUB_PASSWORD` and `DATABASE_URL` (your Neon URL), plus the `WHATSAPP_*` values when you have them. Then redeploy. Until both are set, Zola shows a setup guide instead of the sign-in page.

## Going live with WhatsApp

1. At developers.facebook.com, create an app (type **Business**) and add **WhatsApp**. Meta gives you a test number and a temporary token.
2. Put these in `.env.local`: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_APP_SECRET` (App settings → Basic) and a `WHATSAPP_VERIFY_TOKEN` that you make up.
3. Meta has to reach your webhook over HTTPS. Either:
   - deploy (Vercel + Neon, like Rada: set `DATABASE_URL`, run `npm run db:migrate` once), or
   - for a quick local test, open a tunnel (for example `cloudflared tunnel --url http://localhost:3000`).
4. In Meta → WhatsApp → Configuration, set the callback URL to `https://<your-domain>/api/whatsapp`, paste the same verify token and subscribe to **messages**.
5. Send "Hi" from your phone to the test number. The sidebar dot turns green once the token is set.

The temporary token expires after about a day. For anything lasting, create a System User token in Meta Business settings.

## Look and feel

UI components are [shadcn/ui](https://ui.shadcn.com) (in `src/components/ui`), themed in `src/app/globals.css`. Dark is the default; switch under **Appearance** in the sidebar. Add more components with `npx shadcn@latest add <name>`.

## Notes

- `/api/whatsapp` is the only route without the password, so Meta can reach it. Signatures are checked when `WHATSAPP_APP_SECRET` is set.
- Free-form replies only reach people who messaged you in the last 24 hours (Meta's rule). That always applies to the bot, which only ever replies.
- Never commit `.env.local` (it's in `.gitignore`).
- Schema change? Edit `src/db/schema.ts`, then run `npm run db:generate`. Local PGlite applies it on the next start; on Neon, run `npm run db:migrate`.
