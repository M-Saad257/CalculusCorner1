-- Create Database if not exists
CREATE DATABASE IF NOT EXISTS `calculus_corner`;
USE `calculus_corner`;

-- 1. SITE_CONTENT TABLE
CREATE TABLE IF NOT EXISTS `site_content` (
  `section_name` varchar(50) NOT NULL,
  `content_data` json NOT NULL,
  PRIMARY KEY (`section_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. COURSES TABLE
CREATE TABLE IF NOT EXISTS `courses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `grade` varchar(50) NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` text NOT NULL,
  `features` json NOT NULL,
  `price` varchar(50) NOT NULL,
  `popular` tinyint(4) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. TESTIMONIALS TABLE
CREATE TABLE IF NOT EXISTS `testimonials` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `role` varchar(150) NOT NULL,
  `text` text NOT NULL,
  `rating` int(11) NOT NULL DEFAULT 5,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. USERS TABLE
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'student',
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `isBanned` tinyint(4) NOT NULL DEFAULT 0,
  `banReason` text DEFAULT NULL,
  `bannedAt` timestamp NULL DEFAULT NULL,
  `bannedBy` varchar(100) DEFAULT NULL,
  `restore_notified` tinyint(4) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. STUDENTS_PROFILE TABLE
CREATE TABLE IF NOT EXISTS `students_profile` (
  `user_id` int(11) NOT NULL,
  `bio` text DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `progress` json DEFAULT NULL,
  `class` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_student_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. RESOURCES TABLE
CREATE TABLE IF NOT EXISTS `resources` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `file_url` varchar(255) NOT NULL,
  `original_filename` varchar(255) NOT NULL,
  `metadata` json DEFAULT NULL,
  `category` varchar(50) NOT NULL DEFAULT 'General',
  `subcategory` varchar(50) DEFAULT NULL,
  `thumbnail_url` varchar(255) DEFAULT NULL,
  `is_past_paper` tinyint(4) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6.5 BOOKS TABLE
CREATE TABLE IF NOT EXISTS `books` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `file_url` varchar(255) NOT NULL,
  `original_filename` varchar(255) NOT NULL,
  `metadata` json DEFAULT NULL,
  `category` varchar(50) NOT NULL DEFAULT 'General',
  `subcategory` varchar(50) DEFAULT NULL,
  `thumbnail_url` varchar(255) DEFAULT NULL,
  `views` int(11) NOT NULL DEFAULT 0,
  `downloads` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. VIDEOS TABLE
CREATE TABLE IF NOT EXISTS `videos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `url` varchar(255) NOT NULL,
  `video_id` varchar(50) NOT NULL,
  `thumbnail` varchar(255) DEFAULT NULL,
  `category` varchar(50) NOT NULL DEFAULT 'Calculus',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_video_id` (`video_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --- SEED DATA ---

-- Seed default site content
INSERT INTO `site_content` (`section_name`, `content_data`) VALUES
('hero', '{
  "badge": "#1 Premium Math Learning Platform",
  "headline_part1": "Where Mathematics Meets",
  "headline_gradient": "Infinity",
  "subheadline": "Master Algebra, Geometry, Trigonometry, Statistics & Calculus through engaging lessons, expert guidance, and AI-powered learning.",
  "button_primary": "Start Learning",
  "button_secondary": "Watch Free Lessons",
  "notice_text": "Registration for 2026 Board Exams is Open - Limited Seats Available!",
  "stats_1_value": "98%",
  "stats_1_label": "Success Rate",
  "stats_2_value": "Exam Prep",
  "stats_2_label": "Targeted",
  "stats_3_value": "AI Assistant",
  "stats_3_label": "24/7 Help"
}'),
('about', '{
  "badge": "About Us",
  "heading": "Transforming Math Anxiety into",
  "heading_gradient": "Mathematical Mastery",
  "paragraph1": "Calculus Corner is more than just a tutoring platform. We are a dedicated educational hub designed to make complex mathematical concepts intuitive, engaging, and accessible to everyone. Our mission is to build foundational strength that lasts a lifetime.",
  "paragraph2": "We believe that every student has the potential to excel in mathematics given the right tools, framework, and environment. We combine state-of-the-art interactive modules with live guidance to provide a complete ecosystem."
}'),
('contact', '{
  "badge": "Get in Touch",
  "heading": "Ready to Start Your",
  "heading_gradient": "Math Journey?",
  "subheading": "Have a question about our courses, AI features, or pricing? Drop us a message and our team will get back to you shortly.",
  "email": "support@calculuscorner.com",
  "phone": "+92 (300) 123-4567",
  "address": "12-B, Sector H-3, Islamabad, Pakistan"
}')
ON DUPLICATE KEY UPDATE `content_data` = VALUES(`content_data`);

-- Seed standard courses
INSERT INTO `courses` (`id`, `grade`, `title`, `description`, `features`, `price`, `popular`) VALUES
(1, 'Grade 9', 'Algebra & Geometry Foundation', 'Master equations, inequalities, functions, and the fundamental building blocks of advanced mathematics.', '["Daily Video Lessons", "Interactive Chapter Quizzes", "Weekly Live Q&A Sessions", "PDF Formula Sheets", "Basic AI Tutor Support"]', 'Rs. 2,500/mo', 0),
(2, 'Grade 10', 'Trigonometry & Pre-Calculus', 'Explore properties of space, shapes, and logical deductions through proofs, theorems, and identities.', '["Everything in Grade 9", "Mock Midterm & Final Exams", "AI Study Planner Integration", "Step-by-Step Worksheet Solvers", "24/7 AI Tutor Access"]', 'Rs. 3,000/mo', 1),
(3, 'Grade 11', 'Calculus I (Limits & Derivatives)', 'Understand relationships between angles and side lengths, from basic ratios to complex functions.', '["Advanced Video Library", "Personalized Learning Insights", "Calculus Cheat Sheet PDF", "Priority Live Q&A Help", "Full Exam Prep Assistant Access"]', 'Rs. 3,500/mo', 0),
(4, 'Grade 12', 'Calculus II (Integrals & Series)', 'Dive deep into limits, derivatives, integrals, and the mathematics of continuous change.', '["Complete Integrals Walkthrough", "Advanced Infinite Series Guides", "1-on-1 Monthly Mentorship Session", "Board Exam Mock Simulations", "Unlimited AI Support Solutions"]', 'Rs. 4,000/mo', 0),
(5, 'SAT Prep', 'SAT Mathematics Prep', 'Learn data analysis, probability, and how to make informed decisions using statistical methods.', '["10 Full-Length SAT Mock Tests", "High-Yield Formulas Overview", "SAT Math Secrets Cheat Sheet", "Interactive Scoring Dashboard", "Time-Management Strategies Session"]', 'Rs. 4,500/mo', 0)
ON DUPLICATE KEY UPDATE 
  `grade` = VALUES(`grade`),
  `title` = VALUES(`title`),
  `description` = VALUES(`description`),
  `features` = VALUES(`features`),
  `price` = VALUES(`price`),
  `popular` = VALUES(`popular`);

-- Seed standard reviews
INSERT INTO `testimonials` (`id`, `name`, `role`, `text`, `rating`) VALUES
(1, 'Ahmad Khan', 'A+ Grade (98%) - Federal Board', 'Calculus Corner completely changed my perspective on math. The step-by-step videos and past paper solutions helped me secure a top position in my board exams.', 5),
(2, 'Fatima Ali', 'ECAT Topper - UET Lahore', 'The shortcut tricks taught here for the Entry Test are unmatched. I was able to solve complex MCQs in under 30 seconds!', 5),
(3, 'Zainab Qureshi', 'A Grade - Sindh Board', 'I used to have severe math anxiety. The AI tutor and the interactive lessons made everything so clear. Highly recommended!', 5)
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `role` = VALUES(`role`),
  `text` = VALUES(`text`),
  `rating` = VALUES(`rating`);

-- Seed standard resources
INSERT INTO `resources` (`id`, `title`, `file_url`) VALUES
(1, 'Limits & Continuity Cheat Sheet', 'https://www.math.uci.edu/~asirigna/limits_cheat_sheet.pdf'),
(2, 'Common Derivatives Reference Table', 'https://www.math.uci.edu/~asirigna/derivatives_table.pdf'),
(3, 'Table of Integrals Reference Guide', 'https://www.math.uci.edu/~asirigna/integrals_table.pdf')
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `file_url` = VALUES(`file_url`);

-- Seed standard videos
INSERT INTO `videos` (`id`, `title`, `url`, `video_id`, `thumbnail`, `category`) VALUES
(1, 'Introduction to Limits and Continuity', 'https://www.youtube.com/watch?v=riXcZT2ICjA', 'riXcZT2ICjA', 'https://i.ytimg.com/vi/riXcZT2ICjA/hqdefault.jpg', 'Calculus'),
(2, 'Understanding the Derivative Conceptually', 'https://www.youtube.com/watch?v=N2PpRnFqnqY', 'N2PpRnFqnqY', 'https://i.ytimg.com/vi/N2PpRnFqnqY/hqdefault.jpg', 'Calculus'),
(3, 'The Fundamental Theorem of Calculus', 'https://www.youtube.com/watch?v=F4qRsoVb6tQ', 'F4qRsoVb6tQ', 'https://i.ytimg.com/vi/F4qRsoVb6tQ/hqdefault.jpg', 'Calculus')
ON DUPLICATE KEY UPDATE
  `title` = VALUES(`title`),
  `url` = VALUES(`url`),
  `video_id` = VALUES(`video_id`),
  `thumbnail` = VALUES(`thumbnail`),
  `category` = VALUES(`category`);

-- 8. QUESTION_POOL TABLE
CREATE TABLE IF NOT EXISTS `question_pool` (
  `id` varchar(50) NOT NULL,
  `topic` varchar(100) NOT NULL,
  `question` text NOT NULL,
  `options` json NOT NULL,
  `correctAnswer` varchar(255) NOT NULL,
  `difficulty` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. QUIZ_ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS `quiz_attempts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `score` int(11) NOT NULL,
  `totalQuestions` int(11) NOT NULL,
  `percentage` decimal(5,2) NOT NULL,
  `answers` json NOT NULL,
  `timeTaken` int(11) NOT NULL,
  `quizType` varchar(50) NOT NULL,
  `topic` varchar(100) DEFAULT NULL,
  `completedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_quiz_attempts_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. USER_BADGES TABLE
CREATE TABLE IF NOT EXISTS `user_badges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `badgeName` varchar(100) NOT NULL,
  `earnedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_user_badges_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. ENROLLMENTS TABLE (tracks which students are enrolled in which courses)
CREATE TABLE IF NOT EXISTS `enrollments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_enrollments_user` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_enrollments_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `text` text NOT NULL,
  `type` varchar(50) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'student',
  `is_read` tinyint(4) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. SUPPORT_MESSAGES TABLE
CREATE TABLE IF NOT EXISTS `support_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `sender_role` varchar(20) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_support_messages_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. UNBAN_REQUESTS TABLE
CREATE TABLE IF NOT EXISTS `unban_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `reason` varchar(50) NOT NULL DEFAULT 'other',
  `additional_explanation` text DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `admin_response` text DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_unban_requests_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_unban_requests_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS `subjects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` varchar(100) NOT NULL,
  `title` varchar(150) NOT NULL,
  `subtitle` text NOT NULL,
  `badge` varchar(50) DEFAULT NULL,
  `icon` varchar(50) DEFAULT 'FunctionSquare',
  `bgColor` varchar(100) DEFAULT 'bg-blue-50 text-blue-600',
  `seoTitle` varchar(255) DEFAULT NULL,
  `seoDescription` text DEFAULT NULL,
  `overview` text NOT NULL,
  `whyItMatters` text NOT NULL,
  `topicsCovered` json NOT NULL,
  `whoItIsFor` text NOT NULL,
  `howWeHelp` text NOT NULL,
  `learningOutcomes` json NOT NULL,
  `examPrepTips` json NOT NULL,
  `sidebarDifficulty` varchar(50) DEFAULT 'Medium',
  `sidebarFocus` varchar(150) DEFAULT NULL,
  `sidebarRecommendedGrade` varchar(100) DEFAULT NULL,
  `sidebarStudyTime` varchar(100) DEFAULT NULL,
  `relatedVideosCategory` varchar(100) DEFAULT NULL,
  `relatedSubjects` json NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_subject_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

