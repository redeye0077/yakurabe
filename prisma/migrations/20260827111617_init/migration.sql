-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `bio` TEXT NULL,
    `dartsCareer` VARCHAR(191) NULL,
    `highestRating` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `barrel` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `maker` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `hiveUrl` VARCHAR(191) NULL,
    `weight` DOUBLE NOT NULL,
    `totalLength` DOUBLE NOT NULL,
    `maxDiameter` DOUBLE NOT NULL,
    `material` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shaft` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `maker` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `hiveUrl` VARCHAR(191) NULL,
    `shaftLength` VARCHAR(191) NOT NULL,
    `shaftShape` VARCHAR(191) NOT NULL,
    `material` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `flight` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `maker` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `hiveUrl` VARCHAR(191) NULL,
    `includesShaft` BOOLEAN NOT NULL DEFAULT false,
    `flightShape` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tip` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `maker` VARCHAR(191) NOT NULL,
    `price` INTEGER NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `hiveUrl` VARCHAR(191) NULL,
    `tipType` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `setting` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `recommendedLevel` ENUM('BEGINNER', 'BEGINNER_INTERMEDIATE', 'INTERMEDIATE', 'INTERMEDIATE_ADVANCED', 'ADVANCED') NULL,
    `tag` ENUM('STABILITY', 'COST_PERFORMANCE', 'LIGHTWEIGHT', 'FLIGHT_DISTANCE', 'STRAIGHT', 'BALANCE') NOT NULL,
    `barrelId` VARCHAR(191) NOT NULL,
    `shaftId` VARCHAR(191) NULL,
    `flightId` VARCHAR(191) NOT NULL,
    `tipId` VARCHAR(191) NOT NULL,
    `totalWeight` DOUBLE NOT NULL,
    `totalPrice` INTEGER NOT NULL,
    `favoriteCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `setting_userId_idx`(`userId`),
    INDEX `setting_barrelId_idx`(`barrelId`),
    INDEX `setting_shaftId_idx`(`shaftId`),
    INDEX `setting_flightId_idx`(`flightId`),
    INDEX `setting_tipId_idx`(`tipId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `favorite` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `settingId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `favorite_settingId_idx`(`settingId`),
    UNIQUE INDEX `favorite_userId_settingId_key`(`userId`, `settingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `setting` ADD CONSTRAINT `setting_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `setting` ADD CONSTRAINT `setting_barrelId_fkey` FOREIGN KEY (`barrelId`) REFERENCES `barrel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `setting` ADD CONSTRAINT `setting_shaftId_fkey` FOREIGN KEY (`shaftId`) REFERENCES `shaft`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `setting` ADD CONSTRAINT `setting_flightId_fkey` FOREIGN KEY (`flightId`) REFERENCES `flight`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `setting` ADD CONSTRAINT `setting_tipId_fkey` FOREIGN KEY (`tipId`) REFERENCES `tip`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorite` ADD CONSTRAINT `favorite_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `favorite` ADD CONSTRAINT `favorite_settingId_fkey` FOREIGN KEY (`settingId`) REFERENCES `setting`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
