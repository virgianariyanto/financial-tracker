import prisma from './db';
import { addDays, addWeeks, addMonths, addYears, isBefore, isAfter, startOfDay } from 'date-fns';

export async function processRecurringTransactions(userId: string): Promise<void> {
  try {
    const today = startOfDay(new Date());

    // Cari semua jadwal transaksi berulang yang aktif dan sudah masuk tanggal jatuh tempo
    const recurringSchedules = await prisma.recurringTransaction.findMany({
      where: {
        userId,
        isActive: true,
        nextOccurrence: {
          lte: today,
        },
      },
    });

    if (recurringSchedules.length === 0) return;

    for (const schedule of recurringSchedules) {
      let currentOccurrence = startOfDay(new Date(schedule.nextOccurrence));
      const transactionsToCreate: any[] = [];
      const endDate = schedule.endDate ? startOfDay(new Date(schedule.endDate)) : null;

      // Buat semua kemunculan transaksi yang tanggalnya <= hari ini
      while (
        (isBefore(currentOccurrence, today) || currentOccurrence.getTime() === today.getTime()) &&
        (!endDate || isBefore(currentOccurrence, endDate) || currentOccurrence.getTime() === endDate.getTime())
      ) {
        transactionsToCreate.push({
          amount: schedule.amount,
          currency: schedule.currency,
          type: schedule.type,
          description: schedule.description,
          date: new Date(currentOccurrence),
          categoryId: schedule.categoryId,
          userId: schedule.userId,
          recurringTransactionId: schedule.id,
          tags: [],
        });

        // Hitung tanggal kejadian berikutnya sesuai interval
        switch (schedule.interval) {
          case 'DAILY':
            currentOccurrence = addDays(currentOccurrence, 1);
            break;
          case 'WEEKLY':
            currentOccurrence = addWeeks(currentOccurrence, 1);
            break;
          case 'MONTHLY':
            currentOccurrence = addMonths(currentOccurrence, 1);
            break;
          case 'YEARLY':
            currentOccurrence = addYears(currentOccurrence, 1);
            break;
          default:
            break;
        }
      }

      if (transactionsToCreate.length > 0) {
        // Matikan jadwal jika tanggal berikutnya sudah melampaui tanggal selesai (endDate)
        const isFinished = endDate && isAfter(currentOccurrence, endDate);

        // Jalankan transaksi database (atomic)
        await prisma.$transaction(async (tx) => {
          // 1. Buat catatan transaksi riil
          await tx.transaction.createMany({
            data: transactionsToCreate.map(t => ({
              amount: t.amount,
              currency: t.currency,
              type: t.type,
              description: t.description,
              date: t.date,
              categoryId: t.categoryId,
              userId: t.userId,
              recurringTransactionId: t.recurringTransactionId,
              tags: t.tags,
            })),
          });

          // 2. Perbarui tanggal kejadian berikutnya dan status aktif jadwal
          await tx.recurringTransaction.update({
            where: { id: schedule.id },
            data: {
              nextOccurrence: currentOccurrence,
              isActive: isFinished ? false : true,
            },
          });
        });
      }
    }
  } catch (error) {
    console.error('Failed to process recurring transactions:', error);
  }
}
