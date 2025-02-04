export interface Transaction {
  id: string;
  senderUserId: string;
  receiverUserId: string;
  amount: number;
  description?: string;
  createdAt: Date;
}
