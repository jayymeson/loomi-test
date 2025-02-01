export interface User {
  id: string;
  name: string;
  email: string;
  address?: string;
  bankingDetails?: {
    agency: string;
    account: string;
  };
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}
