import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://finora.web.id"),
  title: {
    default: "Finora — Premium Financial Tracker",
    template: "%s | Finora",
  },
  description: "Track your personal and family expenses, savings goals, and budgets seamlessly with premium charts and financial insights.",
  keywords: [
    "financial tracker",
    "budget planner",
    "expense tracker",
    "personal finance",
    "family budget",
    "savings tracker",
    "finora",
    "finance management",
    "money manager",
  ],
  authors: [{ name: "Finora Team", url: "https://finora.web.id" }],
  creator: "Finora Team",
  publisher: "Finora",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://finora.web.id",
    title: "Finora — Premium Financial Tracker",
    description: "Track your personal and family expenses, savings goals, and budgets seamlessly with premium charts and financial insights.",
    siteName: "Finora",
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "Finora Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Finora — Premium Financial Tracker",
    description: "Track your personal and family expenses, savings goals, and budgets seamlessly with premium charts and financial insights.",
    images: ["/icon.png"],
    creator: "@finora",
  },
  alternates: {
    canonical: "/",
  },
};

import { CurrencyProvider } from "@/components/currency-context";
import { ToastProvider } from "@/components/toast-context";
import { ConfirmProvider } from "@/components/confirm-dialog";
import ToastContainer from "@/components/ui/toast-container";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  const theme = savedTheme || systemTheme;
                  if (theme === 'light') {
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.remove('light');
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
      </head>
      <body className="min-h-full flex text-slate-200 bg-background" suppressHydrationWarning>
        <CurrencyProvider>
          <ToastProvider>
            <ConfirmProvider>
              {children}
              <ToastContainer />
            </ConfirmProvider>
          </ToastProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}

