-- ============================================================
-- Migration 001: Create unban_requests table
-- Add unique constraint to enrollments table
-- ============================================================

-- 1. Create unban_requests table with all required fields
CREATE TABLE IF NOT EXISTS `unban_requests` (
  `id`                     int(11) NOT NULL AUTO_INCREMENT,
  `student_id`             int(11) NOT NULL,
  `reason`                 varchar(100) NOT NULL DEFAULT 'other',
  `message`                text NOT NULL,
  `additional_explanation` text DEFAULT NULL,
  `status`                 varchar(20) NOT NULL DEFAULT 'pending',
  `admin_response`         text DEFAULT NULL,
  `reviewed_by`            int(11) DEFAULT NULL,
  `reviewed_at`            timestamp NULL DEFAULT NULL,
  `created_at`             timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`             timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_unban_student_id` (`student_id`),
  KEY `idx_unban_status` (`status`),
  CONSTRAINT `fk_unban_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_unban_reviewed_by` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Add unique constraint to enrollments to prevent duplicate enrollment
--    (ALTER IGNORE allows the statement to succeed even if the index already exists on some MySQL versions)
SET @sql = (
  SELECT IF(
    (SELECT COUNT(*) FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'enrollments'
       AND index_name = 'uq_enrollment') = 0,
    'ALTER TABLE `enrollments` ADD UNIQUE KEY `uq_enrollment` (`userId`, `courseId`)',
    'SELECT 1'  -- no-op if already exists
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
