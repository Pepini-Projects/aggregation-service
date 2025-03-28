import { Router, Response, Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '../types/Transaction';

const totalTransactions = 50000;
const userCount = 20;
const types = ['earned', 'spent', 'payout'] as const;
const users = Array.from({ length: userCount }, (_, index): string => String(1001 + index))

const transactions: Transaction[] = [];

const createMockTransaction = (maxAge: number): Transaction => {
  const now = new Date();
  const userId = users[Math.floor(Math.random() * userCount)];
  const type = types[Math.floor(Math.random() * types.length)];
  const amount = parseFloat((Math.random() * 50 + 1).toFixed(2));
  const createdAt = new Date(now.getTime() - Math.random() * maxAge)

  return {
    id: uuidv4(),
    userId,
    type,
    amount,
    createdAt: createdAt.toISOString(),
  };
}

const generateTransactions = (count: number, maxAge: number = 30000): void => {
  for (let i = 0; i < count; i++) {
    transactions.push(createMockTransaction(maxAge));
  }

  if (transactions.length > totalTransactions) {
    transactions.splice(0, transactions.length - totalTransactions);
  }
};

// Generate initial 5000 transactions with a max age of 5 minutes
generateTransactions(5000, 5 * 60 * 1000);

// Add new transactions every 10 seconds;
setInterval((): void => {
  generateTransactions(10);

  console.log(`Inserted 10 new transactions (total: ${transactions.length})`);
}, 10000);

const router = Router();

router.get('/mock/transactions', async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate, page = '1', limit = '1000' } = req.query;

  if (!startDate || !endDate) {
    res.status(400).json({ message: 'startDate and endDate are required' });
    return;
  }

  const start = new Date(startDate as string);
  const end = new Date(endDate as string);

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const offset = (pageNum - 1) * limitNum;

  const filtered = transactions.filter((transaction): boolean => {
    const created = new Date(transaction.createdAt);
    return created >= start && created <= end;
  });
  const items = filtered.slice(offset, offset + limitNum);

  res.status(200).json({
    items,
    meta: {
      totalItems: filtered.length,
      itemCount: items.length,
      itemsPerPage: limitNum,
      totalPages: Math.ceil(filtered.length / limitNum),
      currentPage: pageNum,
    },
  });
});

export default router;
