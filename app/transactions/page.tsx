import TransactionsClient from '@/components/transactions-client';

export const metadata = {
  title: 'Transactions — Finora',
  description: 'Manage and filter your family income and expenses.',
};

export default function TransactionsPage() {
  return <TransactionsClient />;
}
