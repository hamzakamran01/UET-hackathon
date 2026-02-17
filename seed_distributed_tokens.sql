-- SQL Seed File for Distributed DQMS Data
-- This script:
-- 1. Cleans up previous seed data (Tokens in 'seed-service-001')
-- 2. Creates 5 distinct Services
-- 3. Distributes ~100+ tokens across these services (Today & Tomorrow)

-- =============================================
-- 1. CLEANUP PREVIOUS SEED DATA
-- =============================================
DELETE FROM "Token" WHERE "serviceId" = 'seed-service-001';
DELETE FROM "Service" WHERE "id" = 'seed-service-001';

-- =============================================
-- 2. SEED MULTIPLE SERVICES
-- =============================================
INSERT INTO "Service" ("id", "name", "description", "isActive", "latitude", "longitude", "updatedAt", "createdAt")
VALUES 
('srv-01', 'Cash Operations', 'Deposits, withdrawals, and cash handling', true, 31.5204, 74.3587, NOW(), NOW()),
('srv-02', 'Account Services', 'Account opening, updates, and maintenance', true, 31.5204, 74.3587, NOW(), NOW()),
('srv-03', 'Corporate Banking', 'Business accounts and corporate services', true, 31.5204, 74.3587, NOW(), NOW()),
('srv-04', 'Remittance', 'International and local money transfers', true, 31.5204, 74.3587, NOW(), NOW()),
('srv-05', 'Customer Support', 'General inquiries and complaint resolution', true, 31.5204, 74.3587, NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;

-- =============================================
-- 3. HELPER: RANDOM DISTRIBUTION
-- =============================================
-- We will use a modulo approach to distribute tokens among the 5 services (srv-01 to srv-05)

-- =============================================
-- 4. SEED TOKENS FOR TODAY (25 Tokens Distributed)
-- =============================================
INSERT INTO "Token" (
    "id", "tokenNumber", "status", "queuePosition", "userId", "serviceId", "createdAt", "updatedAt"
)
SELECT
    'token-today-' || i,                 
    'T-' || LPAD(i::text, 3, '0'),       
    CASE                                 
        WHEN i % 5 = 0 THEN 'COMPLETED'::"TokenStatus"
        WHEN i % 5 = 1 THEN 'IN_SERVICE'::"TokenStatus"
        WHEN i % 5 = 2 THEN 'CALLED'::"TokenStatus"
        ELSE 'ACTIVE'::"TokenStatus"
    END,
    i,                                   
    'seed-user-001',                     
    'srv-0' || ((i % 5) + 1),            -- Rotates through srv-01 to srv-05
    NOW() - (30 - i) * INTERVAL '10 minutes', 
    NOW()
FROM generate_series(1, 25) AS t(i)
ON CONFLICT ("tokenNumber") DO NOTHING;

-- =============================================
-- 5. SEED TOKENS FOR TOMORROW (100 Tokens Distributed)
-- =============================================
INSERT INTO "Token" (
    "id", "tokenNumber", "status", "queuePosition", "userId", "serviceId", "createdAt", "updatedAt"
)
SELECT
    'token-tmrw-' || i,                  
    'F-' || LPAD(i::text, 3, '0'),       
    'ACTIVE'::"TokenStatus",             
    i,                                   
    'seed-user-001',                     
    'srv-0' || ((i % 5) + 1),            -- Rotates through srv-01 to srv-05
    (CURRENT_DATE + INTERVAL '1 day' + time '09:00:00') + (i * INTERVAL '3 minutes'), 
    (CURRENT_DATE + INTERVAL '1 day' + time '09:00:00')
FROM generate_series(1, 100) AS t(i)
ON CONFLICT ("tokenNumber") DO NOTHING;
