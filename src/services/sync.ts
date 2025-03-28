import axios from 'axios';
import cron from 'node-cron';
import { AppDataSource } from '../data-source';
import { Transaction } from '../entities/Transaction';
import { Transaction as TransactionType } from '../types/Transaction';
import client from '../utils/client';

const pageSize = 1000;
const maxPages = 5;

interface PaginationResponse {
  totalItems: number;
  itemCount: number;
  itemsPerPage: number;
  totalPages: number;
  currentPage: number;
};

interface TransactionResponse {
  items: TransactionType[];
  meta: PaginationResponse;
};

const formatDate = (date: Date): string => date.toISOString();

const fetchTransactions = async (
  startDate: string,
  endDate: string,
  page: number,
): Promise<void> => {
  if (page > maxPages) {
    return;
  }

  try {
    const { data: { items, meta } } = await client.get<TransactionResponse>('/mock/transactions', {
      params: {
        startDate,
        endDate,
        page,
        limit: pageSize,
      }
    });

    if (!items.length) {
      console.log('No more transactions to fetch');
      return;
    }

    await AppDataSource.transaction(async (manager): Promise<void> => {
      const ids = items.map(({ id }) => id);

      const existingIdsRaw = await manager
        .createQueryBuilder(Transaction, 'transaction')
        .select('transaction.id')
        .where('transaction.id IN (:...ids)', { ids })
        .getRawMany();

      const existingIds = existingIdsRaw.map(({ id }) => id);

      const newTransactions = items
        .filter(({ id }) => !existingIds.includes(id))
        .map((item) => manager.create(Transaction, item)
      );

      if (newTransactions.length) {
        await manager.save(newTransactions);
        console.log(`Inserted ${newTransactions.length} new transactions`);
      }

      if (page < meta.totalPages) {
        await fetchTransactions(startDate, endDate, page + 1);
      }
    });
  } catch (err: any) {
    console.error('Error fetching transactions', err.message);
  }
};

const syncTransactions = async (): Promise<void> => {
  console.log('Syncing transactions...');
  const now = new Date();
  const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
  const startDate = formatDate(twoMinutesAgo);
  const endDate = formatDate(now);
  
  await fetchTransactions(startDate, endDate, 1);

  console.log(`Sync finished on range: ${startDate} - ${endDate}`);
};

export const startSync = async (): Promise<any> => cron.schedule('* * * * *', syncTransactions);
