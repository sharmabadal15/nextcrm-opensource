import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CRM Pro — Modern Sales CRM",
    template: "%s | CRM Pro",
  },
  description:
    "Production-grade CRM for modern sales teams. Manage contacts, companies, deals, activities, and more.",
  keywords: [
    "CRM",
    "sales",
    "pipeline",
    "contacts",
    "deals",
    "sales management",
    "customer relationship",
  ],
  authors: [{ name: "CRM Pro Team" }],
  openGraph: {
    title: "CRM Pro — Modern Sales CRM",
    description:
      "Production-grade CRM for modern sales teams. Manage contacts, companies, deals, activities, and more.",
    type: "website",
    locale: "en_US",
    siteName: "CRM Pro",
  },
  twitter: {
    card: "summary_large_image",
    title: "CRM Pro — Modern Sales CRM",
    description:
      "Production-grade CRM for modern sales teams. Manage contacts, companies, deals, activities, and more.",
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
