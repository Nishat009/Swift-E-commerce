import type { Metadata } from 'next';
import Link from 'next/link';
import InfoPage, { InfoCard } from '@/components/layout/InfoPage';
import { SITE } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Privacy Policy | SwiftCart',
  description: 'What personal information SwiftCart collects, how it is used and the choices you have.',
};

const link = 'text-[#8b6f47] dark:text-[#c9a96b] font-bold hover:underline';

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro={`We collect only what we need to run your orders and improve the shop. This page explains what that is and how ${SITE.name} handles it.`}
      updated={SITE.lastUpdated}
    >
      <div className="space-y-6">
        <InfoCard title="Information we collect">
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Account details:</strong> name, email address and password (stored hashed, never in plain text). If you sign in with Google we receive your name, email and profile picture.</li>
            <li><strong>Order details:</strong> delivery addresses, phone number, items purchased and payment method used.</li>
            <li><strong>Messages and reviews:</strong> anything you send through the contact form or post as a review.</li>
            <li><strong>Newsletter:</strong> your email address if you subscribe.</li>
            <li><strong>Usage data:</strong> basic technical data such as IP address and browser type, used for security and rate limiting.</li>
          </ul>
        </InfoCard>

        <InfoCard title="How we use it">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>To process and deliver orders and send order confirmations and status updates.</li>
            <li>To run your account, wishlist, cart and Lucky Draw tickets.</li>
            <li>To answer your questions and provide support.</li>
            <li>To send marketing email only if you subscribed; every email includes a way to opt out.</li>
            <li>To detect fraud and keep the site secure.</li>
          </ul>
        </InfoCard>

        <InfoCard title="Payments">
          <p>
            Card payments are handled by our payment provider; we do not store your full card number or security code.
            For bKash and Cash on Delivery we only keep the details needed to match and fulfil your order.
          </p>
        </InfoCard>

        <InfoCard title="Who we share it with">
          <p>
            We never sell your personal information. We share it only with service providers who help us operate the shop,
            such as couriers (name, address and phone for delivery), payment processors, email delivery and image hosting
            services, and when required by law.
          </p>
        </InfoCard>

        <InfoCard title="Cookies and local storage">
          <p>
            We use cookies and browser storage to keep you signed in, remember your cart, theme, currency and language, and
            protect against abuse. We do not use them to track you across other websites. You can clear them in your browser
            at any time, though some features may stop working.
          </p>
        </InfoCard>

        <InfoCard title="Retention and security">
          <p>
            We keep order records for as long as needed for accounting and legal purposes, and keep other data until you ask
            us to delete it. We use encryption in transit, hashed passwords and access controls, but no system is perfectly
            secure, so please use a strong, unique password.
          </p>
        </InfoCard>

        <InfoCard title="Your choices">
          <p>
            You can update your details in your <Link href="/profile" className={link}>profile</Link> and addresses pages. You can
            ask us to export or delete your data, or unsubscribe from marketing, by contacting us. We will respond within a
            reasonable time and in line with applicable law.
          </p>
        </InfoCard>

        <InfoCard title="Children">
          <p>Our shop is not directed at children under 13 and we do not knowingly collect their data.</p>
        </InfoCard>

        <InfoCard title="Contact">
          <p>
            Privacy questions or requests: <a href={`mailto:${SITE.supportEmail}`} className={link}>{SITE.supportEmail}</a> or our{' '}
            <Link href="/contact" className={link}>contact form</Link>. We may update this policy; the date above shows the latest
            revision. Our <Link href="/terms" className={link}>Terms &amp; Conditions</Link> also apply.
          </p>
        </InfoCard>
      </div>
    </InfoPage>
  );
}
