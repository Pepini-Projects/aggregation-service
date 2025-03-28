import cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import { AppDataSource } from '../data-source';
import { Transaction } from '../entities/Transaction';
import { SyncJob } from '../entities/SyncJob';
import { Transaction as TransactionType } from '../types/Transaction';
import client from '../utils/client';

const pageSize = 1000;
const maxPages = 5;
const syncId = uuidv4();

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
  onInsert: (count: number) => void,
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
        onInsert(newTransactions.length);
      }

      if (page < meta.totalPages) {
        await fetchTransactions(startDate, endDate, page + 1, onInsert);
      }
    });
  } catch (err: any) {
    console.error('Error fetching transactions', err.message);
  }
};

let isSyncing = false;

const syncTransactions = async (): Promise<void> => {
  if (isSyncing) {
    console.warn('Sync already in progress');
    return;
  }

  isSyncing = true;

  const jobRepo = AppDataSource.getRepository(SyncJob);
  const lastJob = await jobRepo.findOne({ order: { endTime: 'DESC' } });
  const startTime = new Date();
  const startDate = lastJob?.endTime ?? new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const endDate = formatDate(new Date())
  let syncedItems = 0

  try {
    console.log('Syncing transactions...');

    await fetchTransactions(startDate, endDate, 1, (count) => syncedItems += count);

    await jobRepo.save({
      startTime: formatDate(startTime),
      endTime: endDate,
      status: 'success',
      error: null,
      syncedItems,
    })

    console.log(`Sync finished on range: ${startDate} - ${endDate}`);
  } catch (err: any) {
    await jobRepo.save({
      startTime: formatDate(startTime),
      endTime: formatDate(new Date()),
      status: 'failed',
      error: err.message ?? 'Unknown error',
      syncedItems,
    })

    console.error('Error syncing transactions', err.message);
  } finally {
    isSyncing = false;
  }
};

export const startSync = async (): Promise<any> => cron.schedule('* * * * *', syncTransactions);
