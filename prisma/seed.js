const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set in environment variables');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const defaultCategories = [
  // Expenses
  { name: 'Food & Dining', icon: 'Utensils', color: '#ef4444', type: 'EXPENSE', isDefault: true },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#ec4899', type: 'EXPENSE', isDefault: true },
  { name: 'Housing & Rent', icon: 'Home', color: '#3b82f6', type: 'EXPENSE', isDefault: true },
  { name: 'Transportation', icon: 'Car', color: '#14b8a6', type: 'EXPENSE', isDefault: true },
  { name: 'Utilities & Bills', icon: 'CreditCard', color: '#f59e0b', type: 'EXPENSE', isDefault: true },
  { name: 'Entertainment', icon: 'Tv', color: '#8b5cf6', type: 'EXPENSE', isDefault: true },
  { name: 'Healthcare', icon: 'HeartPulse', color: '#10b981', type: 'EXPENSE', isDefault: true },
  { name: 'Education', icon: 'GraduationCap', color: '#6366f1', type: 'EXPENSE', isDefault: true },
  { name: 'Travel', icon: 'Plane', color: '#06b6d4', type: 'EXPENSE', isDefault: true },
  { name: 'Others (Expense)', icon: 'HelpCircle', color: '#6b7280', type: 'EXPENSE', isDefault: true },

  // Income
  { name: 'Salary', icon: 'Briefcase', color: '#10b981', type: 'INCOME', isDefault: true },
  { name: 'Investments', icon: 'TrendingUp', color: '#059669', type: 'INCOME', isDefault: true },
  { name: 'Freelance & Side Hustle', icon: 'Laptop', color: '#2563eb', type: 'INCOME', isDefault: true },
  { name: 'Gifts', icon: 'Gift', color: '#db2777', type: 'INCOME', isDefault: true },
  { name: 'Others (Income)', icon: 'Coins', color: '#d97706', type: 'INCOME', isDefault: true },
];

async function main() {
  console.log('Seeding default categories...');
  for (const cat of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: { name: cat.name, userId: null },
    });
    if (!existing) {
      await prisma.category.create({
        data: {
          ...cat,
          userId: null,
        },
      });
    }
  }
  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
