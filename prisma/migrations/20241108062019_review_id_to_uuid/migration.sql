-- This is an empty migration.-- First, create a new uuid column
ALTER TABLE "SiteReview" ADD COLUMN new_id UUID DEFAULT gen_random_uuid();

-- Copy existing reviews to preserve relationships if needed
UPDATE "SiteReview" SET new_id = gen_random_uuid();

-- Drop the old primary key constraint
ALTER TABLE "SiteReview" DROP CONSTRAINT "SiteReview_pkey";

-- Drop the old id column
ALTER TABLE "SiteReview" DROP COLUMN id;

-- Rename new_id to id
ALTER TABLE "SiteReview" RENAME COLUMN new_id TO id;

-- Make the new id column the primary key
ALTER TABLE "SiteReview" ADD PRIMARY KEY (id);