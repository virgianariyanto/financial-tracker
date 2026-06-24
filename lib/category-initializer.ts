import prisma from './db';

const PRESET_CATEGORIES = [
  // Expenses
  { name: 'Food & Dining', icon: 'Utensils', color: '#ef4444', type: 'EXPENSE' },
  { name: 'Transportation', icon: 'Car', color: '#3b82f6', type: 'EXPENSE' },
  { name: 'Housing & Rent', icon: 'Home', color: '#f59e0b', type: 'EXPENSE' },
  { name: 'Utilities', icon: 'Zap', color: '#10b981', type: 'EXPENSE' },
  { name: 'Entertainment', icon: 'Film', color: '#8b5cf6', type: 'EXPENSE' },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#ec4899', type: 'EXPENSE' },
  { name: 'Healthcare', icon: 'HeartPulse', color: '#f43f5e', type: 'EXPENSE' },
  { name: 'Education', icon: 'GraduationCap', color: '#06b6d4', type: 'EXPENSE' },
  // Income
  { name: 'Salary', icon: 'Briefcase', color: '#10b981', type: 'INCOME' },
  { name: 'Investments', icon: 'TrendingUp', color: '#06b6d4', type: 'INCOME' },
  { name: 'Gifts & Others', icon: 'Gift', color: '#ec4899', type: 'INCOME' },
];

export async function initializeUserCategories(userId: string): Promise<void> {
  try {
    // 1. Ensure global category presets exist in the database (where userId is null)
    let globalPresets = await prisma.category.findMany({
      where: { userId: null },
    });

    if (globalPresets.length === 0) {
      // Seed default categories as global presets
      await prisma.category.createMany({
        data: PRESET_CATEGORIES.map(cat => ({
          name: cat.name,
          icon: cat.icon,
          color: cat.color,
          type: cat.type as any,
          userId: null,
          isDefault: true,
        })),
      });

      // Fetch them again
      globalPresets = await prisma.category.findMany({
        where: { userId: null },
      });
    }

    // 2. Create user-specific copies of these categories
    // Check if the user already has any categories to avoid duplicates
    const existingUserCategories = await prisma.category.findMany({
      where: { userId },
    });

    const existingNames = new Set(existingUserCategories.map(c => c.name.toLowerCase()));

    const categoriesToCreate = globalPresets
      .filter(preset => !existingNames.has(preset.name.toLowerCase()))
      .map(preset => ({
        name: preset.name,
        icon: preset.icon,
        color: preset.color,
        type: preset.type,
        userId,
        isDefault: false,
      }));

    if (categoriesToCreate.length > 0) {
      await prisma.category.createMany({
        data: categoriesToCreate,
      });
    }
  } catch (error) {
    console.error(`Failed to initialize categories for user ${userId}:`, error);
  }
}
