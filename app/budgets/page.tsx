import BudgetsClient from '@/components/budgets-client';

export const metadata = {
  title: 'Spending Plans — Fintrack',
  description: 'Manage monthly budget limits and monitor category-wise expenses.',
};

export default function BudgetsPage() {
  return <BudgetsClient />;
}
