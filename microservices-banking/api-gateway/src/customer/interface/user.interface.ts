export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  address?: string;
  bankingDetails: {
    agency: string;
    account: string;
  };
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}
