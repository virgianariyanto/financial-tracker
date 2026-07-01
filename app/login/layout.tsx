import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
  description: "Log in to your Finora account to manage and track your personal and family expenses, budget limits, and savings goals.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
