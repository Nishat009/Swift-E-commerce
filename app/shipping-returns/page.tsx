import type { Metadata } from 'next';
import Link from 'next/link';
import InfoPage, { InfoCard } from '@/components/layout/InfoPage';
import { SITE } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Shipping & Returns | SwiftCart',
  description: 'Delivery times, shipping fees, tax, returns and refunds at SwiftCart.',
};

const th = 'text-left text-[10px] font-bold uppercase tracking-wider text-text-muted py-2 pr-4';
const td = 'py-2.5 pr-4 border-t border-gray-100 dark:border-gray-800 align-top';

export default function ShippingReturnsPage() {
  return (
    <InfoPage
      eyebrow="Delivery & refunds"
      title="Shipping & Returns"
      intro="What it costs, how long it takes, and what to do if something is not right."
      updated={SITE.lastUpdated}
    >
      <div className="space-y-6">
        <InfoCard title="Shipping fees">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr><th className={th}>Order subtotal</th><th className={th}>Shipping</th></tr>
              </thead>
              <tbody>
                <tr><td className={td}>Under ${SITE.freeShippingThreshold}</td><td className={td}>${SITE.shippingFee} flat rate</td></tr>
                <tr><td className={td}>${SITE.freeShippingThreshold} or more</td><td className={td}><strong>Free</strong></td></tr>
              </tbody>
            </table>
          </div>
          <p>
            A {Math.round(SITE.taxRate * 100)}% tax is added to the order at checkout. Your exact shipping and tax
            are always shown in the cart and at checkout before you pay.
          </p>
        </InfoCard>

        <InfoCard title="Delivery times">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr><th className={th}>Area</th><th className={th}>Estimated delivery</th></tr>
              </thead>
              <tbody>
                <tr><td className={td}>Dhaka city</td><td className={td}>1-3 business days</td></tr>
                <tr><td className={td}>Other cities and districts</td><td className={td}>3-7 business days</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            Orders are processed within one business day. Delivery times are estimates and may be longer during
            public holidays, sales or bad weather. You can follow your order status on the{' '}
            <Link href="/orders" className="text-[#8b6f47] dark:text-[#c9a96b] font-bold hover:underline">My Orders</Link> page.
          </p>
        </InfoCard>

        <InfoCard title="Cash on Delivery">
          <p>
            You can pay the courier in cash when your parcel arrives. Please keep the exact amount ready and check
            the parcel in front of the delivery person where possible. Repeated refused or undelivered COD orders may
            lead us to ask for prepayment on future orders.
          </p>
        </InfoCard>

        <InfoCard title="Returns and exchanges">
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You can request a return or exchange within 7 days of receiving your order.</li>
            <li>Items must be unworn, unwashed, undamaged and have original tags and packaging.</li>
            <li>Innerwear, swimwear, pierced jewelry and personalised items cannot be returned for hygiene reasons.</li>
            <li>Items bought through a Lucky Draw prize or on final-sale offers are not eligible unless faulty.</li>
          </ul>
          <p>
            To start a return, <Link href="/contact" className="text-[#8b6f47] dark:text-[#c9a96b] font-bold hover:underline">contact us</Link>{' '}
            with your order number and a photo if the item is damaged. We will confirm the next steps and arrange pickup or
            drop-off.
          </p>
        </InfoCard>

        <InfoCard title="Damaged or wrong items">
          <p>
            If your item arrives damaged, defective or is not what you ordered, tell us within 48 hours of delivery. We
            will replace it or refund you in full, including shipping, at no cost to you.
          </p>
        </InfoCard>

        <InfoCard title="Refunds">
          <p>
            Once we receive and inspect a returned item, we will notify you by email. Approved refunds go back to the
            original payment method: card refunds typically take 5-10 business days to appear, and bKash or COD refunds are
            sent to the bKash number or account you provide, usually within 3-5 business days.
            Original shipping fees are refunded only when the return is due to our error.
          </p>
        </InfoCard>

        <InfoCard title="Cancelling an order">
          <p>
            You can cancel an order while it is still in Pending or Processing status from the My Orders page. Once an
            order has shipped, please refuse delivery or request a return after it arrives.
          </p>
        </InfoCard>
      </div>
    </InfoPage>
  );
}
