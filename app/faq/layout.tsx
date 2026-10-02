import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ | SwiftCart',
  description: 'Answers about orders, shipping, payments, returns, your account and Lucky Draws at SwiftCart.',
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return children;
}
