import type { Metadata } from 'next';
import Link from 'next/link';
import { Shirt, Home, Truck, Gift, Sparkles, HeartHandshake } from 'lucide-react';
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
      <div className="space-y-6">
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

        <div className="grid sm:grid-cols-2 gap-4">
          {values.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.title} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[32px] p-6 shadow-sm">
                <div className="w-10 h-10 rounded-2xl bg-[#8b6f47]/10 dark:bg-[#c9a96b]/10 text-[#8b6f47] dark:text-[#c9a96b] flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider font-serif text-gray-900 dark:text-white mb-2">{v.title}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{v.text}</p>
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
          <p className="flex items-start gap-2">
            <Gift className="w-4 h-4 mt-0.5 text-[#8b6f47] dark:text-[#c9a96b] flex-shrink-0" />
            <span>
              Our Lucky Draw campaigns let you buy a ticket for a chance to win featured products. Winners are
              announced on the campaign page. See the{' '}
              <Link href="/faq" className="text-[#8b6f47] dark:text-[#c9a96b] font-bold hover:underline">FAQ</Link> for the rules.
            </span>
          </p>
        </InfoCard>

        <div className="rounded-[32px] bg-[#8b6f47] dark:bg-[#c9a96b] text-white dark:text-gray-950 p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-serif font-bold flex items-center gap-2"><Sparkles className="w-5 h-5" /> Questions or feedback?</h3>
            <p className="text-sm opacity-90 mt-1">We read every message and reply within one to two business days.</p>
          </div>
          <Link href="/contact" className="px-6 py-3 rounded-xl bg-white dark:bg-gray-950 text-[#725a38] dark:text-[#c9a96b] text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity">
            Contact us
          </Link>
        </div>
      </div>
    </InfoPage>
  );
}
