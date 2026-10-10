/*
  Warnings:

  - You are about to drop the column `tipType` on the `tip` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `tip` DROP COLUMN `tipType`,
    ADD COLUMN `threadSize` ENUM('TWO_BA', 'NO_5') NOT NULL DEFAULT 'TWO_BA';
