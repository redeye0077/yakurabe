-- AlterTable
-- imageUrl を imageKey に名前変更する(DROP + ADD だと既存の値が消えるため書き換えている)
ALTER TABLE `setting` RENAME COLUMN `imageUrl` TO `imageKey`;

-- CreateIndex
CREATE UNIQUE INDEX `setting_imageKey_key` ON `setting`(`imageKey`);
