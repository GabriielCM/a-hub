-- CreateEnum
CREATE TYPE "BenefitType" AS ENUM ('DISCOUNT', 'PARTNERSHIP');

-- CreateTable
CREATE TABLE "MemberCard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matricula" INTEGER NOT NULL,
    "photo" TEXT,
    "qrCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Benefit" (
    "id" TEXT NOT NULL,
    "type" "BenefitType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "photos" TEXT[],
    "city" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "neighborhood" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Benefit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberCard_userId_key" ON "MemberCard"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberCard_matricula_key" ON "MemberCard"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "MemberCard_qrCode_key" ON "MemberCard"("qrCode");

-- CreateIndex
CREATE INDEX "MemberCard_matricula_idx" ON "MemberCard"("matricula");

-- CreateIndex
CREATE INDEX "Benefit_type_idx" ON "Benefit"("type");

-- AddForeignKey
ALTER TABLE "MemberCard" ADD CONSTRAINT "MemberCard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
