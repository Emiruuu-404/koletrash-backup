-- SQL Query to Add Weekend Schedules (Saturday and Sunday)
-- For PB (Priority Barangays - 1C-PB) and CB (Cluster B - 3C-CB)
-- Using INSERT IGNORE to skip duplicates if they already exist

-- ============================================
-- 1. NORTH CENTRO (31-NRTHC) - Daily Priority
-- ============================================
-- Saturday schedules (same times as weekdays)
INSERT IGNORE INTO predefined_schedules (barangay_id, barangay_name, cluster_id, schedule_type, day_of_week, start_time, end_time, frequency_per_day, week_of_month, is_active, created_at, updated_at)
VALUES 
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Saturday', '06:00:00', '07:00:00', 4, NULL, 1, NOW(), NOW()),
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Saturday', '10:00:00', '11:00:00', 4, NULL, 1, NOW(), NOW()),
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Saturday', '13:00:00', '14:00:00', 4, NULL, 1, NOW(), NOW()),
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Saturday', '16:00:00', '17:00:00', 4, NULL, 1, NOW(), NOW());

-- Sunday schedules (same times as weekdays)
INSERT IGNORE INTO predefined_schedules (barangay_id, barangay_name, cluster_id, schedule_type, day_of_week, start_time, end_time, frequency_per_day, week_of_month, is_active, created_at, updated_at)
VALUES 
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Sunday', '06:00:00', '07:00:00', 4, NULL, 1, NOW(), NOW()),
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Sunday', '10:00:00', '11:00:00', 4, NULL, 1, NOW(), NOW()),
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Sunday', '13:00:00', '14:00:00', 4, NULL, 1, NOW(), NOW()),
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Sunday', '16:00:00', '17:00:00', 4, NULL, 1, NOW(), NOW());

-- ============================================
-- 2. SOUTH CENTRO (39-STHCN) - Daily Priority
-- ============================================
-- Saturday schedules (same times as weekdays)
INSERT IGNORE INTO predefined_schedules (barangay_id, barangay_name, cluster_id, schedule_type, day_of_week, start_time, end_time, frequency_per_day, week_of_month, is_active, created_at, updated_at)
VALUES 
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Saturday', '07:00:00', '08:00:00', 4, NULL, 1, NOW(), NOW()),
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Saturday', '11:00:00', '12:00:00', 4, NULL, 1, NOW(), NOW()),
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Saturday', '14:00:00', '15:00:00', 4, NULL, 1, NOW(), NOW()),
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Saturday', '17:00:00', '18:00:00', 4, NULL, 1, NOW(), NOW());

-- Sunday schedules (same times as weekdays)
INSERT IGNORE INTO predefined_schedules (barangay_id, barangay_name, cluster_id, schedule_type, day_of_week, start_time, end_time, frequency_per_day, week_of_month, is_active, created_at, updated_at)
VALUES 
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Sunday', '07:00:00', '08:00:00', 4, NULL, 1, NOW(), NOW()),
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Sunday', '11:00:00', '12:00:00', 4, NULL, 1, NOW(), NOW()),
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Sunday', '14:00:00', '15:00:00', 4, NULL, 1, NOW(), NOW()),
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Sunday', '17:00:00', '18:00:00', 4, NULL, 1, NOW(), NOW());

-- ============================================
-- 3. CLUSTER B (3C-CB) - Weekly Cluster (Week 2)
-- ============================================
-- Saturday schedules (duplicating Week 2 schedules)
INSERT IGNORE INTO predefined_schedules (barangay_id, barangay_name, cluster_id, schedule_type, day_of_week, start_time, end_time, frequency_per_day, week_of_month, is_active, created_at, updated_at)
VALUES 
('07-BNHN', 'Binahian', '3C-CB', 'weekly_cluster', 'Saturday', '08:00:00', '09:00:00', 1, 2, 1, NOW(), NOW()),
('13-CM', 'Caima', '3C-CB', 'weekly_cluster', 'Saturday', '10:00:00', '11:00:00', 1, 2, 1, NOW(), NOW()),
('06-BGNGS', 'Bagong Sirang', '3C-CB', 'weekly_cluster', 'Saturday', '11:00:00', '12:00:00', 1, 2, 1, NOW(), NOW()),
('16-CRYRY', 'Carayrayan', '3C-CB', 'weekly_cluster', 'Saturday', '08:00:00', '09:00:00', 1, 2, 1, NOW(), NOW()),
('21-LPLP', 'Lipilip', '3C-CB', 'weekly_cluster', 'Saturday', '10:00:00', '11:00:00', 1, 2, 1, NOW(), NOW()),
('23-LBGNS', 'Lubigan Sr.', '3C-CB', 'weekly_cluster', 'Saturday', '11:00:00', '12:00:00', 1, 2, 1, NOW(), NOW()),
('22-LBGNJ', 'Lubigan Jr.', '3C-CB', 'weekly_cluster', 'Saturday', '09:00:00', '10:00:00', 1, 2, 1, NOW(), NOW()),
('26-MNNGL', 'Manangle', '3C-CB', 'weekly_cluster', 'Saturday', '10:00:00', '11:00:00', 1, 2, 1, NOW(), NOW()),
('18-GB', 'Gabi', '3C-CB', 'weekly_cluster', 'Saturday', '09:00:00', '10:30:00', 1, 2, 1, NOW(), NOW()),
('29-MNLBN', 'Manlubang', '3C-CB', 'weekly_cluster', 'Saturday', '10:30:00', '12:00:00', 1, 2, 1, NOW(), NOW()),
('11-BLWN', 'Bulawan', '3C-CB', 'weekly_cluster', 'Saturday', '11:00:00', '12:00:00', 1, 2, 1, NOW(), NOW());

-- Sunday schedules (duplicating Week 2 schedules)
INSERT IGNORE INTO predefined_schedules (barangay_id, barangay_name, cluster_id, schedule_type, day_of_week, start_time, end_time, frequency_per_day, week_of_month, is_active, created_at, updated_at)
VALUES 
('07-BNHN', 'Binahian', '3C-CB', 'weekly_cluster', 'Sunday', '08:00:00', '09:00:00', 1, 2, 1, NOW(), NOW()),
('13-CM', 'Caima', '3C-CB', 'weekly_cluster', 'Sunday', '10:00:00', '11:00:00', 1, 2, 1, NOW(), NOW()),
('06-BGNGS', 'Bagong Sirang', '3C-CB', 'weekly_cluster', 'Sunday', '11:00:00', '12:00:00', 1, 2, 1, NOW(), NOW()),
('16-CRYRY', 'Carayrayan', '3C-CB', 'weekly_cluster', 'Sunday', '08:00:00', '09:00:00', 1, 2, 1, NOW(), NOW()),
('21-LPLP', 'Lipilip', '3C-CB', 'weekly_cluster', 'Sunday', '10:00:00', '11:00:00', 1, 2, 1, NOW(), NOW()),
('23-LBGNS', 'Lubigan Sr.', '3C-CB', 'weekly_cluster', 'Sunday', '11:00:00', '12:00:00', 1, 2, 1, NOW(), NOW()),
('22-LBGNJ', 'Lubigan Jr.', '3C-CB', 'weekly_cluster', 'Sunday', '09:00:00', '10:00:00', 1, 2, 1, NOW(), NOW()),
('26-MNNGL', 'Manangle', '3C-CB', 'weekly_cluster', 'Sunday', '10:00:00', '11:00:00', 1, 2, 1, NOW(), NOW()),
('18-GB', 'Gabi', '3C-CB', 'weekly_cluster', 'Sunday', '09:00:00', '10:30:00', 1, 2, 1, NOW(), NOW()),
('29-MNLBN', 'Manlubang', '3C-CB', 'weekly_cluster', 'Sunday', '10:30:00', '12:00:00', 1, 2, 1, NOW(), NOW()),
('11-BLWN', 'Bulawan', '3C-CB', 'weekly_cluster', 'Sunday', '11:00:00', '12:00:00', 1, 2, 1, NOW(), NOW());

-- ============================================
-- 4. FIXED DAYS SCHEDULES (1C-PB) - Weekend
-- ============================================
-- Impig (20-IMPG) - Saturday and Sunday (same times as Monday/Wednesday/Friday)
INSERT IGNORE INTO predefined_schedules (barangay_id, barangay_name, cluster_id, schedule_type, day_of_week, start_time, end_time, frequency_per_day, week_of_month, is_active, created_at, updated_at)
VALUES 
('20-IMPG', 'Impig', '1C-PB', 'fixed_days', 'Saturday', '08:00:00', '10:00:00', 1, NULL, 1, NOW(), NOW()),
('20-IMPG', 'Impig', '1C-PB', 'fixed_days', 'Sunday', '08:00:00', '10:00:00', 1, NULL, 1, NOW(), NOW());

-- Malubago (25-MLBG) - Saturday and Sunday (same times as Tuesday/Friday)
INSERT IGNORE INTO predefined_schedules (barangay_id, barangay_name, cluster_id, schedule_type, day_of_week, start_time, end_time, frequency_per_day, week_of_month, is_active, created_at, updated_at)
VALUES 
('25-MLBG', 'Malubago', '1C-PB', 'fixed_days', 'Saturday', '08:00:00', '10:00:00', 1, NULL, 1, NOW(), NOW()),
('25-MLBG', 'Malubago', '1C-PB', 'fixed_days', 'Sunday', '08:00:00', '10:00:00', 1, NULL, 1, NOW(), NOW());

-- Tara (42-TR) - Saturday and Sunday (same times as Monday/Wednesday/Friday)
INSERT IGNORE INTO predefined_schedules (barangay_id, barangay_name, cluster_id, schedule_type, day_of_week, start_time, end_time, frequency_per_day, week_of_month, is_active, created_at, updated_at)
VALUES 
('42-TR', 'Tara', '1C-PB', 'fixed_days', 'Saturday', '10:00:00', '12:00:00', 1, NULL, 1, NOW(), NOW()),
('42-TR', 'Tara', '1C-PB', 'fixed_days', 'Sunday', '10:00:00', '12:00:00', 1, NULL, 1, NOW(), NOW());

-- Gaongan (19-GNGN) - Saturday and Sunday (same time as Thursday)
INSERT IGNORE INTO predefined_schedules (barangay_id, barangay_name, cluster_id, schedule_type, day_of_week, start_time, end_time, frequency_per_day, week_of_month, is_active, created_at, updated_at)
VALUES 
('19-GNGN', 'Gaongan', '1C-PB', 'fixed_days', 'Saturday', '08:00:00', '11:00:00', 1, NULL, 1, NOW(), NOW()),
('19-GNGN', 'Gaongan', '1C-PB', 'fixed_days', 'Sunday', '08:00:00', '11:00:00', 1, NULL, 1, NOW(), NOW());

-- Azucena (05-AZCN) - Saturday and Sunday (same time as Friday)
INSERT IGNORE INTO predefined_schedules (barangay_id, barangay_name, cluster_id, schedule_type, day_of_week, start_time, end_time, frequency_per_day, week_of_month, is_active, created_at, updated_at)
VALUES 
('05-AZCN', 'Azucena', '1C-PB', 'fixed_days', 'Saturday', '13:00:00', '15:00:00', 1, NULL, 1, NOW(), NOW()),
('05-AZCN', 'Azucena', '1C-PB', 'fixed_days', 'Sunday', '13:00:00', '15:00:00', 1, NULL, 1, NOW(), NOW());

