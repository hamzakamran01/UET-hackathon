-- SQL Seed File for DQMS
-- This script seeds:
-- 1. A test User (if not exists)
-- 2. A test Service (if not exists)
-- 3. 10 Tokens for TODAY (mixed statuses)
-- 4. 100 Tokens for TOMORROW (all ACTIVE)

-- =============================================
-- 1. SEED USER
-- =============================================
INSERT INTO "User" ("id", "email", "name", "password", "emailVerified", "updatedAt", "createdAt")
VALUES (
    'seed-user-001', 
    'seed.user@dqms.com', 
    'Seed Test User', 
    '$2b$10$ThisIsAFakeHashForSeedingPurposesOnly', -- Dummy hash
    true, 
    NOW(), 
    NOW()
)
ON CONFLICT ("email") DO NOTHING;

-- =============================================
-- 2. SEED SERVICE
-- =============================================
INSERT INTO "Service" (
    "id", 
    "name", 
    "description", 
    "isActive", 
    "latitude", 
    "longitude", 
    "updatedAt", 
    "createdAt"
)
VALUES (
    'seed-service-001', 
    'General Service Queue', 
    'Seeded service for testing', 
    true, 
    31.5204, -- Example Coords (Lahore, based on UET context)
    74.3587, 
    NOW(), 
    NOW()
)
ON CONFLICT ("name") DO NOTHING;

-- =============================================
-- 3. SEED TOKENS FOR TODAY (10 Tokens)
-- =============================================
-- Generates 10 tokens for today with staggered times and mixed statuses
INSERT INTO "Token" (
    "id", 
    "tokenNumber", 
    "status", 
    "queuePosition", 
    "userId", 
    "serviceId", 
    "createdAt", 
    "updatedAt"
)
SELECT
    'token-today-' || i,                 -- ID
    'A-' || LPAD(i::text, 3, '0'),       -- Token Number (A-001, A-002...)
    CASE                                 -- Status Distribution
        WHEN i <= 3 THEN 'COMPLETED'::"TokenStatus"
        WHEN i = 4 THEN 'IN_SERVICE'::"TokenStatus"
        WHEN i = 5 THEN 'CALLED'::"TokenStatus"
        ELSE 'ACTIVE'::"TokenStatus"
    END,
    i,                                   -- Queue Position
    'seed-user-001',                     -- User ID
    'seed-service-001',                  -- Service ID
    NOW() - (11 - i) * INTERVAL '15 minutes', -- Created in the past few hours
    NOW()
FROM generate_series(1, 10) AS t(i)
ON CONFLICT ("tokenNumber") DO NOTHING;

-- =============================================
-- 4. SEED TOKENS FOR TOMORROW (100 Tokens)
-- =============================================
-- Generates 100 tokens for tomorrow, all ACTIVE (simulating future load)
INSERT INTO "Token" (
    "id", 
    "tokenNumber", 
    "status", 
    "queuePosition", 
    "userId", 
    "serviceId", 
    "createdAt", 
    "updatedAt"
)
SELECT
    'token-tmrw-' || i,                  -- ID
    'B-' || LPAD(i::text, 3, '0'),       -- Token Number (B-001...B-100)
    'ACTIVE'::"TokenStatus",             -- All Active for future
    i,                                   -- Queue Position
    'seed-user-001',                     -- User ID
    'seed-service-001',                  -- Service ID
    (CURRENT_DATE + INTERVAL '1 day' + time '09:00:00') + (i * INTERVAL '5 minutes'), -- Tomorrow starting 9 AM
    (CURRENT_DATE + INTERVAL '1 day' + time '09:00:00') -- Updated at same time
FROM generate_series(1, 100) AS t(i)
ON CONFLICT ("tokenNumber") DO NOTHING;
