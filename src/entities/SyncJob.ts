import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class SyncJob {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  startTime!: string

  @Column({ type: 'text' })
  endTime!: string

  @Column()
  status!: 'success' | 'failed'

  @Column({ type: 'text', nullable: true })
  error!: string | null

  @Column({ type: 'integer' })
  syncedItems!: number
};
