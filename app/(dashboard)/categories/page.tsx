import CategoriesClient from '@/components/categories-client';

export const metadata = {
  title: 'Categories',
  description: 'Manage and customize your expense and income categories.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CategoriesPage() {
  return <CategoriesClient />;
}
