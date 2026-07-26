const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3307,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'calculus_corner',
  waitForConnections: true,
  connectionLimit: process.env.DB_CONNECTION_LIMIT ? parseInt(process.env.DB_CONNECTION_LIMIT) : 50,
  maxIdle: process.env.DB_MAX_IDLE ? parseInt(process.env.DB_MAX_IDLE) : 10,
  idleTimeout: process.env.DB_IDLE_TIMEOUT ? parseInt(process.env.DB_IDLE_TIMEOUT) : 30000,
  queueLimit: 0
});

// Test connection stability on startup
pool.getConnection()
  .then(async conn => {
    try {
      console.log('MySQL Database connected successfully!');
      // Ensure last_login column exists on users table
      await conn.query(`
        ALTER TABLE \`users\` ADD COLUMN IF NOT EXISTS \`last_login\` TIMESTAMP NULL DEFAULT NULL
      `).catch(() => { }); // Silently skip if DB engine doesn't support IF NOT EXISTS
      // Fallback for older MySQL that doesn't support IF NOT EXISTS on ALTER
      try {
        await conn.query('ALTER TABLE `users` ADD COLUMN `last_login` TIMESTAMP NULL DEFAULT NULL');
      } catch (e) { /* column already exists */ }
      // Auto-create assessment tables if not exist
      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`question_pool\` (
          \`id\` varchar(50) NOT NULL,
          \`topic\` varchar(100) NOT NULL,
          \`question\` text NOT NULL,
          \`options\` json NOT NULL,
          \`correctAnswer\` varchar(255) NOT NULL,
          \`difficulty\` varchar(50) NOT NULL,
          \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Commented out AI functionalities
      // await conn.query(`
      //   CREATE TABLE IF NOT EXISTS \`ai_generation_logs\` (
      //     \`id\` int(11) NOT NULL AUTO_INCREMENT,
      //     \`user_id\` int(11) NOT NULL,
      //     \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      //     PRIMARY KEY (\`id\`)
      //   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      // `);

      // await conn.query(`
      //   CREATE TABLE IF NOT EXISTS \`ai_tutor_logs\` (
      //     \`id\` int(11) NOT NULL AUTO_INCREMENT,
      //     \`student_id\` int(11) NOT NULL,
      //     \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      //     PRIMARY KEY (\`id\`),
      //     CONSTRAINT \`fk_ai_tutor_logs_student\` FOREIGN KEY (\`student_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
      //   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      // `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`quiz_attempts\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`userId\` int(11) NOT NULL,
          \`score\` int(11) NOT NULL,
          \`totalQuestions\` int(11) NOT NULL,
          \`percentage\` decimal(5,2) NOT NULL,
          \`answers\` json NOT NULL,
          \`timeTaken\` int(11) NOT NULL,
          \`quizType\` varchar(50) NOT NULL,
          \`topic\` varchar(100) DEFAULT NULL,
          \`completedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          CONSTRAINT \`fk_quiz_attempts_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`video_progress\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`user_id\` int(11) NOT NULL,
          \`video_id\` int(11) NOT NULL,
          \`progress_percent\` decimal(5,2) NOT NULL DEFAULT 0.00,
          \`is_completed\` tinyint(1) NOT NULL DEFAULT 0,
          \`last_watched_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uq_video_progress\` (\`user_id\`, \`video_id\`),
          CONSTRAINT \`fk_video_progress_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`fk_video_progress_video\` FOREIGN KEY (\`video_id\`) REFERENCES \`videos\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Auto-create collaboration submissions table if not exists
      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`collaboration_submissions\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`name\` varchar(255) NOT NULL,
          \`email\` varchar(255) NOT NULL,
          \`business_name\` varchar(255) NOT NULL,
          \`business_niche\` varchar(255) NOT NULL,
          \`message\` text DEFAULT NULL,
          \`logo_url\` text DEFAULT NULL,
          \`is_visible\` tinyint(1) NOT NULL DEFAULT 0,
          \`sequence\` int(11) NOT NULL DEFAULT 0,
          \`description\` text DEFAULT NULL,
          \`tags\` text DEFAULT NULL,
          \`is_featured\` tinyint(1) NOT NULL DEFAULT 0,
          \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Ensure logo_url, is_visible, sequence, description, tags, and is_featured columns exist on collaboration_submissions table
      await conn.query(`
        ALTER TABLE \`collaboration_submissions\` 
        ADD COLUMN IF NOT EXISTS \`logo_url\` TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS \`is_visible\` TINYINT(1) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS \`sequence\` INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS \`description\` TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS \`tags\` TEXT DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS \`is_featured\` TINYINT(1) NOT NULL DEFAULT 0
      `).catch(() => { });
      try {
        await conn.query('ALTER TABLE `collaboration_submissions` ADD COLUMN `logo_url` TEXT DEFAULT NULL');
      } catch (e) { }
      try {
        await conn.query('ALTER TABLE `collaboration_submissions` ADD COLUMN `is_visible` TINYINT(1) NOT NULL DEFAULT 0');
      } catch (e) { }
      try {
        await conn.query('ALTER TABLE `collaboration_submissions` ADD COLUMN `sequence` INT NOT NULL DEFAULT 0');
      } catch (e) { }
      try {
        await conn.query('ALTER TABLE `collaboration_submissions` ADD COLUMN `description` TEXT DEFAULT NULL');
      } catch (e) { }
      try {
        await conn.query('ALTER TABLE `collaboration_submissions` ADD COLUMN `tags` TEXT DEFAULT NULL');
      } catch (e) { }
      try {
        await conn.query('ALTER TABLE `collaboration_submissions` ADD COLUMN `is_featured` TINYINT(1) NOT NULL DEFAULT 0');
      } catch (e) { }

      // Ensure duration column exists on videos table
      await conn.query(`
        ALTER TABLE \`videos\` ADD COLUMN IF NOT EXISTS \`duration\` VARCHAR(50) DEFAULT NULL
      `).catch(() => { });
      try {
        await conn.query('ALTER TABLE `videos` ADD COLUMN `duration` VARCHAR(50) DEFAULT NULL');
      } catch (e) { /* column already exists */ }

      // Ensure show_on_homepage column exists on videos table
      await conn.query(`
        ALTER TABLE \`videos\` ADD COLUMN IF NOT EXISTS \`show_on_homepage\` TINYINT(1) NOT NULL DEFAULT 0
      `).catch(() => { });
      try {
        await conn.query('ALTER TABLE `videos` ADD COLUMN `show_on_homepage` TINYINT(1) NOT NULL DEFAULT 0');
      } catch (e) { /* column already exists */ }

      // Ensure show_on_homepage column exists on resources table
      await conn.query(`
        ALTER TABLE \`resources\` ADD COLUMN IF NOT EXISTS \`show_on_homepage\` TINYINT(1) NOT NULL DEFAULT 0
      `).catch(() => { });
      try {
        await conn.query('ALTER TABLE `resources` ADD COLUMN `show_on_homepage` TINYINT(1) NOT NULL DEFAULT 0');
      } catch (e) { /* column already exists */ }

      // Ensure show_on_homepage column exists on books table
      await conn.query(`
        ALTER TABLE \`books\` ADD COLUMN IF NOT EXISTS \`show_on_homepage\` TINYINT(1) NOT NULL DEFAULT 0
      `).catch(() => { });
      try {
        await conn.query('ALTER TABLE `books` ADD COLUMN `show_on_homepage` TINYINT(1) NOT NULL DEFAULT 0');
      } catch (e) { /* column already exists */ }

      // Ensure last_position column exists on video_progress table
      await conn.query(`
        ALTER TABLE \`video_progress\` ADD COLUMN IF NOT EXISTS \`last_position\` INT NOT NULL DEFAULT 0
      `).catch(() => { });
      try {
        await conn.query('ALTER TABLE `video_progress` ADD COLUMN `last_position` INT NOT NULL DEFAULT 0');
      } catch (e) { /* column already exists */ }

      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`course_progress\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`user_id\` int(11) NOT NULL,
          \`course_id\` int(11) NOT NULL,
          \`progress_percent\` decimal(5,2) NOT NULL DEFAULT 0.00,
          \`is_completed\` tinyint(1) NOT NULL DEFAULT 0,
          \`last_accessed_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uq_course_progress\` (\`user_id\`, \`course_id\`),
          CONSTRAINT \`fk_course_progress_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`fk_course_progress_course\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`user_badges\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`userId\` int(11) NOT NULL,
          \`badgeName\` varchar(100) NOT NULL,
          \`earnedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          CONSTRAINT \`fk_user_badges_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`notifications\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`user_id\` int(11) DEFAULT NULL,
          \`title\` varchar(255) NOT NULL,
          \`text\` text NOT NULL,
          \`type\` varchar(50) NOT NULL,
          \`role\` varchar(20) NOT NULL DEFAULT 'student',
          \`is_read\` tinyint(4) NOT NULL DEFAULT 0,
          \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          KEY \`user_id\` (\`user_id\`),
          CONSTRAINT \`fk_notifications_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`support_messages\` (
          \`id\`           int(11) NOT NULL AUTO_INCREMENT,
          \`student_id\`   int(11) NOT NULL,
          \`sender_role\`  varchar(20) NOT NULL,
          \`message\`      text NOT NULL,
          \`created_at\`   timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          KEY \`student_id\` (\`student_id\`),
          CONSTRAINT \`fk_support_student\` FOREIGN KEY (\`student_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      try {
        await conn.query("ALTER TABLE `notifications` ADD COLUMN `role` VARCHAR(20) NOT NULL DEFAULT 'student'");
      } catch (colErr) {
        // Ignore column already exists
      }

      // Alter resources for original filename and metadata
      try {
        await conn.query("ALTER TABLE `resources` ADD COLUMN `original_filename` VARCHAR(255) NULL");
      } catch (colErr) { }
      try {
        await conn.query("ALTER TABLE `resources` ADD COLUMN `metadata` JSON NULL");
      } catch (colErr) { }

      // Alter courses for thumbnail
      try {
        await conn.query("ALTER TABLE `courses` ADD COLUMN `thumbnail` VARCHAR(255) NULL");
      } catch (colErr) { }

      // Add class to students_profile
      try {
        await conn.query("ALTER TABLE `students_profile` ADD COLUMN `class` VARCHAR(50) NULL DEFAULT NULL");
      } catch (e) { }

      // Add thumbnail and subcategory to resources (Notes)
      try { await conn.query("ALTER TABLE `resources` ADD COLUMN `thumbnail_url` VARCHAR(255) NULL"); } catch (e) { }
      try { await conn.query("ALTER TABLE `resources` ADD COLUMN `subcategory` VARCHAR(255) NULL"); } catch (e) { }

      // Add subcategory to videos
      try { await conn.query("ALTER TABLE `videos` ADD COLUMN `subcategory` VARCHAR(255) NULL"); } catch (e) { }

      // Create books table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`books\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`title\` varchar(255) NOT NULL,
          \`category\` varchar(100) NOT NULL,
          \`subcategory\` varchar(255) DEFAULT NULL,
          \`file_url\` varchar(255) NOT NULL,
          \`thumbnail_url\` varchar(255) DEFAULT NULL,
          \`uploaderId\` int(11) DEFAULT NULL,
          \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Add thumbnail and subcategory to resources (Notes)
      try { await conn.query("ALTER TABLE `resources` ADD COLUMN `thumbnail_url` VARCHAR(255) NULL"); } catch (e) { }
      try { await conn.query("ALTER TABLE `resources` ADD COLUMN `subcategory` VARCHAR(255) NULL"); } catch (e) { }

      // Add subcategory to videos
      try { await conn.query("ALTER TABLE `videos` ADD COLUMN `subcategory` VARCHAR(255) NULL"); } catch (e) { }

      // Create books table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`books\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`title\` varchar(255) NOT NULL,
          \`category\` varchar(100) NOT NULL,
          \`subcategory\` varchar(255) DEFAULT NULL,
          \`file_url\` varchar(255) NOT NULL,
          \`thumbnail_url\` varchar(255) DEFAULT NULL,
          \`uploaderId\` int(11) DEFAULT NULL,
          \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Add thumbnail and subcategory to resources (Notes)
      try { await conn.query("ALTER TABLE `resources` ADD COLUMN `thumbnail_url` VARCHAR(255) NULL"); } catch (e) { }
      try { await conn.query("ALTER TABLE `resources` ADD COLUMN `subcategory` VARCHAR(255) NULL"); } catch (e) { }

      // Add subcategory to videos
      try { await conn.query("ALTER TABLE `videos` ADD COLUMN `subcategory` VARCHAR(255) NULL"); } catch (e) { }

      // Create books table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`books\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`title\` varchar(255) NOT NULL,
          \`category\` varchar(100) NOT NULL,
          \`subcategory\` varchar(255) DEFAULT NULL,
          \`file_url\` varchar(255) NOT NULL,
          \`thumbnail_url\` varchar(255) DEFAULT NULL,
          \`uploaderId\` int(11) DEFAULT NULL,
          \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Add missing columns to books table
      try { await conn.query("ALTER TABLE `books` ADD COLUMN `original_filename` VARCHAR(255) NULL"); } catch (e) { }
      try { await conn.query("ALTER TABLE `books` ADD COLUMN `metadata` JSON NULL"); } catch (e) { }

      // Create updates table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`updates\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`title\` varchar(255) NOT NULL,
          \`content\` text NOT NULL,
          \`category\` varchar(50) DEFAULT 'General',
          \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);



      // Add optional link column to updates
      try { await conn.query("ALTER TABLE `updates` ADD COLUMN `link` VARCHAR(500) NULL"); } catch (e) { }

      // Create newsletter_subscribers table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`newsletter_subscribers\` (
          \`id\` INT NOT NULL AUTO_INCREMENT,
          \`email\` VARCHAR(255) NOT NULL,
          \`subscribed_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uq_newsletter_email\` (\`email\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Alter newsletter_subscribers for status, unsubscribe_token, last_email_sent, created_at, updated_at
      try {
        await conn.query("ALTER TABLE `newsletter_subscribers` ADD COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'active'");
      } catch (colErr) { }
      try {
        await conn.query("ALTER TABLE `newsletter_subscribers` ADD COLUMN `unsubscribe_token` VARCHAR(255) NULL");
      } catch (colErr) { }
      try {
        await conn.query("ALTER TABLE `newsletter_subscribers` ADD COLUMN `last_email_sent` TIMESTAMP NULL DEFAULT NULL");
      } catch (colErr) { }
      try {
        await conn.query("ALTER TABLE `newsletter_subscribers` ADD COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP");
      } catch (colErr) { }
      try {
        await conn.query("ALTER TABLE `newsletter_subscribers` ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
      } catch (colErr) { }

      // Keep is_active and status synced
      try {
        await conn.query("UPDATE `newsletter_subscribers` SET `status` = 'inactive' WHERE `is_active` = 0");
        await conn.query("UPDATE `newsletter_subscribers` SET `is_active` = 0 WHERE `status` = 'inactive'");
      } catch (err) { }

      // Create email_logs table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`email_logs\` (
          \`id\` INT NOT NULL AUTO_INCREMENT,
          \`recipient_email\` VARCHAR(255) NOT NULL,
          \`email_type\` VARCHAR(50) NOT NULL,
          \`status\` VARCHAR(20) NOT NULL,
          \`error_message\` TEXT DEFAULT NULL,
          \`sent_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);


      // Alter users for OTP verification
      try {
        await conn.query("ALTER TABLE `users` ADD COLUMN `is_verified` TINYINT NOT NULL DEFAULT 0");
      } catch (colErr) { }
      try {
        await conn.query("ALTER TABLE `users` ADD COLUMN `verification_otp` VARCHAR(10) NULL");
      } catch (colErr) { }
      try {
        await conn.query("ALTER TABLE `users` ADD COLUMN `otp_expiry` TIMESTAMP NULL");
      } catch (colErr) { }

      // Alter users for bans
      try {
        await conn.query("ALTER TABLE `users` ADD COLUMN `isBanned` TINYINT NOT NULL DEFAULT 0");
      } catch (colErr) { }
      try {
        await conn.query("ALTER TABLE `users` ADD COLUMN `banReason` TEXT NULL");
      } catch (colErr) { }
      try {
        await conn.query("ALTER TABLE `users` ADD COLUMN `bannedAt` TIMESTAMP NULL");
      } catch (colErr) { }
      try {
        await conn.query("ALTER TABLE `users` ADD COLUMN `bannedBy` INT NULL");
      } catch (colErr) { }
      try {
        await conn.query("ALTER TABLE `users` ADD COLUMN `restore_notified` TINYINT NOT NULL DEFAULT 0");
      } catch (colErr) { }

      // Seed Admin User if not exists
      try {
        const [adminRows] = await conn.query('SELECT id FROM `users` WHERE `role` = "admin"');
        if (adminRows.length === 0) {
          // Password hash for '#1Maths.Teacher@com'
          const adminHash = '$2b$10$fbJOXgJtAVafnYb908QIM.Rmcn1Jjg1S32tNgwLjmTd6Su8da.EkG';
          await conn.query(`
            INSERT INTO \`users\` (name, email, password, role, is_verified) 
            VALUES ('System Admin', 'Thecalculuscornerofficial@gmail.com', ?, 'admin', 1)
          `, [adminHash]);
        }
      } catch (e) {
        console.error('Error seeding admin user', e);
      }

      // Automatically verify any users created before OTP feature
      try {
        await conn.query("UPDATE `users` SET `is_verified` = 1 WHERE `verification_otp` IS NULL");
      } catch (e) { }

      // Create unban_requests table with complete production schema
      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`unban_requests\` (
          \`id\`                     int(11) NOT NULL AUTO_INCREMENT,
          \`student_id\`             int(11) NOT NULL,
          \`reason\`                 varchar(100) NOT NULL DEFAULT 'other',
          \`message\`                text NOT NULL,
          \`additional_explanation\` text DEFAULT NULL,
          \`status\`                 varchar(20) NOT NULL DEFAULT 'pending',
          \`admin_response\`         text DEFAULT NULL,
          \`reviewed_by\`            int(11) DEFAULT NULL,
          \`reviewed_at\`            timestamp NULL DEFAULT NULL,
          \`created_at\`             timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          \`updated_at\`             timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          KEY \`idx_unban_student_id\` (\`student_id\`),
          KEY \`idx_unban_status\` (\`status\`),
          CONSTRAINT \`fk_unban_student_new\` FOREIGN KEY (\`student_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Migrate old unban_requests columns to new schema if they exist
      // Add new columns (ignore errors if they already exist)
      const unbanAlters = [
        "ALTER TABLE `unban_requests` ADD COLUMN `student_id` INT NOT NULL DEFAULT 0",
        "ALTER TABLE `unban_requests` ADD COLUMN `reason` VARCHAR(100) NOT NULL DEFAULT 'other'",
        "ALTER TABLE `unban_requests` ADD COLUMN `additional_explanation` TEXT DEFAULT NULL",
        "ALTER TABLE `unban_requests` ADD COLUMN `admin_response` TEXT DEFAULT NULL",
        "ALTER TABLE `unban_requests` ADD COLUMN `reviewed_by` INT DEFAULT NULL",
        "ALTER TABLE `unban_requests` ADD COLUMN `reviewed_at` TIMESTAMP NULL DEFAULT NULL",
        "ALTER TABLE `unban_requests` ADD COLUMN `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
        "ALTER TABLE `unban_requests` ADD COLUMN `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        // Migrate studentId -> student_id data if old column exists
        "UPDATE `unban_requests` SET `student_id` = `studentId` WHERE `student_id` = 0 AND `studentId` IS NOT NULL",
        // Add constraint for student_id if it doesn't exist
        "ALTER TABLE `unban_requests` ADD CONSTRAINT `fk_unban_student_new` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE",
        // Drop old constraint fk_unban_student if it exists
        "ALTER TABLE `unban_requests` DROP FOREIGN KEY `fk_unban_student`",
        // Drop old column studentId if it exists
        "ALTER TABLE `unban_requests` DROP COLUMN `studentId`",
        // Normalize old PascalCase status values to lowercase
        "UPDATE `unban_requests` SET `status` = 'pending' WHERE `status` = 'Pending'",
        "UPDATE `unban_requests` SET `status` = 'approved' WHERE `status` = 'Approved'",
        "UPDATE `unban_requests` SET `status` = 'rejected' WHERE `status` = 'Rejected'",
      ];
      for (const sql of unbanAlters) {
        try { await conn.query(sql); } catch (e) { /* ignore — column may already exist or may not apply */ }
      }

      // Add unique constraint to enrollments to prevent duplicate enrollment
      try {
        await conn.query(`ALTER TABLE \`enrollments\` ADD UNIQUE KEY \`uq_enrollment\` (\`student_id\`, \`course_id\`)`);
      } catch (e) { /* ignore — index may already exist */ }

      // Ensure enrollments table status column exists
      try {
        await conn.query(`ALTER TABLE \`enrollments\` ADD COLUMN \`status\` VARCHAR(20) NOT NULL DEFAULT 'pending_payment'`);
      } catch (e) { }

      // Update enrollments for certificate tracking
      try {
        await conn.query(`ALTER TABLE \`enrollments\` ADD COLUMN \`certificate_status\` VARCHAR(20) NOT NULL DEFAULT 'none'`);
      } catch (e) { }

      // Update enrollments for payment screenshot upload
      try {
        await conn.query(`ALTER TABLE \`enrollments\` ADD COLUMN \`payment_screenshot\` VARCHAR(255) DEFAULT NULL`);
      } catch (e) { }

      // Add analytics columns (views/downloads) to books, resources, and videos
      try {
        await conn.query(`ALTER TABLE \`books\` ADD COLUMN \`views\` INT NOT NULL DEFAULT 0`);
      } catch (e) { }
      try {
        await conn.query(`ALTER TABLE \`books\` ADD COLUMN \`downloads\` INT NOT NULL DEFAULT 0`);
      } catch (e) { }
      try {
        await conn.query(`ALTER TABLE \`resources\` ADD COLUMN \`views\` INT NOT NULL DEFAULT 0`);
      } catch (e) { }
      try {
        await conn.query(`ALTER TABLE \`resources\` ADD COLUMN \`downloads\` INT NOT NULL DEFAULT 0`);
      } catch (e) { }
      try {
        await conn.query(`ALTER TABLE \`videos\` ADD COLUMN \`views\` INT NOT NULL DEFAULT 0`);
      } catch (e) { }

      // Update testimonials for review requests
      try {
        await conn.query(`ALTER TABLE \`testimonials\` ADD COLUMN \`student_id\` INT NULL`);
      } catch (e) { }
      try {
        await conn.query(`ALTER TABLE \`testimonials\` ADD COLUMN \`status\` VARCHAR(20) NOT NULL DEFAULT 'approved'`);
      } catch (e) { }
      try {
        await conn.query(`ALTER TABLE \`testimonials\` ADD UNIQUE KEY \`uq_testimonial_student\` (\`student_id\`)`);
      } catch (e) { }

      // Insert 2 default testimonials if empty
      try {
        const [testRows] = await conn.query('SELECT COUNT(*) as count FROM testimonials');
        if (testRows[0].count === 0) {
          await conn.query(`
            INSERT INTO testimonials (name, role, text, rating, status) VALUES 
            ('Ahmad Khan', 'A+ Grade (98%) - Federal Board', 'Calculus Corner completely changed my perspective on math. The step-by-step videos and past paper solutions helped me secure a top position in my board exams.', 5, 'approved'),
            ('Sara Ali', 'A Grade - Aga Khan Board', 'The practice quizzes and past papers are incredible! I was struggling with Integration, but the detailed explanations made it so easy.', 5, 'approved')
          `);
        }
      } catch (e) { console.error('Error inserting default testimonials', e); }

      // Update courses table for dynamic settings
      try {
        await conn.query(`ALTER TABLE \`courses\` ADD COLUMN \`external_drive_links\` JSON NULL`);
      } catch (e) { }
      try {
        await conn.query(`ALTER TABLE \`courses\` ADD COLUMN \`certificate_price\` VARCHAR(50) DEFAULT '0'`);
      } catch (e) { }
      try {
        await conn.query(`ALTER TABLE \`courses\` ADD COLUMN \`quiz_required\` TINYINT(1) DEFAULT 0`);
      } catch (e) { }

      // Create course_quizzes table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`course_quizzes\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`course_id\` int(11) NOT NULL,
          \`questions\` json NOT NULL,
          \`created_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uq_course_quiz\` (\`course_id\`),
          CONSTRAINT \`fk_course_quiz_course\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Create certificates table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`certificates\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`user_id\` int(11) NOT NULL,
          \`course_id\` int(11) NOT NULL,
          \`status\` varchar(20) NOT NULL DEFAULT 'issued',
          \`issued_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          UNIQUE KEY \`uq_certificate\` (\`user_id\`, \`course_id\`),
          CONSTRAINT \`fk_cert_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`id\`) ON DELETE CASCADE,
          CONSTRAINT \`fk_cert_course\` FOREIGN KEY (\`course_id\`) REFERENCES \`courses\` (\`id\`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Ensure default bank details exist in site_content
      try {
        await conn.query(`
          INSERT INTO \`site_content\` (\`section_name\`, \`content_data\`)
          VALUES ('bank_details', '{"account_name": "Calculus Corner Admin", "account_number": "1234-5678-9012", "bank_name": "Standard Chartered"}')
        `);
      } catch (e) { }

      // Add is_past_paper to resources and videos
      try { await conn.query("ALTER TABLE `resources` ADD COLUMN `is_past_paper` TINYINT(1) NOT NULL DEFAULT 0"); } catch (e) { }
      try { await conn.query("ALTER TABLE `videos` ADD COLUMN `is_past_paper` TINYINT(1) NOT NULL DEFAULT 0"); } catch (e) { }

      // Bootstrap Performance Indexes
      const indexSqls = [
        "ALTER TABLE `quiz_attempts` ADD INDEX `idx_quiz_attempts_user_date` (`userId`, `completedAt` DESC)",
        "ALTER TABLE `user_badges` ADD INDEX `idx_user_badges_user_earned` (`userId`, `earnedAt` DESC)",
        "ALTER TABLE `notifications` ADD INDEX `idx_notifications_user_role_created` (`user_id`, `role`, `created_at` DESC)",
        "ALTER TABLE `notifications` ADD INDEX `idx_notifications_role_created` (`role`, `created_at` DESC)",
        "ALTER TABLE `support_messages` ADD INDEX `idx_support_messages_student_created` (`student_id`, `created_at` ASC)",
        "ALTER TABLE `unban_requests` ADD INDEX `idx_unban_requests_student_created` (`student_id`, `created_at` DESC)",
        "ALTER TABLE `unban_requests` ADD INDEX `idx_unban_requests_status_created` (`status`, `created_at` DESC)",
        "ALTER TABLE `question_pool` ADD INDEX `idx_question_pool_topic` (`topic`)"
      ];

      for (const sql of indexSqls) {
        try {
          await conn.query(sql);
        } catch (e) {
          // Index might already exist, which is fine
        }
      }

    } catch (tableErr) {
      console.error('MySQL Auto-creation of quiz tables failed:', tableErr.message);
    }
    conn.release();
  })
  .catch(err => {
    console.error('MySQL Connection Pool Error:', err.message);
  });

module.exports = pool;
