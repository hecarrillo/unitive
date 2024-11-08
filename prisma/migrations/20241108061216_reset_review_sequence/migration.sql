-- First, get the current maximum ID
SELECT setval('"SiteReview_id_seq"', (SELECT MAX(id) FROM "SiteReview"), true);