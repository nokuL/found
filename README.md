# Found Again website

Vite + React 19 + TypeScript + Tailwind CSS v4. Shop site with a cart and checkout. Payments run on
**Clover Hosted Checkout**, through small Netlify Functions in `netlify/functions/`.

## Run locally
Needs Node 20.19+ (Node 22 recommended).

    npm install
    npm run dev

With no Clover keys, checkout runs in **demo mode**: the whole flow works, and "Pay" goes straight to
the confirmation page without charging anything. Demo mode is refused on the live (production) site.

To test against the Clover sandbox locally, copy `.env.example` to `.env.local` and fill it in.
Locally, orders and sold items are kept in memory and reset when the dev server restarts.

## How checkout works
0. Products load from `GET /api/products`: your Clover inventory when connected, otherwise `FEATURED` in `src/data.ts`.
1. The cart lives in the browser (`src/cart.tsx`). Every listing is one of a kind, so there are no quantities.
2. `/checkout` collects contact details, then shipping (flat rate, continental US) or free pickup in Apex.
3. `POST /api/checkout` (`netlify/functions/checkout.ts`) re-reads prices and stock (from Clover when connected), rejects sold
   items, saves a pending order, and creates a Clover Hosted Checkout session. The browser goes to Clover's page.
4. Clover sends the customer back to `/order/success` (or `/order/cancelled`).
5. Clover calls `POST /api/clover-webhook`. On `APPROVED` the order is marked paid, each item's Clover stock drops
   by one (or it is marked sold locally without inventory), and the order is posted to the `order` Netlify Form, so
   you get an email. If a Clover stock update fails, that email says which items to set to 0 by hand.

Orders and sold items are stored in Netlify Blobs (stores `orders` and `sold`).

## Set up Clover
1. Create a Clover developer sandbox account and a test merchant.
2. Get the **Merchant ID** and a **private API token** with Ecommerce permissions.
3. In the Clover dashboard's Hosted Checkout settings, set the redirect URLs:
   - Success: `https://YOUR-SITE/order/success`
   - Failure and cancel: `https://YOUR-SITE/order/cancelled`
4. Add a Hosted Checkout webhook pointing to `https://YOUR-SITE/api/clover-webhook`, and copy its secret.
5. In Netlify > Site configuration > Environment variables, add the keys from `.env.example`.
   Set `CLOVER_ENV=production` only when you switch to your live merchant account.

## Clover inventory
Set `CLOVER_INVENTORY_TOKEN` and the shop lists your Clover items instead of the sample products.
Create the token in the Clover dashboard with **Inventory read and write** permission. Your Hosted Checkout
private key may also work here; if it is refused, create a separate token.

How to set up an item in Clover so it appears online:
- **Category** must be one of `Furniture`, `Electronics`, `Equipment`, or `Art` (or `Art & artifacts`).
  Items in any other category (or none) stay POS-only.
- **Price** is the online price. **Hidden** items are left off the site.
- **Alternate name** becomes the short note under the title ("New gas cylinder, mesh steamed").
- **Tags** (optional): a grade tag `Like new`, `Excellent`, or `Good`, and a retail tag like `Retail 1795`
  for the struck-through price and "% below retail" badge.
- **Stock**: when the count reaches 0 the item shows "Sold". Items without stock tracking are always available,
  until an online sale sets their stock to 0. To relist, set stock back to 1.

The list refreshes about every minute. Checkout always re-checks Clover, so a sold item can't be bought twice
through the site. (An in-store sale during someone's online checkout can still overlap; refund one.)
Photos are not pulled from Clover yet; the site shows category icons.

## Deploy to Netlify
1. Push this folder to a GitHub repo.
2. Netlify > Add new site > Import from Git > pick the repo. Build settings come from `netlify.toml`.
3. Site configuration > Forms > enable form detection, then redeploy once. The `order` and `contact`
   forms will appear. Turn on email notifications for `order` so you hear about every sale.

Drag-and-drop deploys (app.netlify.com/drop) do not include the functions, so checkout needs a Git deploy.

## Things to replace before launch
- Policy pages (`/returns`, `/shipping`, `/privacy`, `/terms`, in `src/components/Policies.tsx`) are plain-language
  starting points. Have a lawyer review them. The numbers they use (14-day returns, delivery times, pickup hold, etc.)
  are in `POLICY` in `src/data.ts`; update `POLICY.updated` whenever you change a policy.
- `src/data.ts`: `CONTACT.email`, the sample `FEATURED` products, `SHOP.shippingFlat` (placeholder $49), and
  `SHOP.taxRate` (7.25%, the Apex / Wake County rate; confirm with your accountant).
- Product tiles in `src/components/Shop.tsx` and `Hero.tsx`: swap the icon tiles for real photos.
- Add a custom domain in Netlify > Domain management.
