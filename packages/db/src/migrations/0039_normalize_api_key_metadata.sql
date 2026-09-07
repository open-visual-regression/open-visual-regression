UPDATE "apikey" SET "metadata" = "metadata"::jsonb #>> '{}' WHERE "metadata" LIKE '"%"';
