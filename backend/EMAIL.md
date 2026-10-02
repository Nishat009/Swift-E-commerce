# Email setup (FREE) / ইমেইল সেটআপ

Backend সব email (welcome, order confirmation, order shipped/delivered/cancelled, forgot-password, login OTP,
newsletter, contact form) SMTP দিয়ে পাঠায়। SMTP ঠিকমতো config না থাকলে server crash করে না, শুধু একটি warning log করে
এবং email skip করে। `backend/.env` এ নিচের variable গুলো দিন, তারপর backend restart করুন।

```
SMTP_HOST=...
SMTP_PORT=587
SMTP_SECURE=false      # port 465 হলে true
SMTP_USER=...
SMTP_PASS=...
MAIL_FROM="SwiftCart <your@email.com>"
CONTACT_EMAIL=your@email.com   # contact form message এখানে আসবে
```

## Option 1: Gmail (free, সবচেয়ে সহজ, ~500 mail/day)

1. Google Account > Security এ গিয়ে **2-Step Verification** চালু করুন (এটা ছাড়া App Password পাবেন না).
2. https://myaccount.google.com/apppasswords এ যান, App name দিন (যেমন `SwiftCart`), **Create** চাপুন.
3. যে 16 অক্ষরের password দেখাবে সেটা কপি করুন (space ছাড়া).
4. `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourname@gmail.com
SMTP_PASS=abcdefghijklmnop
MAIL_FROM="SwiftCart <yourname@gmail.com>"
```
Note: Gmail সবসময় `From` কে আপনার Gmail address এ বদলে দেয়.

## Option 2: Brevo (ex-Sendinblue) free tier (300 mail/day)

1. https://www.brevo.com এ free account খুলুন, email verify করুন.
2. **Senders, Domains & Dedicated IPs > Senders** এ আপনার sender email add ও verify করুন.
3. **SMTP & API > SMTP** ট্যাবে যান. সেখানে *Login* (একটা `xxxx@smtp-brevo.com` address) এবং **Generate a new SMTP key** আছে. Key কপি করুন.
4. `.env`:
```
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=xxxx@smtp-brevo.com
SMTP_PASS=<your SMTP key>
MAIL_FROM="SwiftCart <your-verified-sender@email.com>"
```
Brevo তে `MAIL_FROM` অবশ্যই verified sender হতে হবে, নাহলে mail reject হবে.

## Test / পরীক্ষা

- Backend restart করুন. Log এ `SMTP not configured` warning না এলে config ঠিক আছে.
- Forgot password বা newsletter subscribe করে নিজের inbox/spam চেক করুন.
- Email পাঠাতে fail করলে log এ `[email] Failed to send ...` দেখাবে (API response আটকে থাকে না).

## Dev mode codes

শুধু local এ email ছাড়া test করতে চাইলে `ALLOW_DEV_AUTH_CODES=true` দিন; তখন OTP/reset code API response এ আসবে.
`NODE_ENV=production` হলে এটা সবসময় বন্ধ থাকে, code শুধু email এ যায়.
