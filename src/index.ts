import express from 'express';
import { initializeDatabase } from './data-source';
import Transactions from './routes/Transactions';

const app = express();

const startServer = async () => {
  try {
    await initializeDatabase();

    app.use(Transactions);

    app.listen(3000, (): void => console.log('Server is running on port 3000'));
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
};

startServer();
