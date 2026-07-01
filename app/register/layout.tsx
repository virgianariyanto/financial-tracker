import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create an Account",
  description: "Sign up for Finora to start managing your budget, tracking family expenses, and achieving your savings goals.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
