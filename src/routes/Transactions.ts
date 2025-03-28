import { Router, Response, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '../types/Transaction';

const router = Router();

const totalTransactions = 1200; // Imitating total items from example response
const userCount = 20;
const types = ['earned', 'spent', 'payout'] as const;

const users = Array.from({ length: userCount }, (_, index): string => String(1001 + index))

const createMockTransaction = (): Transaction => {
  const userId = users[Math.floor(Math.random() * userCount)];
  const type = types[Math.floor(Math.random() * types.length)];
  const amount = parseFloat((Math.random() * 50 + 1).toFixed(2));
  const createdAt = new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30) // last 30 days

  return {
    id: uuidv4(),
    userId,
    type,
    amount,
    createdAt: createdAt.toISOString(),
  };
}

const transactions: Transaction[] = Array.from({ length: totalTransactions }, createMockTransaction);

router.get('/mock/transactions', async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 1000

  const offset = (page - 1) * limit
  const items = transactions.slice(offset, offset + limit)

  res.status(200).json({
    items,
    meta: {
      totalItems: transactions.length,
      itemCount: items.length,
      itemsPerPage: limit,
      totalPages: Math.ceil(transactions.length / limit),
      currentPage: page,
    },
  });
});

export default router;
