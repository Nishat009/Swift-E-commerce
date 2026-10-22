import type { Metadata } from "next";
import "@fontsource/inter/latin-300.css";
import "@fontsource/inter/latin-400.css";
import "@fontsource/inter/latin-500.css";
import "@fontsource/inter/latin-600.css";
import "@fontsource/inter/latin-700.css";
import "@fontsource/playfair-display/latin-400.css";
import "@fontsource/playfair-display/latin-500.css";
import "@fontsource/playfair-display/latin-600.css";
import "@fontsource/playfair-display/latin-700.css";
import "@fontsource/cormorant-garamond/latin-300.css";
import "@fontsource/cormorant-garamond/latin-400.css";
import "@fontsource/cormorant-garamond/latin-500.css";
import "@fontsource/cormorant-garamond/latin-600.css";
import "./globals.css";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";

export const metadata: Metadata = {
  title: "SwiftCart - Modern E-Commerce Platform",
  description: "Your one-stop shop for quality products with fast delivery",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="antialiased min-h-screen flex flex-col bg-background text-foreground"
      >
        <AuthProvider>
          <ToastProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
