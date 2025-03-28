import { Entity, PrimaryColumn, Column } from 'typeorm';

export type TransactionType = 'earned' | 'spent' | 'payout';

@Entity()
export class Transaction {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ type: 'varchar' })
  userId!: string;

  @Column({ type: 'varchar' })
  type!: TransactionType;

  @Column({ type: 'float' })
  amount!: number;

  // Using text to save ISO 8601 date string since SQLite doesn't have a native date type
  @Column({ type: 'text' })
  createdAt!: string;
}
