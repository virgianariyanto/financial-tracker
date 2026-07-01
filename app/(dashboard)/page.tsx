import DashboardClient from '@/components/dashboard-client';

export const metadata = {
  title: 'Dashboard',
  description: 'Track and budget expenses and family finances.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardPage() {
  return <DashboardClient />;
}
