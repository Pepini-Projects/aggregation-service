export interface Transaction {
  id: string;
  userId: string;
  type: 'earned' | 'spent' | 'payout';
  amount: number;
  createdAt: string;
}