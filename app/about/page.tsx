import type { Metadata } from 'next';
import Link from 'next/link';
import { Shirt, Home, Truck, HeartHandshake } from 'lucide-react';
import InfoPage, { InfoCard } from '@/components/layout/InfoPage';
import { SITE } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'About Us | SwiftCart',
  description: 'The story behind SwiftCart: a Bangladesh-based fashion and home decor store built around quality, fair prices and honest service.',
};

const values = [
  { icon: Shirt, title: 'Fashion with intent', text: 'Every piece is chosen for fit, fabric and how well it pairs with the rest of your wardrobe.' },
  { icon: Home, title: 'Home that feels like you', text: 'Decor and homeware that bring warmth and texture to everyday spaces without the premium markup.' },
  { icon: Truck, title: 'Reliable delivery', text: `Nationwide delivery with tracking, careful packaging and free shipping on orders over $${SITE.freeShippingThreshold}.` },
  { icon: HeartHandshake, title: 'Honest service', text: 'Clear prices, easy returns and a real person on the other end when you need help.' },
];

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="Our story"
      title="About SwiftCart"
      intro="A small, independent fashion and home decor store from Bangladesh, built for people who want considered style at fair prices."
    >
      <div>
        <InfoCard title="Why we started">
          <p>
            {SITE.name} began with a simple frustration: good-looking clothes and home pieces were either overpriced
            or unreliable to order online. We set out to build a shop where you can see what you are buying, pay the
            way you prefer, and trust that it will arrive as described.
          </p>
          <p>
            Today we curate collections across fashion and home decor, and we keep adding tools that make shopping
            easier, like the virtual Dressing Room and our AI stylist, which help you plan outfits before you buy.
          </p>
        </InfoCard>

        <div className="grid sm:grid-cols-2 gap-x-10 gap-y-8 border-b border-line py-8">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.title}>
                <Icon className="w-5 h-5 text-stone-500 dark:text-stone-400 mb-3" strokeWidth={1.5} />
                <h3 className="text-lg font-serif font-medium tracking-tight text-ink mb-1.5">{v.title}</h3>
                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">{v.text}</p>
              </div>
            );
          })}
        </div>

        <InfoCard title="How you can pay">
          <p>
            We accept Cash on Delivery, bKash and major credit or debit cards. Prices are shown in US dollars, and
            you can switch the display currency from the header where available.
          </p>
        </InfoCard>

        <InfoCard title="Lucky Draws">
          <p>
            Our Lucky Draw campaigns let you buy a ticket for a chance to win featured products. Winners are
            announced on the campaign page. See the{' '}
            <Link href="/faq" className="text-ink underline underline-offset-4 decoration-stone-300 dark:decoration-stone-600 hover:decoration-ink">FAQ</Link> for the rules.
          </p>
        </InfoCard>

        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-serif font-medium tracking-tight text-ink">Questions or feedback?</h3>
            <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">We read every message and reply within one to two business days.</p>
          </div>
          <Link href="/contact" className="inline-flex items-center justify-center rounded-full bg-ink text-paper hover:bg-ink/85 transition-colors px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] whitespace-nowrap">
            Contact us
          </Link>
        </div>
      </div>
    </InfoPage>
  );
}
