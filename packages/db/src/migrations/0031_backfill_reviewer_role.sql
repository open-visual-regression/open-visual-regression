UPDATE "user" SET "role" = 'reviewer' WHERE "role" IS NULL OR "role" = 'user';
