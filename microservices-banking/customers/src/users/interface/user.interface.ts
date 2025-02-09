import { Prisma } from '@prisma/client';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  address?: string;
  bankingDetails?: {
    agency: string;
    account: string;
  };
  profilePicture?: string;
  balance: Prisma.Decimal;
  createdAt: Date;
  updatedAt: Date;
}
