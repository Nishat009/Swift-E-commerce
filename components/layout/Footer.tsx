import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-cream border-t border-border-theme mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <ShoppingCart className="w-6 h-6 text-primary" />
              <span className="text-lg font-bold text-foreground">SwiftCart</span>
            </Link>
            <p className="text-sm text-text-muted">
              Your one-stop shop for all your shopping needs. Quality products, fast delivery.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-sm text-text-muted hover:text-primary transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/products?category=electronics" className="text-sm text-text-muted hover:text-primary transition-colors">
                  Electronics
                </Link>
              </li>
              <li>
                <Link href="/products?category=clothing" className="text-sm text-text-muted hover:text-primary transition-colors">
                  Clothing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-text-muted hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-text-muted hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-sm text-text-muted hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-4">Account</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/auth/login" className="text-sm text-text-muted hover:text-primary transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="text-sm text-text-muted hover:text-primary transition-colors">
                  Register
                </Link>
              </li>
              <li>
                <Link href="/profile" className="text-sm text-text-muted hover:text-primary transition-colors">
                  Profile
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border-theme text-center">
          <p className="text-sm text-text-muted">
            © {new Date().getFullYear()} SwiftCart. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

