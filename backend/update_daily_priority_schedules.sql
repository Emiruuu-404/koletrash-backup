-- Update predefined schedules to include all 4 daily collections for North Centro and South Centro

-- First, delete existing daily priority schedules


-- Insert North Centro - 4x daily: 6AM, 10AM, 1PM, 4PM
INSERT INTO predefined_schedules (barangay_id, barangay_name, cluster_id, schedule_type, day_of_week, start_time, end_time, frequency_per_day) VALUES
-- Monday
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Monday', '06:00:00', '07:00:00', 4),
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Monday', '10:00:00', '11:00:00', 4),
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Monday', '13:00:00', '14:00:00', 4),
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Monday', '16:00:00', '17:00:00', 4),
-- Tuesday
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Tuesday', '06:00:00', '07:00:00', 4),
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Tuesday', '10:00:00', '11:00:00', 4),
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Tuesday', '13:00:00', '14:00:00', 4),
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Tuesday', '16:00:00', '17:00:00', 4),
-- Wednesday
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Wednesday', '06:00:00', '07:00:00', 4),
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Wednesday', '10:00:00', '11:00:00', 4),
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Wednesday', '13:00:00', '14:00:00', 4),
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Wednesday', '16:00:00', '17:00:00', 4),
-- Thursday
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Thursday', '06:00:00', '07:00:00', 4),
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Thursday', '10:00:00', '11:00:00', 4),
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Thursday', '13:00:00', '14:00:00', 4),
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Thursday', '16:00:00', '17:00:00', 4),
-- Friday
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Friday', '06:00:00', '07:00:00', 4),
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Friday', '10:00:00', '11:00:00', 4),
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Friday', '13:00:00', '14:00:00', 4),
('31-NRTHC', 'North Centro', '1C-PB', 'daily_priority', 'Friday', '16:00:00', '17:00:00', 4);

-- Insert South Centro - 4x daily: 7AM, 11AM, 2PM, 5PM
INSERT INTO predefined_schedules (barangay_id, barangay_name, cluster_id, schedule_type, day_of_week, start_time, end_time, frequency_per_day) VALUES
-- Monday
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Monday', '07:00:00', '08:00:00', 4),
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Monday', '11:00:00', '12:00:00', 4),
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Monday', '14:00:00', '15:00:00', 4),
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Monday', '17:00:00', '18:00:00', 4),
-- Tuesday
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Tuesday', '07:00:00', '08:00:00', 4),
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Tuesday', '11:00:00', '12:00:00', 4),
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Tuesday', '14:00:00', '15:00:00', 4),
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Tuesday', '17:00:00', '18:00:00', 4),
-- Wednesday
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Wednesday', '07:00:00', '08:00:00', 4),
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Wednesday', '11:00:00', '12:00:00', 4),
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Wednesday', '14:00:00', '15:00:00', 4),
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Wednesday', '17:00:00', '18:00:00', 4),
-- Thursday
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Thursday', '07:00:00', '08:00:00', 4),
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Thursday', '11:00:00', '12:00:00', 4),
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Thursday', '14:00:00', '15:00:00', 4),
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Thursday', '17:00:00', '18:00:00', 4),
-- Friday
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Friday', '07:00:00', '08:00:00', 4),
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Friday', '11:00:00', '12:00:00', 4),
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Friday', '14:00:00', '15:00:00', 4),
('39-STHCN', 'South Centro', '1C-PB', 'daily_priority', 'Friday', '17:00:00', '18:00:00', 4);







