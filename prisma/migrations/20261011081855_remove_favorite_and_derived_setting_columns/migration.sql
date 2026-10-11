/*
  Warnings:

  - You are about to drop the column `favoriteCount` on the `setting` table. All the data in the column will be lost.
  - You are about to drop the column `recommendedLevel` on the `setting` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `setting` table. All the data in the column will be lost.
  - You are about to drop the column `totalWeight` on the `setting` table. All the data in the column will be lost.
  - You are about to drop the `favorite` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `favorite` DROP FOREIGN KEY `favorite_settingId_fkey`;

-- DropForeignKey
ALTER TABLE `favorite` DROP FOREIGN KEY `favorite_userId_fkey`;

-- AlterTable
ALTER TABLE `setting` DROP COLUMN `favoriteCount`,
    DROP COLUMN `recommendedLevel`,
    DROP COLUMN `totalPrice`,
    DROP COLUMN `totalWeight`,
    MODIFY `imageUrl` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `favorite`;
