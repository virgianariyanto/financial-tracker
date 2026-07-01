import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Admin panel for managing Finora system accounts, transactions, and categories.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
