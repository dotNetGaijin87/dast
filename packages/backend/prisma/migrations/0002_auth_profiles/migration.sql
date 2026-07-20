-- AlterTable: add test identities for active authorization checks
ALTER TABLE "Target" ADD COLUMN "authProfiles" JSONB NOT NULL DEFAULT '[]';
