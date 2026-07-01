import SettingsClient from '@/components/settings-client';

export const metadata = {
  title: 'Settings',
  description: 'Manage your profile and workspace preferences.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SettingsPage() {
  return <SettingsClient />;
}
