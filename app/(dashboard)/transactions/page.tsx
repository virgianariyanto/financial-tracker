import TransactionsClient from '@/components/transactions-client';

export const metadata = {
  title: 'Transactions',
  description: 'Manage and filter your family income and expenses.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function TransactionsPage() {
  return <TransactionsClient />;
}
