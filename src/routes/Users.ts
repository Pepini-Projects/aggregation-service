import { Router, Request, Response } from 'express';
import { AppDataSource } from '../data-source';
import { Transaction } from '../entities/Transaction';

const router = Router();

router.get('/:userId/aggregation', async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;
  const repo = AppDataSource.getRepository(Transaction);

  const result = await repo
    .createQueryBuilder('transaction')
    .select('transaction.type', 'type')
    .addSelect('SUM(transaction.amount)', 'total')
    .where('transaction.userId = :userId', { userId })
    .groupBy('transaction.type')
    .getRawMany();

  const aggregates = { earned: 0, spent: 0, payout: 0 };
  for (const { type, total } of result) {
    aggregates[type as keyof typeof aggregates] = parseFloat(total);
  }

  res.status(200).json({
    userId,
    ...aggregates,
    balance: aggregates.earned - aggregates.spent - aggregates.payout,
  });
});

router.get('/payouts', async (req: Request, res: Response): Promise<void> => {
  const repo = AppDataSource.getRepository(Transaction);

  const results = await repo
    .createQueryBuilder('transaction')
    .select('transaction.userId', 'userId')
    .addSelect('SUM(transaction.amount)', 'total')
    .where('transaction.type = :type', { type: 'payout' })
    .groupBy('transaction.userId')
    .getRawMany();

  res.status(200).json(results.map(({ userId, total }) => ({ userId, totalPayout: parseFloat(total) })));
});

export default router;
