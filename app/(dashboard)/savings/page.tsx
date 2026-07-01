import SavingsClient from '@/components/savings-client';

export const metadata = {
  title: 'Savings Goals',
  description: 'Create and track your savings goals and progress over time.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SavingsPage() {
  return <SavingsClient />;
}
