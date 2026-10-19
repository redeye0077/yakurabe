/*
  Warnings:

  - You are about to drop the column `tag` on the `setting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `setting` DROP COLUMN `tag`,
    MODIFY `description` TEXT NULL;
