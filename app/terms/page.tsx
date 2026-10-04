import type { Metadata } from 'next';
import Link from 'next/link';
import InfoPage, { InfoCard } from '@/components/layout/InfoPage';
import { SITE } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Terms & Conditions | SwiftCart',
  description: 'The terms that apply when you browse, buy from or create an account with SwiftCart.',
};

const link = 'text-[#8b6f47] dark:text-[#c9a96b] font-bold hover:underline';

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Terms & Conditions"
      intro={`These terms apply to your use of the ${SITE.name} website and any purchase you make from us. By creating an account or placing an order you agree to them.`}
      updated={SITE.lastUpdated}
    >
      <div className="space-y-6">
        <InfoCard title="1. Your account">
          <p>
            You must provide accurate information and keep your password secure. You are responsible for activity on your
            account. We may suspend accounts that are used for fraud, abuse or to bypass these terms.
          </p>
        </InfoCard>

        <InfoCard title="2. Products and pricing">
          <p>
            We try to describe and photograph products accurately, but colours may vary slightly between screens. Prices
            are displayed in US dollars and may change without notice; the price you see at checkout is the price you pay.
            If a product is listed at an obvious pricing error, we may cancel the order and refund you in full.
          </p>
        </InfoCard>

        <InfoCard title="3. Orders and payment">
          <p>
            Placing an order is an offer to buy. We accept it when we confirm it by email or dispatch it. We may decline
            or cancel orders for stock issues, payment problems or suspected fraud. Payment methods are Cash on Delivery,
            bKash and credit or debit card. A {Math.round(SITE.taxRate * 100)}% tax and shipping (free on orders over ${SITE.freeShippingThreshold},
            otherwise ${SITE.shippingFee}) are added at checkout.
          </p>
        </InfoCard>

        <InfoCard title="4. Shipping, returns and refunds">
          <p>
            Delivery, returns, exchanges and refunds are covered in our{' '}
            <Link href="/shipping-returns" className={link}>Shipping &amp; Returns</Link> policy, which forms part of these terms.
          </p>
        </InfoCard>

        <InfoCard title="5. Lucky Draw campaigns">
          <p>
            Lucky Draw tickets are purchased for a chance to win the prize shown on the campaign page. Each campaign
            states its ticket limit, per-user limit and draw date. Winners are selected at random from sold tickets when
            the draw is run, and the result is final. Tickets are non-transferable and non-refundable once the draw has
            taken place, except where a campaign is cancelled, in which case tickets are refunded. Where local law restricts
            promotional draws, it is your responsibility to make sure you are eligible to take part.
          </p>
        </InfoCard>

        <InfoCard title="6. Acceptable use">
          <p>
            You agree not to misuse the site: no scraping, attempts to break security, fake reviews, automated purchasing or
            use of the site for unlawful purposes. Reviews you post must be honest and respectful, and we may remove content
            that is not.
          </p>
        </InfoCard>

        <InfoCard title="7. Intellectual property">
          <p>
            Text, images, logos and design on this site belong to {SITE.name} or its licensors. You may not copy or reuse
            them for commercial purposes without written permission.
          </p>
        </InfoCard>

        <InfoCard title="8. Liability">
          <p>
            We are not liable for indirect or consequential losses. Our total liability for any order is limited to the
            amount you paid for it. Nothing in these terms limits rights you have under applicable consumer protection law.
          </p>
        </InfoCard>

        <InfoCard title="9. Changes and governing law">
          <p>
            We may update these terms from time to time; the date above shows the latest revision. Continued use of the
            site means you accept the changes. These terms are governed by the laws of Bangladesh.
          </p>
        </InfoCard>

        <InfoCard title="10. Contact">
          <p>
            Questions about these terms? Email <a href={`mailto:${SITE.supportEmail}`} className={link}>{SITE.supportEmail}</a>{' '}
            or use our <Link href="/contact" className={link}>contact form</Link>. See also our{' '}
            <Link href="/privacy" className={link}>Privacy Policy</Link>.
          </p>
        </InfoCard>
      </div>
    </InfoPage>
  );
}
