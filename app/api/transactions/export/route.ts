import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUserId } from '@/lib/auth';
import { format } from 'date-fns';

export async function GET(request: Request) {
  try {
    const userId = await getAuthUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const categoryId = searchParams.get('categoryId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    const where: any = { userId };

    if (type === 'INCOME' || type === 'EXPENSE') {
      where.type = type;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    if (search) {
      where.description = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    // Generate HTML Table for Excel (.xls)
    const tableRows = transactions.map(t => {
      const formattedDate = format(new Date(t.date), 'yyyy-MM-dd');
      const categoryName = t.category ? t.category.name : '';
      const type = t.type === 'INCOME' ? 'Income' : 'Expense';
      const color = t.type === 'INCOME' ? 'color: #047857;' : 'color: #b91c1c;';
      
      return `
        <tr>
          <td style="padding: 8px;">${formattedDate}</td>
          <td style="padding: 8px; ${color} font-weight: bold;">${type}</td>
          <td style="padding: 8px;">${categoryName}</td>
          <td style="padding: 8px;">${t.description || ''}</td>
          <td style="padding: 8px; text-align: right; font-weight: bold;">${t.amount} ${t.currency}</td>
          <td style="padding: 8px;">${t.tags && t.tags.length > 0 ? t.tags.join(', ') : '-'}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; font-family: Arial, sans-serif; }
          th, td { border: 1px solid #cbd5e1; }
          th { background-color: #0f172a; color: #ffffff; font-size: 14px; text-align: left; padding: 12px 10px; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Category</th>
              <th>Description</th>
              <th style="text-align: right;">Amount</th>
              <th>Tags</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const filename = `finora-transactions-${format(new Date(), 'yyyy-MM-dd')}.xls`;

    return new Response(htmlContent, {
      headers: {
        'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Failed to export transactions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
