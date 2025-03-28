import 'reflect-metadata';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  synchronize: true, // Auto create database schema - prod should use migration
  logging: true,
  entities: ['src/entities/*.ts'],
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
  } catch (err) {
    console.error('Error during AppDataSource initialization', err);
    process.exit(1);
  }
};
