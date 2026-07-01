import BudgetsClient from '@/components/budgets-client';

export const metadata = {
  title: 'Spending Plans',
  description: 'Manage monthly budget limits and monitor category-wise expenses.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function BudgetsPage() {
  return <BudgetsClient />;
}
