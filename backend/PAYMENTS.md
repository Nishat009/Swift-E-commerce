# Payments setup (FREE) / পেমেন্ট সেটআপ

Methods: **COD** (always on), **bKash**, **Card (Stripe)**. bKash and Card turn on automatically
only when their keys exist in `backend/.env`. Restart the backend after editing `.env`.
Prices are stored in USD; bKash charges `USD x BDT_PER_USD` (default 120) in BDT.

## 1. Stripe test keys (card) — free, no company needed

1. https://dashboard.stripe.com/register -> account বানান (শুধু email লাগে).
2. Dashboard এর উপরে **Test mode** চালু রাখুন (Activate account করার দরকার নেই).
3. **Developers -> API keys -> Secret key** (`sk_test_...`) কপি করুন.
4. `backend/.env`:
   ```
   STRIPE_SECRET_KEY=sk_test_xxx
   BACKEND_URL=http://localhost:5000
   ```
5. Test card: `4242 4242 4242 4242`, any future expiry, any CVC, any ZIP. Declined card: `4000 0000 0000 0002`.

Optional webhook (covers the case where a customer pays then closes the tab):
`stripe listen --forward-to localhost:5000/api/payments/stripe/webhook` (Stripe CLI, free) prints a
`whsec_...`; put it in `STRIPE_WEBHOOK_SECRET`. In production add the endpoint
`https://YOUR-API/api/payments/stripe/webhook` (events: `checkout.session.completed`,
`checkout.session.expired`) in Dashboard -> Developers -> Webhooks.

## 2. bKash sandbox (tokenized checkout) — free

1. bKash developer portal এ sandbox account নিন: https://developer.bka.sh (Sandbox -> "Get sandbox credentials",
   অথবা bKash এর "Tokenized Checkout" sandbox docs থেকে public test credentials). Fields: App Key, App Secret, Username, Password.
2. `backend/.env`:
   ```
   BKASH_APP_KEY=...
   BKASH_APP_SECRET=...
   BKASH_USERNAME=...
   BKASH_PASSWORD=...
   BKASH_BASE_URL=            # empty = sandbox (https://tokenized.sandbox.bka.sh/v1.2.0-beta)
   BDT_PER_USD=120
   ```
3. Sandbox test wallet: number `01619777283`, OTP `123456`, PIN `12121` (bKash sandbox docs; check them
   if these have changed).

## 3. How to test

- Checkout page shows only enabled methods. Pick Card or bKash -> order is created -> you are redirected to
  the gateway -> after paying you land on `/orders?payment=success`.
- Closed the gateway tab? Orders page shows **Pay now** for unpaid bKash/Card orders. Unpaid orders can be cancelled
  (stock is restored once).
- COD orders stay `Pending` until admin marks them Paid (or Delivered, which auto-marks COD Paid).
- Lucky draw: pick quantity -> choose bKash/Card -> pay. Tickets are created only after the server verifies
  the payment with the gateway; tickets are held 30 min while paying, then released.
- Payment status is never taken from the browser: the server calls Stripe / bKash to verify.
- If a payment arrives for an order/ticket purchase that was already cancelled/expired and cannot be fulfilled,
  the server logs `Manual refund needed` (and ticket purchase becomes `refund_needed`) — refund from the gateway dashboard.

## 4. Going live (পরে)

- Stripe: complete account activation (business/bank details), switch to the live `sk_live_...` key, add the live webhook secret.
- bKash: apply for a merchant account (bKash Merchant / Payment Gateway onboarding, trade license/NID needed);
  they give production App Key/Secret/Username/Password. Set `BKASH_BASE_URL=https://tokenized.pay.bka.sh/v1.2.0-beta`.
- Set `BACKEND_URL` and `FRONTEND_URL` to your real HTTPS domains (bKash callback must be publicly reachable).
- Update `BDT_PER_USD` to a current rate. Never commit `.env` or put keys in frontend code.

## Mock gateway (local testing)

Set `PAYMENT_MOCK=true` in `.env` (ignored when `NODE_ENV=production`). bKash and Card then appear as
enabled without real accounts. Buying tickets / paying an order redirects to
`/api/payments/mock/checkout`, a fake page with **Pay successfully** and **Fail / cancel** buttons. Both
go through the same server-side settle logic as the real gateways (tickets are issued only after "Pay").

Run the end-to-end draw test (uses a throwaway `swiftcart_test` database): `npm run test:draw`
