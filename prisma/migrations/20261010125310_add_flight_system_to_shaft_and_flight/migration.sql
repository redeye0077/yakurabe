/*
  Warnings:

  - Added the required column `flightSystem` to the `shaft` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `flight` ADD COLUMN `flightSystem` ENUM('UNIVERSAL', 'FIT', 'CLICK', 'EIGHT') NULL;

-- AlterTable
ALTER TABLE `shaft` ADD COLUMN `flightSystem` ENUM('UNIVERSAL', 'FIT', 'CLICK', 'EIGHT') NOT NULL;
