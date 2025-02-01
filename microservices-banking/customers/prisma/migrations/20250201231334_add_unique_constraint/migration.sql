/*
  Warnings:

  - A unique constraint covering the columns `[agency,account]` on the table `BankingDetails` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "BankingDetails_agency_account_key" ON "BankingDetails"("agency", "account");
