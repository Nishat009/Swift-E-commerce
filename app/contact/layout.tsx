import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | SwiftCart',
  description: 'Get in touch with SwiftCart for order help, product questions, returns or feedback.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
