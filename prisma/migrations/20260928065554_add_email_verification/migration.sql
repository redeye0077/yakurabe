-- AlterTable
ALTER TABLE `user` ADD COLUMN `emailVerified` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `email_verification_token` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `email_verification_token_userId_key`(`userId`),
    UNIQUE INDEX `email_verification_token_tokenHash_key`(`tokenHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `email_verification_token` ADD CONSTRAINT `email_verification_token_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 既存ユーザーはメール認証導入前に登録済みのため、登録日時で認証済みとして扱う
UPDATE `user` SET `emailVerified` = `createdAt` WHERE `emailVerified` IS NULL;
