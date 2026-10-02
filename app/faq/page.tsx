'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import InfoPage from '@/components/layout/InfoPage';
import Accordion from '@/components/ui/Accordion';
import { SITE } from '@/lib/siteConfig';
import { cn } from '@/lib/utils';

type Cat = 'orders' | 'shipping' | 'payments' | 'returns' | 'account' | 'lucky draw';

const CATS: { id: Cat | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'orders', label: 'Orders' },
  { id: 'shipping', label: 'Shipping' },
  { id: 'payments', label: 'Payments' },
  { id: 'returns', label: 'Returns' },
  { id: 'account', label: 'Account' },
  { id: 'lucky draw', label: 'Lucky Draw' },
];

const FAQS: { cat: Cat; q: string; a: string }[] = [
  { cat: 'orders', q: 'How do I place an order?', a: 'Add items to your cart, open the cart and proceed to checkout. Choose or add a delivery address, pick a payment method and confirm. You will get a confirmation email once the order is placed.' },
  { cat: 'orders', q: 'Where can I see my order status?', a: 'Sign in and open My Orders. Each order shows its current status, from Pending through Processing and Shipped to Delivered.' },
  { cat: 'orders', q: 'Can I cancel or change my order?', a: 'You can cancel from My Orders while the order is still Pending or Processing. To change sizes, items or the address, contact us as early as possible and we will do our best before it ships.' },
  { cat: 'orders', q: 'Do you offer coupons or discounts?', a: 'Yes. Enter a valid coupon code in the cart or at checkout. Subscribe to our newsletter in the footer to hear about new codes and sales first.' },
  { cat: 'shipping', q: 'How much does shipping cost?', a: `Shipping is free on orders over $${SITE.freeShippingThreshold}. Below that, a flat $${SITE.shippingFee} fee applies. A ${Math.round(SITE.taxRate * 100)}% tax is added at checkout.` },
  { cat: 'shipping', q: 'How long does delivery take?', a: 'Dhaka orders usually arrive in 1-3 business days and the rest of Bangladesh in 3-7 business days, after a one-day processing time.' },
  { cat: 'shipping', q: 'Do you deliver outside Bangladesh?', a: 'Not at the moment. We currently deliver within Bangladesh only.' },
  { cat: 'payments', q: 'Which payment methods do you accept?', a: 'Cash on Delivery, bKash, and credit or debit cards.' },
  { cat: 'payments', q: 'Why are prices shown in US dollars?', a: 'Our catalogue is priced in USD. You can change the display currency from the header, and the converted amounts are shown for convenience.' },
  { cat: 'payments', q: 'Is my card information safe?', a: 'Card payments are processed by our payment provider over an encrypted connection. We never store your full card number or security code.' },
  { cat: 'payments', q: 'How does Cash on Delivery work?', a: 'Choose Cash on Delivery at checkout and pay the courier in cash when your parcel arrives. Please keep the exact amount ready.' },
  { cat: 'returns', q: 'What is your return policy?', a: 'You can return unworn, unwashed items with tags within 7 days of delivery. Some items such as innerwear and personalised products are not returnable. See Shipping & Returns for details.' },
  { cat: 'returns', q: 'My item arrived damaged. What now?', a: 'Contact us within 48 hours of delivery with your order number and a photo. We will replace the item or refund you in full.' },
  { cat: 'returns', q: 'How long do refunds take?', a: 'After we receive and inspect your return, refunds are issued to the original payment method. Cards take about 5-10 business days; bKash refunds usually 3-5 business days.' },
  { cat: 'account', q: 'How do I create an account?', a: 'Click Register in the header and sign up with your email, or continue with Google. You will need to accept the Terms & Conditions.' },
  { cat: 'account', q: 'I forgot my password.', a: 'Use the Forgot password link on the login page. If you do not receive an email, check your spam folder or contact us.' },
  { cat: 'account', q: 'How do I update my address or details?', a: 'Open your Profile for personal details and Addresses to add, edit or remove delivery addresses.' },
  { cat: 'account', q: 'Can I delete my account?', a: 'Yes. Contact us from the Contact page and we will delete your account and personal data, except records we must keep for legal or accounting reasons.' },
  { cat: 'lucky draw', q: 'What is a Lucky Draw?', a: 'A Lucky Draw is a campaign where you buy tickets for a chance to win the featured prize. Each campaign shows its prize, ticket price, ticket limit and draw date.' },
  { cat: 'lucky draw', q: 'How are winners chosen?', a: 'When the draw runs, one ticket is picked at random from all tickets sold. The winner and ticket number are shown on the campaign page.' },
  { cat: 'lucky draw', q: 'How many tickets can I buy?', a: 'Each campaign sets a per-user maximum, shown on the campaign page. Once tickets are sold out, no more can be bought.' },
  { cat: 'lucky draw', q: 'Where can I see my tickets?', a: 'Open My Tickets from the Lucky Draws section after signing in to see every ticket you hold and the status of each campaign.' },
  { cat: 'lucky draw', q: 'Can I get a refund on tickets?', a: 'Tickets are non-refundable once the draw has taken place. If a campaign is cancelled before the draw, tickets are refunded.' },
];

export default function FaqPage() {
  const [cat, setCat] = useState<Cat | 'all'>('all');
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter(
      (f) => (cat === 'all' || f.cat === cat) && (!q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q))
    );
  }, [cat, query]);

  return (
    <InfoPage
      eyebrow="Help centre"
      title="Frequently Asked Questions"
      intro="Quick answers to the things customers ask us most. Cannot find yours? Send us a message."
    >
      <div className="relative mb-4">
        <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions..."
          aria-label="Search questions"
          className="w-full text-sm border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-2xl pl-11 pr-4 py-3 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/30 focus:border-[#8b6f47]"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {CATS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCat(c.id)}
            className={cn(
              'px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap transition-colors cursor-pointer',
              cat === c.id
                ? 'bg-[#8b6f47] dark:bg-[#c9a96b] text-white dark:text-gray-950 border-transparent'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:text-[#8b6f47] dark:hover:text-[#c9a96b]'
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="space-y-3" aria-live="polite">
        {results.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[32px] p-8 text-center text-sm text-text-muted">
            No questions match your search. Try different words or{' '}
            <Link href="/contact" className="text-[#8b6f47] dark:text-[#c9a96b] font-bold hover:underline">contact us</Link>.
          </div>
        ) : (
          results.map((f) => (
            <Accordion key={f.q} title={f.q} subtitle={f.cat}>
              <p className="text-sm leading-relaxed">{f.a}</p>
            </Accordion>
          ))
        )}
      </div>

      <p className="text-xs text-text-muted mt-8">
        Still need help?{' '}
        <Link href="/contact" className="text-[#8b6f47] dark:text-[#c9a96b] font-bold hover:underline">Contact our team</Link>{' '}
        or read the <Link href="/shipping-returns" className="text-[#8b6f47] dark:text-[#c9a96b] font-bold hover:underline">Shipping &amp; Returns</Link> policy.
      </p>
    </InfoPage>
  );
}
