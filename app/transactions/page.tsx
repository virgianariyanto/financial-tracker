import TransactionsClient from '@/components/transactions-client';

export const metadata = {
  title: 'Transactions — Fintrack',
  description: 'Manage and filter your family income and expenses.',
};

export default function TransactionsPage() {
  return <TransactionsClient />;
}
