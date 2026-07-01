import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support Hub",
  description: "Get support or submit feedback for Finora Financial Tracker.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
