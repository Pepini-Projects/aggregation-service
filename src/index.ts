import express from 'express';
import { initializeDatabase } from './data-source';
import { start } from 'repl';

const app = express();

const startServer = async () => {
  try {
    await initializeDatabase();

    app.get('/', (req, res): void => {
      res.send('Transaction Aggregator is running!')
    })

    app.listen(3000, (): void => {
      console.log('Server is running on port 3000');
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
};

startServer();
