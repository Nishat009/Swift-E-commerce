"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

type Props = {
  children: React.ReactNode;
};

export default function LayoutWrapper({ children }: Props) {
  const pathname = (usePathname() ?? "").toLowerCase();

  const hideHeaderFooter =
    pathname.startsWith("/signin") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/auth/") ||
    pathname === "/auth";

  if (hideHeaderFooter) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
