/*
  Warnings:

  - You are about to drop the column `includesShaft` on the `flight` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `flight` DROP COLUMN `includesShaft`,
    ADD COLUMN `flightType` ENUM('MOLDED', 'SHAFT_INTEGRATED') NOT NULL DEFAULT 'MOLDED',
    ADD COLUMN `shaftLength` VARCHAR(191) NULL;
