-- Add online_status field to user table
-- This field tracks whether a user is currently logged in (online) or not (offline)

ALTER TABLE `user` 
ADD COLUMN `online_status` ENUM('online', 'offline') DEFAULT 'offline' AFTER `status`;

-- Set all existing users to offline initially
UPDATE `user` SET `online_status` = 'offline';

