-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 16, 2026 at 06:05 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `calculus_corner`
--

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `id` int(11) NOT NULL,
  `text` varchar(255) NOT NULL,
  `link` varchar(500) DEFAULT NULL,
  `active` int(11) NOT NULL DEFAULT 1,
  `priority` int(11) NOT NULL DEFAULT 0,
  `start_date` timestamp NULL DEFAULT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `title` varchar(150) NOT NULL DEFAULT 'Notice',
  `display_order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `announcements`
--

INSERT INTO `announcements` (`id`, `text`, `link`, `active`, `priority`, `start_date`, `end_date`, `created_at`, `title`, `display_order`) VALUES
(10, '11 Result has been declared...', 'https://www.fbise.edu.pk/', 1, -8, NULL, NULL, '2026-07-16 15:57:04', '11 Result', 1);

-- --------------------------------------------------------

--
-- Table structure for table `books`
--

CREATE TABLE `books` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `subcategory` varchar(255) DEFAULT NULL,
  `file_url` varchar(255) NOT NULL,
  `thumbnail_url` varchar(255) DEFAULT NULL,
  `uploaderId` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `original_filename` varchar(255) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `books`
--

INSERT INTO `books` (`id`, `title`, `category`, `subcategory`, `file_url`, `thumbnail_url`, `uploaderId`, `created_at`, `original_filename`, `metadata`) VALUES
(1, '11 Math', 'Class 11', 'FBISE', '/uploads/resources/1784216256919-793757806-Sixalps_agency_PROPOSAL__1_.pdf', '/uploads/resources/1784216257012-144717042-SirMehtabPhoto.png', NULL, '2026-07-16 11:32:45', 'Sixalps agency PROPOSAL (1).pdf', '{\"show_on_home\":true}');

-- --------------------------------------------------------

--
-- Table structure for table `certificates`
--

CREATE TABLE `certificates` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'issued',
  `issued_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `courses`
--

CREATE TABLE `courses` (
  `id` int(11) NOT NULL,
  `grade` varchar(50) NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` text NOT NULL,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`features`)),
  `price` varchar(50) NOT NULL,
  `popular` tinyint(4) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `thumbnail` varchar(255) DEFAULT NULL,
  `external_drive_links` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`external_drive_links`)),
  `certificate_price` varchar(50) DEFAULT '0',
  `quiz_required` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `courses`
--

INSERT INTO `courses` (`id`, `grade`, `title`, `description`, `features`, `price`, `popular`, `created_at`, `thumbnail`, `external_drive_links`, `certificate_price`, `quiz_required`) VALUES
(10, 'High School', 'Mastering Limits & Continuity', 'A comprehensive guide to understanding limits, infinity, and the continuity of functions in single-variable calculus.', '[\"10 Video Lectures\",\"5 Practice Quizzes\",\"Certificate of Completion\"]', '49.99', 1, '2026-06-30 11:14:43', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=400&fit=crop', NULL, '9.99', 1),
(11, 'College', 'Advanced Derivatives', 'Dive deep into the rules of differentiation, chain rule, implicit differentiation, and related rates.', '[\"15 Video Lectures\",\"10 Practice Quizzes\",\"Certificate of Completion\"]', '59.99', 1, '2026-06-30 11:14:43', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&h=400&fit=crop', NULL, '14.99', 1),
(12, 'University', 'Integral Calculus Applications', 'Learn how to apply integrals to find areas, volumes, and solve real-world physics problems.', '[\"20 Video Lectures\",\"Final Exam\",\"Certificate of Completion\"]', '79.99', 0, '2026-06-30 11:14:43', 'https://images.unsplash.com/photo-1596496181848-3091d4878b24?w=600&h=400&fit=crop', NULL, '19.99', 1);

-- --------------------------------------------------------

--
-- Table structure for table `course_progress`
--

CREATE TABLE `course_progress` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `progress_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `is_completed` tinyint(1) NOT NULL DEFAULT 0,
  `last_accessed_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `course_quizzes`
--

CREATE TABLE `course_quizzes` (
  `id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `questions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`questions`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `course_quizzes`
--

INSERT INTO `course_quizzes` (`id`, `course_id`, `questions`, `created_at`) VALUES
(4, 10, '[{\"question\":\"2+2\",\"options\":[\"1\",\"2\",\"3\",\"4\"],\"correctAnswer\":\"4\"}]', '2026-07-06 15:24:32'),
(5, 11, '[{\"question\":\"1+4\",\"options\":[\"2\",\"4\",\"5\",\"8\"],\"correctAnswer\":\"5\"},{\"question\":\"1+6\",\"options\":[\"2\",\"7\",\"8\",\"9\"],\"correctAnswer\":\"7\"}]', '2026-07-06 15:24:53'),
(6, 12, '[{\"question\":\"(1+2)-1\",\"options\":[\"1\",\"2\",\"4\",\"8\"],\"correctAnswer\":\"2\"}]', '2026-07-06 15:25:24');

-- --------------------------------------------------------

--
-- Table structure for table `email_logs`
--

CREATE TABLE `email_logs` (
  `id` int(11) NOT NULL,
  `recipient_email` varchar(255) NOT NULL,
  `email_type` varchar(50) NOT NULL,
  `status` varchar(20) NOT NULL,
  `error_message` text DEFAULT NULL,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `email_logs`
--

INSERT INTO `email_logs` (`id`, `recipient_email`, `email_type`, `status`, `error_message`, `sent_at`) VALUES
(1, 'msaadi3806@gmail.com', 'newsletter_announcement', 'sent', NULL, '2026-06-29 18:44:10'),
(2, 'saad.procoder@gmail.com', 'unban_notification', 'sent', NULL, '2026-06-30 05:10:15'),
(3, 'saad.procoder@gmail.com', 'unban_notification', 'sent', NULL, '2026-06-30 05:10:17'),
(4, 'msaadi3806@gmail.com', 'newsletter_announcement', 'sent', NULL, '2026-06-30 06:21:18'),
(5, 'muneebse65@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f74c399a40sm78558656d6.29 - gsmtp', '2026-07-06 15:17:11'),
(6, 'mhasop997@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c41d2cde7sm99054801cf.18 - gsmtp', '2026-07-06 15:17:11'),
(7, 'smpakistan2004@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f4724bab15sm138380966d6.43 - gsmtp', '2026-07-06 15:17:11'),
(8, 'msaadi3806@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c41d2d688sm97061871cf.17 - gsmtp', '2026-07-06 15:17:11'),
(9, 'workvault.7@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c41d2cf18sm100844161cf.14 - gsmtp', '2026-07-06 15:22:59'),
(10, 'mhasop997@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f46e27d555sm138150916d6.7 - gsmtp', '2026-07-06 15:22:59'),
(11, 'msaadi3806@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials af79cd13be357-92e90cc18f1sm948012285a.40 - gsmtp', '2026-07-06 15:22:59'),
(12, 'smpakistan2004@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials af79cd13be357-92e90ce5126sm952082185a.41 - gsmtp', '2026-07-06 15:22:59'),
(13, 'muneebse65@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f46e27d137sm139759616d6.9 - gsmtp', '2026-07-06 15:22:59'),
(14, 'snpakistan80@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials af79cd13be357-92e90ba754fsm971342385a.18 - gsmtp', '2026-07-06 15:22:59'),
(15, 'nadeem@iiu.edu.pk', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c50a937f1sm67580011cf.10 - gsmtp', '2026-07-06 15:22:59'),
(16, 'msaadi3806@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c41b281c9sm94112581cf.9 - gsmtp', '2026-07-06 15:39:54'),
(17, 'mhasop997@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials af79cd13be357-92e90ba754fsm975151185a.18 - gsmtp', '2026-07-06 15:39:54'),
(18, 'snpakistan80@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials af79cd13be357-92e90cce037sm937963685a.38 - gsmtp', '2026-07-06 15:39:54'),
(19, 'workvault.7@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c41decc5csm92784661cf.26 - gsmtp', '2026-07-06 15:39:54'),
(20, 'nadeem@iiu.edu.pk', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c41da510dsm90760631cf.22 - gsmtp', '2026-07-06 15:39:54'),
(21, 'smpakistan2004@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials af79cd13be357-92e90b80785sm958652885a.3 - gsmtp', '2026-07-06 15:39:54'),
(22, 'muneebse65@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f46e371bdfsm137442026d6.1 - gsmtp', '2026-07-06 15:39:54'),
(23, 'mhasop997@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8fca1c1356esm20923756d6.37 - gsmtp', '2026-07-07 07:20:16'),
(24, 'workvault.7@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c41b19a66sm105359181cf.7 - gsmtp', '2026-07-07 07:20:16'),
(25, 'muneebse65@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f46f304533sm153478876d6.18 - gsmtp', '2026-07-07 07:20:16'),
(26, 'nadeem@iiu.edu.pk', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f46e27d53fsm155004056d6.5 - gsmtp', '2026-07-07 07:20:16'),
(27, 'smpakistan2004@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials af79cd13be357-92e90cc18f1sm1099622385a.40 - gsmtp', '2026-07-07 07:20:16'),
(28, 'snpakistan80@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f4724bab9esm151265306d6.42 - gsmtp', '2026-07-07 07:20:16'),
(29, 'msaadi3806@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials af79cd13be357-92e90c923c4sm1140200185a.24 - gsmtp', '2026-07-07 07:20:16'),
(30, 'snpakistan80@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f471814408sm153320716d6.23 - gsmtp', '2026-07-07 07:20:37'),
(31, 'muneebse65@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f471815818sm155985486d6.31 - gsmtp', '2026-07-07 07:20:37'),
(32, 'nadeem@iiu.edu.pk', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f4724bab15sm154275216d6.43 - gsmtp', '2026-07-07 07:20:37'),
(33, 'smpakistan2004@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f46e27d526sm163497346d6.4 - gsmtp', '2026-07-07 07:20:37'),
(34, 'workvault.7@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials af79cd13be357-92e90bb8629sm1115231585a.19 - gsmtp', '2026-07-07 07:20:37'),
(35, 'msaadi3806@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f471815818sm155985476d6.31 - gsmtp', '2026-07-07 07:20:37'),
(36, 'mhasop997@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials af79cd13be357-92e90ccde4fsm1115658585a.39 - gsmtp', '2026-07-07 07:20:37'),
(37, 'snpakistan80@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c4190e9e0sm133160711cf.0 - gsmtp', '2026-07-08 12:29:47'),
(38, 'nadeem@iiu.edu.pk', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c41b19a66sm132197871cf.7 - gsmtp', '2026-07-08 12:29:48'),
(39, 'smpakistan2004@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c41db2c61sm139315921cf.24 - gsmtp', '2026-07-08 12:29:48'),
(40, 'hellomelo@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials af79cd13be357-92e90cc18f1sm1380248685a.40 - gsmtp', '2026-07-08 12:29:48'),
(41, 'msaadi3806@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c41ab77dcsm134673781cf.2 - gsmtp', '2026-07-08 12:29:48'),
(42, 'mhasop997@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f472a9ad1fsm181414176d6.47 - gsmtp', '2026-07-08 12:29:48'),
(43, 'muneebse65@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c41f1ee58sm131002321cf.29 - gsmtp', '2026-07-08 12:29:48'),
(44, 'workvault.7@gmail.com', 'newsletter_announcement', 'failed', 'Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c4190e9e0sm133160701cf.0 - gsmtp', '2026-07-08 12:29:48'),
(45, 'msaadi3806@gmail.com', 'otp_verification', 'sent', NULL, '2026-07-13 00:40:23'),
(46, 'msaadi3806@gmail.com', 'otp_verification', 'sent', NULL, '2026-07-13 00:41:44'),
(47, 'msaadi8306@gmail.com', 'otp_verification', 'sent', NULL, '2026-07-13 00:44:48'),
(48, 'msaadi3806@gmail.com', 'otp_verification', 'sent', NULL, '2026-07-13 03:20:05'),
(49, 'saad.procoder@gmail.com', 'otp_verification', 'sent', NULL, '2026-07-15 04:08:53'),
(50, 'saad.procoder@gmail.com', 'otp_verification', 'sent', NULL, '2026-07-15 04:09:38'),
(51, 'sixalps.agency@gmail.com', 'otp_verification', 'sent', NULL, '2026-07-16 12:03:42'),
(52, 'msaadi3806@gmail.com', 'otp_verification', 'sent', NULL, '2026-07-16 12:04:45'),
(53, 'msaadi3806@gmail.com', 'newsletter_announcement', 'sent', NULL, '2026-07-16 15:54:19'),
(54, 'muneebse65@gmail.com', 'newsletter_announcement', 'sent', NULL, '2026-07-16 15:54:20'),
(55, 'hellomelo@gmail.com', 'newsletter_announcement', 'sent', NULL, '2026-07-16 15:54:20'),
(56, 'smpakistan2004@gmail.com', 'newsletter_announcement', 'sent', NULL, '2026-07-16 15:54:21'),
(57, 'workvault.7@gmail.com', 'newsletter_announcement', 'sent', NULL, '2026-07-16 15:54:21'),
(58, 'mhasop997@gmail.com', 'newsletter_announcement', 'sent', NULL, '2026-07-16 15:54:22'),
(59, 'snpakistan80@gmail.com', 'newsletter_announcement', 'sent', NULL, '2026-07-16 15:54:22'),
(60, 'nadeem@iiu.edu.pk', 'newsletter_announcement', 'sent', NULL, '2026-07-16 15:54:23'),
(61, 'snpakistan80@gmail.com', 'newsletter_announcement', 'sent', NULL, '2026-07-16 15:57:10'),
(62, 'smpakistan2004@gmail.com', 'newsletter_announcement', 'sent', NULL, '2026-07-16 15:57:10'),
(63, 'hellomelo@gmail.com', 'newsletter_announcement', 'sent', NULL, '2026-07-16 15:57:11'),
(64, 'mhasop997@gmail.com', 'newsletter_announcement', 'sent', NULL, '2026-07-16 15:57:11'),
(65, 'nadeem@iiu.edu.pk', 'newsletter_announcement', 'sent', NULL, '2026-07-16 15:57:12'),
(66, 'muneebse65@gmail.com', 'newsletter_announcement', 'sent', NULL, '2026-07-16 15:57:12'),
(67, 'workvault.7@gmail.com', 'newsletter_announcement', 'sent', NULL, '2026-07-16 15:57:13'),
(68, 'msaadi3806@gmail.com', 'newsletter_announcement', 'sent', NULL, '2026-07-16 15:57:14');

-- --------------------------------------------------------

--
-- Table structure for table `enrollments`
--

CREATE TABLE `enrollments` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `certificate_status` varchar(20) NOT NULL DEFAULT 'none'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `enrollments`
--

INSERT INTO `enrollments` (`id`, `student_id`, `course_id`, `created_at`, `status`, `certificate_status`) VALUES
(1, 1, 1, '2026-06-29 18:34:00', 'approved', 'issued'),
(2, 2, 1, '2026-06-30 04:17:13', 'approved', 'issued'),
(3, 3, 2, '2026-06-30 06:22:14', 'approved', 'issued'),
(4, 5, 10, '2026-07-06 15:27:26', 'approved', 'rejected'),
(5, 5, 11, '2026-07-06 15:31:05', 'approved', 'issued'),
(6, 8, 10, '2026-07-07 07:25:24', 'approved', 'issued');

-- --------------------------------------------------------

--
-- Table structure for table `newsletter_subscribers`
--

CREATE TABLE `newsletter_subscribers` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `subscribed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `unsubscribe_token` varchar(255) DEFAULT NULL,
  `last_email_sent` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `newsletter_subscribers`
--

INSERT INTO `newsletter_subscribers` (`id`, `email`, `subscribed_at`, `is_active`, `status`, `unsubscribe_token`, `last_email_sent`, `created_at`, `updated_at`) VALUES
(2, 'msaadi3806@gmail.com', '2026-06-30 11:14:44', 1, 'active', NULL, '2026-07-16 15:57:14', '2026-06-30 11:14:44', '2026-07-16 15:57:14'),
(3, 'muneebse65@gmail.com', '2026-06-30 11:14:44', 1, 'active', NULL, '2026-07-16 15:57:12', '2026-06-30 11:14:44', '2026-07-16 15:57:12'),
(4, 'smpakistan2004@gmail.com', '2026-06-30 11:14:44', 1, 'active', NULL, '2026-07-16 15:57:10', '2026-06-30 11:14:44', '2026-07-16 15:57:10'),
(5, 'mhasop997@gmail.com', '2026-06-30 11:14:44', 1, 'active', NULL, '2026-07-16 15:57:11', '2026-06-30 11:14:44', '2026-07-16 15:57:11'),
(6, 'workvault.7@gmail.com', '2026-07-06 15:18:54', 1, 'active', '984da90016b3bac6b52dc74a8410efe8f725c8b59f7a4e258d49426703423097', '2026-07-16 15:57:13', '2026-07-06 15:18:54', '2026-07-16 15:57:13'),
(7, 'nadeem@iiu.edu.pk', '2026-07-06 15:20:32', 1, 'active', 'fa4f99ac3f6f6c6f1f0347aa9c9f7e81589c8a3d9e8bb6f770710d4620135bb9', '2026-07-16 15:57:12', '2026-07-06 15:20:32', '2026-07-16 15:57:12'),
(8, 'snpakistan80@gmail.com', '2026-07-06 15:22:09', 1, 'active', '66bbe442cc3bfe7ed3cec9c43f9b459bf015a678ff4320671b4440e1967288f2', '2026-07-16 15:57:10', '2026-07-06 15:22:09', '2026-07-16 15:57:10'),
(9, 'hellomelo@gmail.com', '2026-07-07 13:42:01', 1, 'active', '3513f931c5305d0476558b89965176e052e12968131f5e4503a6f7e954ef9556', '2026-07-16 15:57:11', '2026-07-07 13:42:01', '2026-07-16 15:57:11');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `text` text NOT NULL,
  `type` varchar(50) NOT NULL,
  `is_read` tinyint(4) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `role` varchar(20) NOT NULL DEFAULT 'student'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `text`, `type`, `is_read`, `created_at`, `role`) VALUES
(63, 7, 'New Achievement Unlocked!', 'Congratulations! You earned the \"First Attempt\" badge: Awarded after completing your first quiz attempt!', 'badge', 1, '2026-07-06 18:08:08', 'student'),
(100, NULL, 'New Update: 11 Result', '11 class reult has been declared and updated on fbise official website.You can check it out!', 'update', 0, '2026-07-16 15:54:13', 'student'),
(101, NULL, 'New Announcement Published', '11 Result has been declared...', 'announcement', 0, '2026-07-16 15:57:04', 'student');

-- --------------------------------------------------------

--
-- Table structure for table `question_pool`
--

CREATE TABLE `question_pool` (
  `id` varchar(50) NOT NULL,
  `topic` varchar(100) NOT NULL,
  `question` text NOT NULL,
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`options`)),
  `correctAnswer` varchar(255) NOT NULL,
  `difficulty` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `question_pool`
--

INSERT INTO `question_pool` (`id`, `topic`, `question`, `options`, `correctAnswer`, `difficulty`, `created_at`) VALUES
('q_1_1782818083884', 'Derivatives', 'What is the derivative of f(x) = 1x^3 + 2x?', '[\"3x^2 + 2\",\"1x^2 + 2\",\"3x^2\",\"2\"]', '3x^2 + 2', 'Medium', '2026-06-30 11:14:43'),
('q_10_1782818083884', 'Derivatives', 'What is the derivative of f(x) = 10x^3 + 20x?', '[\"30x^2 + 20\",\"10x^2 + 20\",\"30x^2\",\"20\"]', '30x^2 + 20', 'Medium', '2026-06-30 11:14:43'),
('q_11_1782818083884', 'Integrals', 'Evaluate the integral of f(x) = 11x dx', '[\"5.5x^2 + C\",\"11x^2 + C\",\"22x + C\",\"11x + C\"]', '5.5x^2 + C', 'Hard', '2026-06-30 11:14:43'),
('q_12_1782818083884', 'Limits', 'Evaluate the limit: lim (x -> 12) of (x^2 - 144) / (x - 12)', '[\"12\",\"24\",\"144\",\"Undefined\"]', '24', 'Easy', '2026-06-30 11:14:43'),
('q_13_1782818083884', 'Derivatives', 'What is the derivative of f(x) = 13x^3 + 26x?', '[\"39x^2 + 26\",\"13x^2 + 26\",\"39x^2\",\"26\"]', '39x^2 + 26', 'Medium', '2026-06-30 11:14:43'),
('q_14_1782818083884', 'Integrals', 'Evaluate the integral of f(x) = 14x dx', '[\"7x^2 + C\",\"14x^2 + C\",\"28x + C\",\"14x + C\"]', '7x^2 + C', 'Hard', '2026-06-30 11:14:43'),
('q_15_1782818083884', 'Limits', 'Evaluate the limit: lim (x -> 15) of (x^2 - 225) / (x - 15)', '[\"15\",\"30\",\"225\",\"Undefined\"]', '30', 'Easy', '2026-06-30 11:14:43'),
('q_16_1782818083884', 'Derivatives', 'What is the derivative of f(x) = 16x^3 + 32x?', '[\"48x^2 + 32\",\"16x^2 + 32\",\"48x^2\",\"32\"]', '48x^2 + 32', 'Medium', '2026-06-30 11:14:43'),
('q_17_1782818083884', 'Integrals', 'Evaluate the integral of f(x) = 17x dx', '[\"8.5x^2 + C\",\"17x^2 + C\",\"34x + C\",\"17x + C\"]', '8.5x^2 + C', 'Hard', '2026-06-30 11:14:43'),
('q_1783482981303_wbp54si2i', 'Addition', '2+2', '[\"1\",\"2\",\"3\",\"4\"]', '4', 'medium', '2026-07-08 03:56:21'),
('q_18_1782818083884', 'Limits', 'Evaluate the limit: lim (x -> 18) of (x^2 - 324) / (x - 18)', '[\"18\",\"36\",\"324\",\"Undefined\"]', '36', 'Easy', '2026-06-30 11:14:43'),
('q_19_1782818083884', 'Derivatives', 'What is the derivative of f(x) = 19x^3 + 38x?', '[\"57x^2 + 38\",\"19x^2 + 38\",\"57x^2\",\"38\"]', '57x^2 + 38', 'Medium', '2026-06-30 11:14:43'),
('q_2_1782818083884', 'Integrals', 'Evaluate the integral of f(x) = 2x dx', '[\"1x^2 + C\",\"2x^2 + C\",\"4x + C\",\"2x + C\"]', '1x^2 + C', 'Hard', '2026-06-30 11:14:43'),
('q_20_1782818083884', 'Integrals', 'Evaluate the integral of f(x) = 20x dx', '[\"10x^2 + C\",\"20x^2 + C\",\"40x + C\",\"20x + C\"]', '10x^2 + C', 'Hard', '2026-06-30 11:14:43'),
('q_21_1782818083884', 'Limits', 'Evaluate the limit: lim (x -> 21) of (x^2 - 441) / (x - 21)', '[\"21\",\"42\",\"441\",\"Undefined\"]', '42', 'Easy', '2026-06-30 11:14:43'),
('q_22_1782818083884', 'Derivatives', 'What is the derivative of f(x) = 22x^3 + 44x?', '[\"66x^2 + 44\",\"22x^2 + 44\",\"66x^2\",\"44\"]', '66x^2 + 44', 'Medium', '2026-06-30 11:14:44'),
('q_23_1782818083884', 'Integrals', 'Evaluate the integral of f(x) = 23x dx', '[\"11.5x^2 + C\",\"23x^2 + C\",\"46x + C\",\"23x + C\"]', '11.5x^2 + C', 'Hard', '2026-06-30 11:14:44'),
('q_24_1782818083884', 'Limits', 'Evaluate the limit: lim (x -> 24) of (x^2 - 576) / (x - 24)', '[\"24\",\"48\",\"576\",\"Undefined\"]', '48', 'Easy', '2026-06-30 11:14:44'),
('q_25_1782818083884', 'Derivatives', 'What is the derivative of f(x) = 25x^3 + 50x?', '[\"75x^2 + 50\",\"25x^2 + 50\",\"75x^2\",\"50\"]', '75x^2 + 50', 'Medium', '2026-06-30 11:14:44'),
('q_26_1782818083884', 'Integrals', 'Evaluate the integral of f(x) = 26x dx', '[\"13x^2 + C\",\"26x^2 + C\",\"52x + C\",\"26x + C\"]', '13x^2 + C', 'Hard', '2026-06-30 11:14:44'),
('q_27_1782818083884', 'Limits', 'Evaluate the limit: lim (x -> 27) of (x^2 - 729) / (x - 27)', '[\"27\",\"54\",\"729\",\"Undefined\"]', '54', 'Easy', '2026-06-30 11:14:44'),
('q_28_1782818083884', 'Derivatives', 'What is the derivative of f(x) = 28x^3 + 56x?', '[\"84x^2 + 56\",\"28x^2 + 56\",\"84x^2\",\"56\"]', '84x^2 + 56', 'Medium', '2026-06-30 11:14:44'),
('q_29_1782818083884', 'Integrals', 'Evaluate the integral of f(x) = 29x dx', '[\"14.5x^2 + C\",\"29x^2 + C\",\"58x + C\",\"29x + C\"]', '14.5x^2 + C', 'Hard', '2026-06-30 11:14:44'),
('q_3_1782818083884', 'Limits', 'Evaluate the limit: lim (x -> 3) of (x^2 - 9) / (x - 3)', '[\"3\",\"6\",\"9\",\"Undefined\"]', '6', 'Easy', '2026-06-30 11:14:43'),
('q_30_1782818083884', 'Limits', 'Evaluate the limit: lim (x -> 30) of (x^2 - 900) / (x - 30)', '[\"30\",\"60\",\"900\",\"Undefined\"]', '60', 'Easy', '2026-06-30 11:14:44'),
('q_4_1782818083884', 'Derivatives', 'What is the derivative of f(x) = 4x^3 + 8x?', '[\"12x^2 + 8\",\"4x^2 + 8\",\"12x^2\",\"8\"]', '12x^2 + 8', 'Medium', '2026-06-30 11:14:43'),
('q_5_1782818083884', 'Integrals', 'Evaluate the integral of f(x) = 5x dx', '[\"2.5x^2 + C\",\"5x^2 + C\",\"10x + C\",\"5x + C\"]', '2.5x^2 + C', 'Hard', '2026-06-30 11:14:43'),
('q_6_1782818083884', 'Limits', 'Evaluate the limit: lim (x -> 6) of (x^2 - 36) / (x - 6)', '[\"6\",\"12\",\"36\",\"Undefined\"]', '12', 'Easy', '2026-06-30 11:14:43'),
('q_7_1782818083884', 'Derivatives', 'What is the derivative of f(x) = 7x^3 + 14x?', '[\"21x^2 + 14\",\"7x^2 + 14\",\"21x^2\",\"14\"]', '21x^2 + 14', 'Medium', '2026-06-30 11:14:43'),
('q_8_1782818083884', 'Integrals', 'Evaluate the integral of f(x) = 8x dx', '[\"4x^2 + C\",\"8x^2 + C\",\"16x + C\",\"8x + C\"]', '4x^2 + C', 'Hard', '2026-06-30 11:14:43'),
('q_9_1782818083884', 'Limits', 'Evaluate the limit: lim (x -> 9) of (x^2 - 81) / (x - 9)', '[\"9\",\"18\",\"81\",\"Undefined\"]', '18', 'Easy', '2026-06-30 11:14:43');

-- --------------------------------------------------------

--
-- Table structure for table `quiz_attempts`
--

CREATE TABLE `quiz_attempts` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `score` int(11) NOT NULL,
  `totalQuestions` int(11) NOT NULL,
  `percentage` decimal(5,2) NOT NULL,
  `answers` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`answers`)),
  `timeTaken` int(11) NOT NULL,
  `quizType` varchar(50) NOT NULL,
  `topic` varchar(100) DEFAULT NULL,
  `completedAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `quiz_attempts`
--

INSERT INTO `quiz_attempts` (`id`, `userId`, `score`, `totalQuestions`, `percentage`, `answers`, `timeTaken`, `quizType`, `topic`, `completedAt`) VALUES
(14, 7, 5, 10, 50.00, '[{\"questionId\":\"q_22_1782818083884\",\"selectedAnswer\":\"44\",\"correctAnswer\":\"66x^2 + 44\",\"isCorrect\":false},{\"questionId\":\"q_25_1782818083884\",\"selectedAnswer\":\"50\",\"correctAnswer\":\"75x^2 + 50\",\"isCorrect\":false},{\"questionId\":\"q_1_1782818083884\",\"selectedAnswer\":\"3x^2 + 2\",\"correctAnswer\":\"3x^2 + 2\",\"isCorrect\":true},{\"questionId\":\"q_10_1782818083884\",\"selectedAnswer\":\"30x^2 + 20\",\"correctAnswer\":\"30x^2 + 20\",\"isCorrect\":true},{\"questionId\":\"q_4_1782818083884\",\"selectedAnswer\":\"8\",\"correctAnswer\":\"12x^2 + 8\",\"isCorrect\":false},{\"questionId\":\"q_16_1782818083884\",\"selectedAnswer\":\"16x^2 + 32\",\"correctAnswer\":\"48x^2 + 32\",\"isCorrect\":false},{\"questionId\":\"q_13_1782818083884\",\"selectedAnswer\":\"13x^2 + 26\",\"correctAnswer\":\"39x^2 + 26\",\"isCorrect\":false},{\"questionId\":\"q_28_1782818083884\",\"selectedAnswer\":\"84x^2 + 56\",\"correctAnswer\":\"84x^2 + 56\",\"isCorrect\":true},{\"questionId\":\"q_19_1782818083884\",\"selectedAnswer\":\"57x^2 + 38\",\"correctAnswer\":\"57x^2 + 38\",\"isCorrect\":true},{\"questionId\":\"q_7_1782818083884\",\"selectedAnswer\":\"21x^2 + 14\",\"correctAnswer\":\"21x^2 + 14\",\"isCorrect\":true}]', 26, 'timed', 'Derivatives', '2026-07-06 18:08:08');

-- --------------------------------------------------------

--
-- Table structure for table `resources`
--

CREATE TABLE `resources` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `file_url` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `original_filename` varchar(255) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `category` varchar(100) DEFAULT NULL,
  `thumbnail_url` varchar(255) DEFAULT NULL,
  `subcategory` varchar(255) DEFAULT NULL,
  `is_past_paper` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `resources`
--

INSERT INTO `resources` (`id`, `title`, `file_url`, `created_at`, `original_filename`, `metadata`, `category`, `thumbnail_url`, `subcategory`, `is_past_paper`) VALUES
(12, '11 chart', '/uploads/resources/1784216336435-488527169-Sixalps_agency_PROPOSAL.pdf', '2026-07-16 07:56:31', 'Sixalps agency PROPOSAL.pdf', '{\"size_bytes\":3558685,\"extension\":\"pdf\",\"mime_type\":\"application/pdf\"}', 'Class 11', '/uploads/resources/1784216336590-120767468-cbdfbb51-0f36-4b14-bd1f-28791c22a8f5.png', 'BISE Rawalpindi', 0),
(13, '12 notes', '/uploads/resources/1784216295981-28254737-Sixalps_agency_PROPOSAL__1_.pdf', '2026-07-16 12:40:47', 'Sixalps agency PROPOSAL (1).pdf', '{\"size_bytes\":3558685,\"extension\":\"pdf\",\"mime_type\":\"application/pdf\"}', 'Class 12', '/uploads/resources/1784216296059-569800222-SirMehtab.png', 'BISE Lahore', 1);

-- --------------------------------------------------------

--
-- Table structure for table `site_content`
--

CREATE TABLE `site_content` (
  `section_name` varchar(50) NOT NULL,
  `content_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`content_data`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `site_content`
--

INSERT INTO `site_content` (`section_name`, `content_data`) VALUES
('about', '{\"badge\":\"About Us\",\"heading\":\"Transforming Math Anxiety into Mastery\",\"heading_gradient\":\"Mathematical Mastery\",\"paragraph1\":\"Calculus Corner is more than just a tutoring platform. We are a dedicated educational hub designed to make complex mathematical concepts intuitive, engaging, and accessible to everyone. Our mission is to build foundational strength that lasts a lifetime.\",\"paragraph2\":\"\",\"image_url\":\"/uploads/images/1783505153682-959636645.png\"}'),
('announcements', '[{\"id\":1,\"text\":\"🎉 New Course on Multivariable Calculus dropping next week! Early bird discount available.\",\"isActive\":true},{\"id\":2,\"text\":\"📢 Scheduled Maintenance: The site will be down for 2 hours on Sunday at 2 AM EST.\",\"isActive\":true},{\"id\":3,\"text\":\"💡 Tip of the week: Always double check your constants of integration (+C)!\",\"isActive\":true}]'),
('bank_details', '{\"account_name\": \"Calculus Corner Admin\", \"account_number\": \"1234-5678-9012\", \"bank_name\": \"Standard Chartered\"}'),
('certificate', '{\"price\":\"500\"}'),
('contact', '{\"email\":\"Thecalculuscornerofficial@gmail.com\",\"phone\":\"+92 302 8983263\",\"address\":\"Islamabad, Pakistan\",\"facebook_url\":\"#\",\"twitter_url\":\"#\",\"instagram_url\":\"#\",\"youtube_url\":\"#\",\"whatsapp_number\":\"\"}'),
('logo', '{\"logo_url\":\"/uploads/logo/logo-1784217193014-634521451.png\"}'),
('visibility', '{\"courses\":false,\"practice\":true,\"lectures\":true,\"notes\":true,\"books\":true,\"about\":true,\"contact\":true,\"success_stories\":true,\"updates\":true,\"past_papers\":true,\"subjects\":true}');

-- --------------------------------------------------------

--
-- Table structure for table `students_profile`
--

CREATE TABLE `students_profile` (
  `user_id` int(11) NOT NULL,
  `bio` text DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `progress` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`progress`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students_profile`
--

INSERT INTO `students_profile` (`user_id`, `bio`, `avatar`, `progress`) VALUES
(6, NULL, NULL, '{}'),
(7, NULL, NULL, '{}'),
(9, NULL, NULL, '{}');

-- --------------------------------------------------------

--
-- Table structure for table `subjects`
--

CREATE TABLE `subjects` (
  `id` int(11) NOT NULL,
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
  `topicsCovered` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`topicsCovered`)),
  `whoItIsFor` text NOT NULL,
  `howWeHelp` text NOT NULL,
  `learningOutcomes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`learningOutcomes`)),
  `examPrepTips` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`examPrepTips`)),
  `sidebarDifficulty` varchar(50) DEFAULT 'Medium',
  `sidebarFocus` varchar(150) DEFAULT NULL,
  `sidebarRecommendedGrade` varchar(100) DEFAULT NULL,
  `sidebarStudyTime` varchar(100) DEFAULT NULL,
  `relatedVideosCategory` varchar(100) DEFAULT NULL,
  `relatedSubjects` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`relatedSubjects`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `subjects`
--

INSERT INTO `subjects` (`id`, `slug`, `title`, `subtitle`, `badge`, `icon`, `bgColor`, `seoTitle`, `seoDescription`, `overview`, `whyItMatters`, `topicsCovered`, `whoItIsFor`, `howWeHelp`, `learningOutcomes`, `examPrepTips`, `sidebarDifficulty`, `sidebarFocus`, `sidebarRecommendedGrade`, `sidebarStudyTime`, `relatedVideosCategory`, `relatedSubjects`, `created_at`) VALUES
(1, 'trigonometry', 'Trigonometry', 'Go from basic angle ratios all the way to complex trig functions, with clear examples at every step.', 'Core Foundation', 'TriangleRight', 'bg-pink-50 text-pink-600', 'Trigonometry Mastery | Calculus Corner', 'Master trigonometry with our comprehensive guide covering everything from basic ratios to complex identities.', 'Trigonometry is the branch of mathematics that studies relationships involving lengths and angles of triangles. It is essential for understanding waves, oscillations, and geometry in multidimensional spaces.', 'Trigonometry is the foundation for advanced calculus, physics, and engineering. Without it, modeling periodic phenomena like sound waves, light, or alternating current would be impossible.', '[\"Right-Angled Triangles (SOH CAH TOA)\",\"The Unit Circle and Radian Measure\",\"Graphing Sine, Cosine, and Tangent\",\"Trigonometric Identities and Proofs\",\"Law of Sines and Law of Cosines\",\"Inverse Trigonometric Functions\"]', 'High school students in grades 10-12 preparing for pre-calculus, AP Physics, or college-level engineering courses.', 'We break down complex identities into easy-to-understand, step-by-step proofs and provide interactive practice problems to help you memorize the unit circle effortlessly', '[\"Fluently convert between degrees and radians.\",\"Solve missing sides and angles in any triangle.\",\"Prove complex trigonometric identities.\",\"Graph and transform trigonometric functions accurately.\"]', '[\"Memorize the exact values of sine, cosine, and tangent for key angles (30, 45, 60).\",\"Always check if your calculator is in Degree or Radian mode before an exam.\",\"When proving identities, try converting everything to sine and cosine first.\"]', 'Medium', 'Angles and Periodic Functions', 'Grade 10-11', '4-5 hours / week', 'trigonometry', '[\"algebra\",\"geometry\",\"calculus\"]', '2026-06-30 03:26:35'),
(2, 'algebra', 'Algebra', 'Build a solid base in equations, inequalities, and functions — the foundation everything else is built on.', 'Core Subject', 'FunctionSquare', 'bg-blue-50 text-blue-600', 'Algebra Mastery | Calculus Corner', 'Learn everything about Algebra from simple equations to complex polynomials.', 'Algebra is the gateway to advanced mathematics. It introduces the concept of using letters to represent unknown numbers.', 'It develops logical thinking and problem-solving skills necessary for science, engineering, and everyday life.', '[\"Linear Equations\",\"Quadratic Functions\",\"Polynomials\",\"Exponentials and Logarithms\"]', 'Students beginning their high school math journey.', 'We provide clear, step-by-step solutions to complex algebraic equations.', '[\"Solve equations with multiple variables.\",\"Graph linear and quadratic functions.\",\"Factor complex polynomials.\"]', '[\"Always double check your negative signs.\",\"Memorize the quadratic formula.\"]', 'Medium', 'Equations & Graphs', 'Grade 9-10', '3-4 hours / week', 'algebra', '[\"trigonometry\",\"calculus\"]', '2026-06-30 03:28:50'),
(3, 'calculus', 'Calculus', 'Get comfortable with limits, derivatives, and integrals through lessons that make the concepts click.', 'Advanced Level', 'InfinityIcon', 'bg-amber-50 text-amber-600', 'Calculus Mastery | Calculus Corner', 'Master the principles of continuous change, limits, derivatives, and integrals.', 'Calculus is the mathematical study of continuous change. It has two major branches: differential calculus and integral calculus.', 'Calculus is essential for physics, engineering, economics, and computer science.', '[\"Limits and Continuity\",\"Derivatives\",\"Applications of Derivatives\",\"Integrals\",\"Applications of Integration\"]', 'Advanced high school students and college freshmen.', 'We use interactive animations and detailed step-by-step proofs to demystify complex calculus concepts.', '[\"Evaluate complex limits.\",\"Differentiate and integrate transcendental functions.\",\"Apply calculus to real-world physics problems.\"]', '[\"Practice the chain rule until it becomes second nature.\",\"Draw pictures for related rates and optimization problems.\"]', 'Hard', 'Rates of Change', 'Grade 11-12', '5-7 hours / week', 'calculus', '[\"algebra\",\"trigonometry\"]', '2026-06-30 03:28:50');

-- --------------------------------------------------------

--
-- Table structure for table `support_messages`
--

CREATE TABLE `support_messages` (
  `id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `sender_role` varchar(20) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `support_messages`
--

INSERT INTO `support_messages` (`id`, `student_id`, `sender_role`, `message`, `created_at`) VALUES
(9, 6, 'student', 'Hi.', '2026-07-06 18:08:06');

-- --------------------------------------------------------

--
-- Table structure for table `testimonials`
--

CREATE TABLE `testimonials` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `role` varchar(150) NOT NULL,
  `text` text NOT NULL,
  `rating` int(11) NOT NULL DEFAULT 5,
  `student_id` int(11) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'approved'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `testimonials`
--

INSERT INTO `testimonials` (`id`, `name`, `role`, `text`, `rating`, `student_id`, `status`) VALUES
(5, 'Sarah Jenkins', 'AP Calculus Student', 'This platform completely changed how I look at math. The visual explanations of derivatives made everything click for me! I finally scored an A on my exam.', 5, NULL, 'approved'),
(6, 'David Chen', 'Engineering Freshman', 'The resources and practice quizzes are top-notch. The integration techniques module saved my grade in University Calc II.', 5, NULL, 'approved'),
(7, 'Emily Davis', 'High School Junior', 'I loved the video lectures! They are concise and right to the point. The UI is also super clean and easy to navigate.', 4, NULL, 'approved');

-- --------------------------------------------------------

--
-- Table structure for table `unban_requests`
--

CREATE TABLE `unban_requests` (
  `id` int(11) NOT NULL,
  `message` text NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'Pending',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `reviewedAt` timestamp NULL DEFAULT NULL,
  `reviewedBy` int(11) DEFAULT NULL,
  `student_id` int(11) NOT NULL DEFAULT 0,
  `reason` varchar(100) NOT NULL DEFAULT 'other',
  `additional_explanation` text DEFAULT NULL,
  `admin_response` text DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `updates`
--

CREATE TABLE `updates` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `category` varchar(50) DEFAULT 'General',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `link` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `updates`
--

INSERT INTO `updates` (`id`, `title`, `content`, `category`, `created_at`, `link`) VALUES
(1, '11 Result', '11 class reult has been declared and updated on fbise official website.You can check it out!', 'Result Announcement', '2026-07-16 15:54:13', 'https://www.fbise.edu.pk/');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'student',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `isBanned` tinyint(4) NOT NULL DEFAULT 0,
  `banReason` text DEFAULT NULL,
  `bannedAt` timestamp NULL DEFAULT NULL,
  `bannedBy` int(11) DEFAULT NULL,
  `restore_notified` tinyint(4) NOT NULL DEFAULT 0,
  `is_verified` tinyint(4) NOT NULL DEFAULT 0,
  `verification_otp` varchar(10) DEFAULT NULL,
  `otp_expiry` timestamp NULL DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`, `status`, `isBanned`, `banReason`, `bannedAt`, `bannedBy`, `restore_notified`, `is_verified`, `verification_otp`, `otp_expiry`, `last_login`) VALUES
(6, 'Emily Torus', 'sibylpeach@tohru.org', '$2b$10$YfhgugGYRMroOd0Lw5ex/O4UoxXtF4IpHrlSsZkyD0LB2xCWikJdu', 'student', '2026-07-06 18:06:00', 'active', 0, NULL, NULL, NULL, 0, 1, NULL, NULL, NULL),
(7, 'Faisal Iqbal', 'faisaliqbal.numl@gmail.com', '$2b$10$jkQTlxEuTmNzyrCLLJQ9F.9RtLCk1iM.S8rv/7jo2obekm6z/KPf2', 'student', '2026-07-06 18:08:05', 'active', 0, NULL, NULL, NULL, 0, 1, NULL, NULL, NULL),
(9, 'servercheck', 'jabhi5388@gmail.com', '$2b$10$N9G3fBVefkTyn52869ZSB.QP.FFTG07mPp3PFCT1G4NL5PAFPv.V2', 'student', '2026-07-07 10:45:20', 'active', 0, NULL, NULL, NULL, 0, 1, NULL, NULL, NULL),
(13, 'System Admin', 'Thecalculuscornerofficial@gmail.com', '$2b$10$SD7y86WvB6kuV1duequtNuHYY6c2kNfdmysFdYJw7K1RW3eugFAxi', 'admin', '2026-07-13 00:34:14', 'active', 0, NULL, NULL, NULL, 0, 1, NULL, NULL, '2026-07-16 11:28:50');

-- --------------------------------------------------------

--
-- Table structure for table `user_badges`
--

CREATE TABLE `user_badges` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `badgeName` varchar(100) NOT NULL,
  `earnedAt` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_badges`
--

INSERT INTO `user_badges` (`id`, `userId`, `badgeName`, `earnedAt`) VALUES
(2, 7, 'First Attempt', '2026-07-06 18:08:08');

-- --------------------------------------------------------

--
-- Table structure for table `videos`
--

CREATE TABLE `videos` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `url` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `video_id` varchar(50) NOT NULL,
  `thumbnail` varchar(255) DEFAULT NULL,
  `category` varchar(50) NOT NULL DEFAULT 'Calculus',
  `subcategory` varchar(255) DEFAULT NULL,
  `is_past_paper` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `videos`
--

INSERT INTO `videos` (`id`, `title`, `url`, `created_at`, `video_id`, `thumbnail`, `category`, `subcategory`, `is_past_paper`) VALUES
(9, 'Ex 2.3 class 12 Math New Book 2026 Unit 2 complete solution | Ex 2.3 Class 12 | Punjab Board | PTCB', 'https://www.youtube.com/watch?v=TLA7iTqcL0Y', '2026-07-16 08:15:08', 'TLA7iTqcL0Y', 'https://img.youtube.com/vi/TLA7iTqcL0Y/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(10, 'Ex 2.2 class 12 Math New Book 2026 Unit 2 complete solution | Ex 2.2 Class 12 | Punjab Board | PTCB', 'https://www.youtube.com/watch?v=8UhEM3tq9UI', '2026-07-16 08:15:08', '8UhEM3tq9UI', 'https://img.youtube.com/vi/8UhEM3tq9UI/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(11, 'Ex 2.1 class 12 Math New Book 2026 Unit 2 complete solution | Ex 2.1 Class 12 | Punjab Board | PTCB', 'https://www.youtube.com/watch?v=UlCHgfb-MFA', '2026-07-16 08:15:08', 'UlCHgfb-MFA', 'https://img.youtube.com/vi/UlCHgfb-MFA/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(12, 'Ex 1.5 class 11 Math New Book 2026 Unit 1 complete solution | Ex 1.5 Class 11 | Punjab Board | PTCB', 'https://www.youtube.com/watch?v=WHzADl-EX0c', '2026-07-16 08:15:08', 'WHzADl-EX0c', 'https://img.youtube.com/vi/WHzADl-EX0c/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(13, 'Ex 1.4 class 11 Math New Book 2026 Unit 1 complete solution | Ex 1.4 Class 11 | Punjab Board | PTCB', 'https://www.youtube.com/watch?v=eMWYrgtZRj0', '2026-07-16 08:15:08', 'eMWYrgtZRj0', 'https://img.youtube.com/vi/eMWYrgtZRj0/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(14, 'Ex 1.3 class 11 Math New Book 2026 Unit 1 complete solution | Ex 1.3 Class 11 | Punjab Board | PTCB', 'https://www.youtube.com/watch?v=OtotQ-8vjOM', '2026-07-16 08:15:08', 'OtotQ-8vjOM', 'https://img.youtube.com/vi/OtotQ-8vjOM/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(15, 'Ex 1.2 class 11 Math New Book 2026 Unit 1 complete solution | Ex 1.2 Class 11 | Punjab Board | PTCB', 'https://www.youtube.com/watch?v=XmFNblFHv_w', '2026-07-16 08:15:08', 'XmFNblFHv_w', 'https://img.youtube.com/vi/XmFNblFHv_w/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(16, 'Ex 1.1 class 11 Math New Book 2026 Unit 1 complete solution | Ex 1.1 Class 11 | Punjab Board | PTCB', 'https://www.youtube.com/watch?v=BV3Tn-x6f6Q', '2026-07-16 08:15:08', 'BV3Tn-x6f6Q', 'https://img.youtube.com/vi/BV3Tn-x6f6Q/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(17, 'Class 12 Math New Book 2026 Unit 1 Exercise 1.5 Complete Solution | Ex 1.5 Class 12th | Punjab Board', 'https://www.youtube.com/watch?v=vWHThPZbAPI', '2026-07-16 08:15:08', 'vWHThPZbAPI', 'https://img.youtube.com/vi/vWHThPZbAPI/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(18, 'Class 12 Math New Book 2026 Unit 1 Exercise 1.4 Complete Solution | Ex 1.4 Class 12th | Punjab Board', 'https://www.youtube.com/watch?v=gCBtCZ0OUHo', '2026-07-16 08:15:08', 'gCBtCZ0OUHo', 'https://img.youtube.com/vi/gCBtCZ0OUHo/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(19, 'Class 12 Math New Book 2026 Unit 1 Exercise 1.3 Complete Solution | Ex 1.3 Class 12th | Punjab Board', 'https://www.youtube.com/watch?v=nmc6yX7SuVY', '2026-07-16 08:15:08', 'nmc6yX7SuVY', 'https://img.youtube.com/vi/nmc6yX7SuVY/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(20, 'Class 12 Math New Book 2026 Unit 1 Exercise 1.2 Complete Solution | Ex 1.2 Class 12th | Punjab Board', 'https://www.youtube.com/watch?v=a5ddd-TiMCs', '2026-07-16 08:15:08', 'a5ddd-TiMCs', 'https://img.youtube.com/vi/a5ddd-TiMCs/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(21, 'Class 12 Math New Book 2026 Unit 1 Exercise 1.1 Complete Solution | Ex 1.1 Class 12th | Punjab Board', 'https://www.youtube.com/watch?v=Vq-dszdF3QY', '2026-07-16 08:15:08', 'Vq-dszdF3QY', 'https://img.youtube.com/vi/Vq-dszdF3QY/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(22, '‎Exercise 7.10 Class 12 Maths || Application of Conic Sections || Calculus Corner || by Sir Mehtab', 'https://www.youtube.com/watch?v=aFCYANDIiZw', '2026-07-16 08:15:08', 'aFCYANDIiZw', 'https://img.youtube.com/vi/aFCYANDIiZw/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(23, '‎Exercise 7.9 Class 12 Maths || Conic Section || Hyperbola || Calculus Corner || by Sir Mehtab', 'https://www.youtube.com/watch?v=ASTOlUtkplo', '2026-07-16 08:15:08', 'ASTOlUtkplo', 'https://img.youtube.com/vi/ASTOlUtkplo/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(24, '‎Exercise 7.8 Class 12th Maths || Conic Section || Hyperbola ||Calculus Corner|| by Sir Mehtab', 'https://www.youtube.com/watch?v=wSWNhClBLnQ', '2026-07-16 08:15:08', 'wSWNhClBLnQ', 'https://img.youtube.com/vi/wSWNhClBLnQ/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(25, 'Exercise 7.7 Class 12 Maths || Conic Section Chapter 7 || Ellipse || Calculus Corner|| by Sir Mehtab', 'https://www.youtube.com/watch?v=mEHXXldHWcY', '2026-07-16 08:15:08', 'mEHXXldHWcY', 'https://img.youtube.com/vi/mEHXXldHWcY/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(26, 'Exercise 7.6 Class 12 Maths || Conic Section Chapter 7 || Ellipse ||Calculus Corner|| by Sir Mehtab', 'https://www.youtube.com/watch?v=JqAhhbH2eKg', '2026-07-16 08:15:09', 'JqAhhbH2eKg', 'https://img.youtube.com/vi/JqAhhbH2eKg/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(27, 'Exercise 7.5 Class 12 Maths || Conic Section Chapter 7 || Parabola ||Calculus Corner|| by Sir Mehtab', 'https://www.youtube.com/watch?v=RGY-CHoWc-U', '2026-07-16 08:15:09', 'RGY-CHoWc-U', 'https://img.youtube.com/vi/RGY-CHoWc-U/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(28, 'Exercise 7.4 Class 12 Math || Conic Section Chapter 7 || Parabola ||Calculus Corner|| by Sir Mehtab', 'https://www.youtube.com/watch?v=ROeY8n8CWWA', '2026-07-16 08:15:09', 'ROeY8n8CWWA', 'https://img.youtube.com/vi/ROeY8n8CWWA/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(29, 'Exercise 7.3 Class 12 math | NBF New Book 2025 |Conic Section| Calculus Corner|by Sir Mehtab', 'https://www.youtube.com/watch?v=0FN9ZSRa5pY', '2026-07-16 08:15:09', '0FN9ZSRa5pY', 'https://img.youtube.com/vi/0FN9ZSRa5pY/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(30, 'Exercise 7.2 Class 12 math | NBF New Book 2025 |Conic Section| Calculus Corner|by Sir Mehtab', 'https://www.youtube.com/watch?v=RcKAFXghH9s', '2026-07-16 08:15:09', 'RcKAFXghH9s', 'https://img.youtube.com/vi/RcKAFXghH9s/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(31, 'Exercise 7.1 Class 12 math | NBF New Book 2025 |Conic Section | Calculus Corner|by Sir Mehtab', 'https://www.youtube.com/watch?v=YScrEBLHrJY', '2026-07-16 08:15:09', 'YScrEBLHrJY', 'https://img.youtube.com/vi/YScrEBLHrJY/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(32, 'Exercise 8.3 Class 12 maths | NBF New Book 2025 | Inverse Trigonometric Functions & Their Graphs', 'https://www.youtube.com/watch?v=zxq9EgPlqR0', '2026-07-16 08:15:09', 'zxq9EgPlqR0', 'https://img.youtube.com/vi/zxq9EgPlqR0/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(33, 'Exercise 8.2 Class 12 math | NBF New Book 2025 | Inverse Trigonometric Functions & Their Graphs', 'https://www.youtube.com/watch?v=rS3Yl_8TA9A', '2026-07-16 08:15:09', 'rS3Yl_8TA9A', 'https://img.youtube.com/vi/rS3Yl_8TA9A/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(34, 'Exercise 8.1 Class 12 math | NBF New Book 2025 | Inverse Trigonometric Functions & Their Graphs', 'https://www.youtube.com/watch?v=TJqKP5onwxQ', '2026-07-16 08:15:09', 'TJqKP5onwxQ', 'https://img.youtube.com/vi/TJqKP5onwxQ/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(35, 'Exercise 9.3 Class 12 math | NBF New Book 2025 | Solution Of Trigonometric Equations|Calculus Corner', 'https://www.youtube.com/watch?v=IUM9cW0wnkY', '2026-07-16 08:15:09', 'IUM9cW0wnkY', 'https://img.youtube.com/vi/IUM9cW0wnkY/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(36, 'Exercise 9.2 Class 12 math | NBF New Book 2025 | Solution Of Trigonometric Equations Graphically', 'https://www.youtube.com/watch?v=9f14ty3i_7I', '2026-07-16 08:15:09', '9f14ty3i_7I', 'https://img.youtube.com/vi/9f14ty3i_7I/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(37, '‎Exercise 9.1 Class 12 maths | Solution Of Trigonometric Equations |NBF New 📖 2025 | Calculus Corner', 'https://www.youtube.com/watch?v=mmecR53kZBE', '2026-07-16 08:15:09', 'mmecR53kZBE', 'https://img.youtube.com/vi/mmecR53kZBE/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(38, 'Exercise 10.2 Class 12 math | NBF New Book 2025 | Numerical Methods| Calculus Corner | by Sir Mehtab', 'https://www.youtube.com/watch?v=cw8y6F7YtLA', '2026-07-16 08:15:09', 'cw8y6F7YtLA', 'https://img.youtube.com/vi/cw8y6F7YtLA/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(39, 'Exercise 10.1 Class 12 Maths | NBF New Book 2025 | Numerical Methods | Calculus Corner|by Sir Mehtab', 'https://www.youtube.com/watch?v=78qlEnPT_Eg', '2026-07-16 08:15:09', '78qlEnPT_Eg', 'https://img.youtube.com/vi/78qlEnPT_Eg/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(40, 'Exercise 6.3 class 12 math| NBF New Book 2025| Analytical Geometry | Calculus Corner | by Sir Mehtab', 'https://www.youtube.com/watch?v=m4foL1y5Y5M', '2026-07-16 08:15:09', 'm4foL1y5Y5M', 'https://img.youtube.com/vi/m4foL1y5Y5M/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(41, 'Exercise 6.2 class 12 maths | NBF New Book 2025 | Analytical Geometry| Calculus Corner|by Sir Mehtab', 'https://www.youtube.com/watch?v=3qJmHqJRNiE', '2026-07-16 08:15:09', '3qJmHqJRNiE', 'https://img.youtube.com/vi/3qJmHqJRNiE/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(42, 'Exercise 6.1 class 12 math | NBF New Book 2025 | ex 6.1 class 12 math | by Calculus Corner', 'https://www.youtube.com/watch?v=SecjfGFrEsc', '2026-07-16 08:15:09', 'SecjfGFrEsc', 'https://img.youtube.com/vi/SecjfGFrEsc/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(43, 'Review Ex 5 class 12th maths || NBF New Book 2025 ||Review ex 5 12th maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=9D8cEChOWEQ', '2026-07-16 08:15:09', '9D8cEChOWEQ', 'https://img.youtube.com/vi/9D8cEChOWEQ/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(44, 'Exercise 5.3 Class 12 maths || NBF New Book 2025 || ex 5.3 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=fAPEmbgMm88', '2026-07-16 08:15:09', 'fAPEmbgMm88', 'https://img.youtube.com/vi/fAPEmbgMm88/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(45, 'Exercise 5.2 Class 12 maths || NBF New Book 2025 || ex 5.2 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=ZYoD8N_O0Cw', '2026-07-16 08:15:09', 'ZYoD8N_O0Cw', 'https://img.youtube.com/vi/ZYoD8N_O0Cw/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(46, 'Exercise 5.1 Class 12 maths || NBF New Book 2025 || ex 5.1 Class 12th math NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=4jiyzUp6qEU', '2026-07-16 08:15:09', '4jiyzUp6qEU', 'https://img.youtube.com/vi/4jiyzUp6qEU/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(47, '‎Review Exercise 4 class 12th maths ||NBF New Book 2025||Review ex 4 12th maths NBF||Calculus Corner', 'https://www.youtube.com/watch?v=svsIs63GxXQ', '2026-07-16 08:15:09', 'svsIs63GxXQ', 'https://img.youtube.com/vi/svsIs63GxXQ/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(48, 'Exercise 4.4 Class 12 maths || NBF New Book 2025 || ex 4.4 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=uoMnPk3Jooc', '2026-07-16 08:15:09', 'uoMnPk3Jooc', 'https://img.youtube.com/vi/uoMnPk3Jooc/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(49, 'Exercise 4.3 Class 12 maths || NBF New Book 2025 || ex 4.3 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=xaHndHB-7WQ', '2026-07-16 08:15:09', 'xaHndHB-7WQ', 'https://img.youtube.com/vi/xaHndHB-7WQ/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(50, 'Exercise 4.2 Class 12 maths || NBF New Book 2025 || ex 4.2 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=07V2IgSsP6M', '2026-07-16 08:15:09', '07V2IgSsP6M', 'https://img.youtube.com/vi/07V2IgSsP6M/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(51, 'Exercise 4.1 Class 12 maths || NBF New Book 2025 || ex 4.1 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=aTy9U6DWiIQ', '2026-07-16 08:15:09', 'aTy9U6DWiIQ', 'https://img.youtube.com/vi/aTy9U6DWiIQ/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(52, 'Review Exercise 3 class 12th maths ||NBF New Book 2025 ||Review ex 3 12th maths NBF||Calculus Corner', 'https://www.youtube.com/watch?v=0PHBM7DKCmM', '2026-07-16 08:15:09', '0PHBM7DKCmM', 'https://img.youtube.com/vi/0PHBM7DKCmM/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(53, 'Exercise 3.8 Class 12 maths || NBF New Book 2025 || ex 3.8 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=YeAqArAG0iI', '2026-07-16 08:15:09', 'YeAqArAG0iI', 'https://img.youtube.com/vi/YeAqArAG0iI/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(54, 'Exercise 3.7 Class 12 maths || NBF New Book 2025 || ex 3.7 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=_csH2DMJZpg', '2026-07-16 08:15:09', '_csH2DMJZpg', 'https://img.youtube.com/vi/_csH2DMJZpg/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(55, '‎Exercise 3.6 Class 12 maths || NBF New Book 2025 || ex 3.6 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=raxEbgBvX28', '2026-07-16 08:15:09', 'raxEbgBvX28', 'https://img.youtube.com/vi/raxEbgBvX28/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(56, 'Exercise 3.5 Class 12 maths || NBF New Book 2025 || ex 3.5 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=xo1xP3CbTAg', '2026-07-16 08:15:09', 'xo1xP3CbTAg', 'https://img.youtube.com/vi/xo1xP3CbTAg/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(57, 'Exercise 3.4 Class 12 maths || NBF New Book 2025 || ex 3.4 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=cC_nmfBtYOo', '2026-07-16 08:15:09', 'cC_nmfBtYOo', 'https://img.youtube.com/vi/cC_nmfBtYOo/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(58, 'Exercise 3.3 Class 12 maths || NBF New Book 2025 || ex 3.3 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=r_NALcM3yUA', '2026-07-16 08:15:09', 'r_NALcM3yUA', 'https://img.youtube.com/vi/r_NALcM3yUA/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(59, 'Exercise 3.2 Class 12 maths || NBF New Book 2025 || ex 3.2 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=rdij-1XKB1Y', '2026-07-16 08:15:09', 'rdij-1XKB1Y', 'https://img.youtube.com/vi/rdij-1XKB1Y/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(60, 'Exercise 3.1 Class 12 maths || NBF New Book 2025 || Integration 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=NO2YotZ82Fg', '2026-07-16 08:15:09', 'NO2YotZ82Fg', 'https://img.youtube.com/vi/NO2YotZ82Fg/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(61, 'Review Ex 1 class 12th maths ||NBF New Book 2025 ||Review Unit 1 12th maths NBF|| by Calculus Corner', 'https://www.youtube.com/watch?v=OR6R5Ky5K8o', '2026-07-16 08:15:09', 'OR6R5Ky5K8o', 'https://img.youtube.com/vi/OR6R5Ky5K8o/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(62, 'Review Ex 2 class 12th maths || NBF New Book 2025 ||Review Unit 2 12th maths NBF || Calculus Corner', 'https://www.youtube.com/watch?v=3879ot9EY2U', '2026-07-16 08:15:09', '3879ot9EY2U', 'https://img.youtube.com/vi/3879ot9EY2U/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(63, 'Exercise 2.10 Class 12 maths || NBF New Book 2025 || ex 2.10 Class 12 maths NBF ||by Calculus Corner', 'https://www.youtube.com/watch?v=BECmyYPiMbg', '2026-07-16 08:15:09', 'BECmyYPiMbg', 'https://img.youtube.com/vi/BECmyYPiMbg/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(64, 'Exercise 2.9 Class 12 maths || NBF New Book 2025 || ex 2.9 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=X_KbC9SLgy4', '2026-07-16 08:15:09', 'X_KbC9SLgy4', 'https://img.youtube.com/vi/X_KbC9SLgy4/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(65, 'Exercise 2.8 Class 12 maths || NBF New Book 2025 || ex 2.8 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=p9XHvfG3FwI', '2026-07-16 08:15:09', 'p9XHvfG3FwI', 'https://img.youtube.com/vi/p9XHvfG3FwI/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(66, 'Exercise 2.7 Class 12 maths || NBF New Book 2025 || ex 2.7 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=R46Dx4kATsU', '2026-07-16 08:15:09', 'R46Dx4kATsU', 'https://img.youtube.com/vi/R46Dx4kATsU/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(67, 'Exercise 2.6 Class 12 maths || NBF New Book 2025 || ex 2.6 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=5HEYctf9VXc', '2026-07-16 08:15:09', '5HEYctf9VXc', 'https://img.youtube.com/vi/5HEYctf9VXc/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(68, 'Exercise 2.5 Class 12 maths || NBF New Book 2025 || ex 2.5 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=MBPMtUxXSok', '2026-07-16 08:15:09', 'MBPMtUxXSok', 'https://img.youtube.com/vi/MBPMtUxXSok/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(69, '‎Exercise 2.4 Class 12 maths || NBF New Book 2025 || ex 2.4 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=hAHQz5XuAZY', '2026-07-16 08:15:09', 'hAHQz5XuAZY', 'https://img.youtube.com/vi/hAHQz5XuAZY/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(70, 'Exercise 2.3 Class 12 maths || NBF New Book 2025 || ex 2.3 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=MB2pCXqx66Y', '2026-07-16 08:15:09', 'MB2pCXqx66Y', 'https://img.youtube.com/vi/MB2pCXqx66Y/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(71, 'Exercise 2.2 Class 12 maths || NBF New Book 2025 || ex 2.2 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=mS-Heu5rikE', '2026-07-16 08:15:09', 'mS-Heu5rikE', 'https://img.youtube.com/vi/mS-Heu5rikE/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(72, 'Exercise 2.1 Class 12 maths || NBF New Book 2025 || ex 2.1 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=vo5J7VPfvdM', '2026-07-16 08:15:09', 'vo5J7VPfvdM', 'https://img.youtube.com/vi/vo5J7VPfvdM/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(73, '‎Exercise 1.5 Class 12 maths || NBF New Book 2025 || ex 1.5 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=feHaZa6zpKY', '2026-07-16 08:15:09', 'feHaZa6zpKY', 'https://img.youtube.com/vi/feHaZa6zpKY/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(74, 'Exercise 1.4 Class 12th maths || NBF New Book 2025 || ex 1.4 Class 12 maths NBF ||by Calculus Corner', 'https://www.youtube.com/watch?v=Ejjt_uZto_U', '2026-07-16 08:15:09', 'Ejjt_uZto_U', 'https://img.youtube.com/vi/Ejjt_uZto_U/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(75, '‎Exercise 1.3 Class 12 maths || NBF New Book 2025 || ex 1.3 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=Y2hmGxT90Zc', '2026-07-16 08:15:09', 'Y2hmGxT90Zc', 'https://img.youtube.com/vi/Y2hmGxT90Zc/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(76, 'Exercise 1.2 Class 12 maths || NBF New Book 2025 || ex 1.2 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=NqSZxiUfsh0', '2026-07-16 08:15:09', 'NqSZxiUfsh0', 'https://img.youtube.com/vi/NqSZxiUfsh0/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(77, 'Exercise 1.1 Class 12 maths || NBF New Book 2025 || ex 1.1 Class 12 maths NBF || by Calculus Corner', 'https://www.youtube.com/watch?v=EISyF6AjPB0', '2026-07-16 08:15:09', 'EISyF6AjPB0', 'https://img.youtube.com/vi/EISyF6AjPB0/hqdefault.jpg', 'Class 12', 'FBISE', 0),
(79, 'Class 11 Math New Book 2026 Unit 1 Ex 3.2 Complete Solution | Ex 3.2 Class 11 | Punjab Board | PTCB', 'https://www.youtube.com/watch?v=AelTLHiWEhQ', '2026-07-16 08:15:09', 'AelTLHiWEhQ', 'https://img.youtube.com/vi/AelTLHiWEhQ/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(80, 'Class 11 Math New Book 2026 Unit 1 Ex 3.1 Complete Solution | Ex 3.1 Class 11 | Punjab Board | PTCB', 'https://www.youtube.com/watch?v=JQLJs2M8G6A', '2026-07-16 08:15:09', 'JQLJs2M8G6A', 'https://img.youtube.com/vi/JQLJs2M8G6A/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(81, 'Class 11 Math New Book 2026 Unit 1 Ex 2.2 Complete Solution | Ex 2.2 Class 11 | Punjab Board | PTCB', 'https://www.youtube.com/watch?v=xuTkq0gOau0', '2026-07-16 08:15:09', 'xuTkq0gOau0', 'https://img.youtube.com/vi/xuTkq0gOau0/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(82, 'Class 11 Math New Book 2026 Unit 1 Ex 2.1 Complete Solution | Ex 2.1 Class 11 | Punjab Board | PTCB', 'https://www.youtube.com/watch?v=ckwsvk2Y-Fc', '2026-07-16 08:15:09', 'ckwsvk2Y-Fc', 'https://img.youtube.com/vi/ckwsvk2Y-Fc/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(83, 'McQs Unit 9 Class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=yX31r0F_M4s', '2026-07-16 08:15:09', 'yX31r0F_M4s', 'https://img.youtube.com/vi/yX31r0F_M4s/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(84, 'McQs Unit 8 Class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=wiXZ_4K7YYU', '2026-07-16 08:15:09', 'wiXZ_4K7YYU', 'https://img.youtube.com/vi/wiXZ_4K7YYU/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(85, 'McQs Unit 7 Class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=9w6S3GTTN28', '2026-07-16 08:15:09', '9w6S3GTTN28', 'https://img.youtube.com/vi/9w6S3GTTN28/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(86, 'Unit  6 McQs Class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=1KhAHEIHkeE', '2026-07-16 08:15:09', '1KhAHEIHkeE', 'https://img.youtube.com/vi/1KhAHEIHkeE/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(87, 'Unit 5 McQs Class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=g6ySAx3unoM', '2026-07-16 08:15:09', 'g6ySAx3unoM', 'https://img.youtube.com/vi/g6ySAx3unoM/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(88, 'Unit 4 McQs Class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=Y1DCWYDAiwM', '2026-07-16 08:15:09', 'Y1DCWYDAiwM', 'https://img.youtube.com/vi/Y1DCWYDAiwM/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(89, 'Unit 3 McQs Class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=-zmqPHKCFx4', '2026-07-16 08:15:09', '-zmqPHKCFx4', 'https://img.youtube.com/vi/-zmqPHKCFx4/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(90, 'Unit 2 McQs Class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=AajUQ9j-J2I', '2026-07-16 08:15:09', 'AajUQ9j-J2I', 'https://img.youtube.com/vi/AajUQ9j-J2I/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(91, 'Unit 1 McQs Class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=omdTRcT2aJ8', '2026-07-16 08:15:09', 'omdTRcT2aJ8', 'https://img.youtube.com/vi/omdTRcT2aJ8/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(92, 'Review Exercise 9 Class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=EfJ1BYF4RMM', '2026-07-16 08:15:09', 'EfJ1BYF4RMM', 'https://img.youtube.com/vi/EfJ1BYF4RMM/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(93, 'Exercise 9.1 & 9.2 class 11 NBF ||Full Unit 9|| National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=mIKWvPYT-c4', '2026-07-16 08:15:09', 'mIKWvPYT-c4', 'https://img.youtube.com/vi/mIKWvPYT-c4/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(94, 'Review Exercise 6 Class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=4FXRl0ftBSE', '2026-07-16 08:15:09', '4FXRl0ftBSE', 'https://img.youtube.com/vi/4FXRl0ftBSE/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(95, 'Review Exercise 7 Class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=NQAuFL2aVi8', '2026-07-16 08:15:09', 'NQAuFL2aVi8', 'https://img.youtube.com/vi/NQAuFL2aVi8/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(96, 'Exercise 7.4 class 11 NBF |Ex 7.4 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=9_iIvNkXABw', '2026-07-16 08:15:09', '9_iIvNkXABw', 'https://img.youtube.com/vi/9_iIvNkXABw/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(97, 'Exercise 7.3 class 11 NBF |Ex 7.3 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=4Ydv4yMeMQs', '2026-07-16 08:15:09', '4Ydv4yMeMQs', 'https://img.youtube.com/vi/4Ydv4yMeMQs/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(98, 'Exercise 7.2 class 11 NBF |Ex 7.2 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=-mEuJgHcSPc', '2026-07-16 08:15:09', '-mEuJgHcSPc', 'https://img.youtube.com/vi/-mEuJgHcSPc/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(99, 'Exercise 7.1 class 11 NBF |Ex 7.1 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=vFp5bILh1ks', '2026-07-16 08:15:09', 'vFp5bILh1ks', 'https://img.youtube.com/vi/vFp5bILh1ks/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(100, 'Exercise 7.1 class 11 NBF |Ex 7.1 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=OFBRR4JBDUw', '2026-07-16 08:15:09', 'OFBRR4JBDUw', 'https://img.youtube.com/vi/OFBRR4JBDUw/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(101, 'Exercise 6.3 class 11 NBF |Ex 6.3 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=Jkz-DL1VAg4', '2026-07-16 08:15:09', 'Jkz-DL1VAg4', 'https://img.youtube.com/vi/Jkz-DL1VAg4/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(102, 'Exercise 6.2 class 11 NBF |Ex 6.2 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=8b3CvVrXVj4', '2026-07-16 08:15:09', '8b3CvVrXVj4', 'https://img.youtube.com/vi/8b3CvVrXVj4/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(103, 'Review Exercise 8 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=Hq0rgtT8nRM', '2026-07-16 08:15:09', 'Hq0rgtT8nRM', 'https://img.youtube.com/vi/Hq0rgtT8nRM/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(104, 'Exercise 8.3 class 11 NBF |Ex 8.3 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=Ig9E43ryNSs', '2026-07-16 08:15:09', 'Ig9E43ryNSs', 'https://img.youtube.com/vi/Ig9E43ryNSs/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(105, 'Exercise 8.2 class 11 NBF |Ex 8.2 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=4SQ1389vBAg', '2026-07-16 08:15:09', '4SQ1389vBAg', 'https://img.youtube.com/vi/4SQ1389vBAg/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(106, 'Exercise 8.1 class 11 NBF |Ex 8.1 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=5Ph7w1xQxNY', '2026-07-16 08:15:09', '5Ph7w1xQxNY', 'https://img.youtube.com/vi/5Ph7w1xQxNY/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(107, 'Exercise 6.1 class 11 NBF |Ex 6.1 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=D2zNcue3cxc', '2026-07-16 08:15:09', 'D2zNcue3cxc', 'https://img.youtube.com/vi/D2zNcue3cxc/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(108, 'Review Exercise 4 Class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=LAPBnFQVdxQ', '2026-07-16 08:15:09', 'LAPBnFQVdxQ', 'https://img.youtube.com/vi/LAPBnFQVdxQ/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(109, 'Exercise 4.9 class 11 NBF |Ex 4.9 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=YAMnvTQdDc0', '2026-07-16 08:15:09', 'YAMnvTQdDc0', 'https://img.youtube.com/vi/YAMnvTQdDc0/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(110, 'Exercise 4.8 class 11 NBF |Ex 4.8 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=O1V0fCbAAz8', '2026-07-16 08:15:09', 'O1V0fCbAAz8', 'https://img.youtube.com/vi/O1V0fCbAAz8/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(111, 'Exercise 4.7 class 11 NBF |Ex 4.7 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=hEfM9uFqrok', '2026-07-16 08:15:09', 'hEfM9uFqrok', 'https://img.youtube.com/vi/hEfM9uFqrok/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(112, 'Review Exercise 3 Class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=0QNRYYOuBEg', '2026-07-16 08:15:09', '0QNRYYOuBEg', 'https://img.youtube.com/vi/0QNRYYOuBEg/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(113, 'Exercise 4.6 class 11 NBF |Ex 4.6 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=rqtwCAaIxi8', '2026-07-16 08:15:09', 'rqtwCAaIxi8', 'https://img.youtube.com/vi/rqtwCAaIxi8/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(114, 'Exercise 4.5 class 11 NBF |Ex 4.5 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=5DwJM7RBvXY', '2026-07-16 08:15:09', '5DwJM7RBvXY', 'https://img.youtube.com/vi/5DwJM7RBvXY/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(115, 'Exercise 4.4 class 11 NBF |Ex 4.4 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=vgzTcxkOvUE', '2026-07-16 08:15:09', 'vgzTcxkOvUE', 'https://img.youtube.com/vi/vgzTcxkOvUE/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(116, 'Exercise 4.3 class 11 NBF |Ex 4.3 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=yc8EpwA_ooo', '2026-07-16 08:15:09', 'yc8EpwA_ooo', 'https://img.youtube.com/vi/yc8EpwA_ooo/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(117, 'Exercise 4.2 class 11 NBF |Ex 4.2 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=8p2Q6dkipAw', '2026-07-16 08:15:09', '8p2Q6dkipAw', 'https://img.youtube.com/vi/8p2Q6dkipAw/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(118, 'Exercise 4.1 class 11 NBF |Ex 4.1 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=gZtFoMGFq-M', '2026-07-16 08:15:09', 'gZtFoMGFq-M', 'https://img.youtube.com/vi/gZtFoMGFq-M/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(119, 'Review Exercise 5 Class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=liPpuHqFwFI', '2026-07-16 08:15:09', 'liPpuHqFwFI', 'https://img.youtube.com/vi/liPpuHqFwFI/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(120, 'Exercise 5.3 class 11 NBF |Ex 5.3 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=oZmfsCU_DO0', '2026-07-16 08:15:09', 'oZmfsCU_DO0', 'https://img.youtube.com/vi/oZmfsCU_DO0/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(121, 'Exercise 5.2 class 11 NBF |Ex 5.2 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=xUEI-bMZ6aM', '2026-07-16 08:15:09', 'xUEI-bMZ6aM', 'https://img.youtube.com/vi/xUEI-bMZ6aM/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(122, 'Exercise 5.1 class 11 NBF |Ex 5.1 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=LqCT4hqB8o8', '2026-07-16 08:15:09', 'LqCT4hqB8o8', 'https://img.youtube.com/vi/LqCT4hqB8o8/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(123, 'Exercise 3.4 class 11 NBF |Ex 3.4 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=Zvz_maoQuq0', '2026-07-16 08:15:09', 'Zvz_maoQuq0', 'https://img.youtube.com/vi/Zvz_maoQuq0/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(124, 'Exercise 3.3 class 11 NBF |Ex 3.3 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=sn8AzNtY3s4', '2026-07-16 08:15:09', 'sn8AzNtY3s4', 'https://img.youtube.com/vi/sn8AzNtY3s4/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(125, 'Exercise 3.2 class 11 NBF |Ex 3.2 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=yxaDycxhTog', '2026-07-16 08:15:09', 'yxaDycxhTog', 'https://img.youtube.com/vi/yxaDycxhTog/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(126, 'Exercise 3.1 class 11 NBF |Ex 3.1 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=n0bcIsz9lU0', '2026-07-16 08:15:09', 'n0bcIsz9lU0', 'https://img.youtube.com/vi/n0bcIsz9lU0/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(127, 'Review Exercise 1 Class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=8eZE-7Gx-kw', '2026-07-16 08:15:09', '8eZE-7Gx-kw', 'https://img.youtube.com/vi/8eZE-7Gx-kw/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(128, 'Review Exercise 2 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=SQJseUXz-UA', '2026-07-16 08:15:09', 'SQJseUXz-UA', 'https://img.youtube.com/vi/SQJseUXz-UA/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(129, 'Exercise 2.6 class 11 NBF | Ex 2.6 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=5_jdFfTwC2c', '2026-07-16 08:15:09', '5_jdFfTwC2c', 'https://img.youtube.com/vi/5_jdFfTwC2c/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(130, 'Exercise 2.5 class 11 NBF | Ex 2.5 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=cP5XGhvnBdM', '2026-07-16 08:15:09', 'cP5XGhvnBdM', 'https://img.youtube.com/vi/cP5XGhvnBdM/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(131, 'Exercise 2.4 class 11 NBF | Ex 2.4 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=R062DhBirtc', '2026-07-16 08:15:09', 'R062DhBirtc', 'https://img.youtube.com/vi/R062DhBirtc/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(132, 'Exercise 2.3 class 11 NBF | Ex 2.3 class 11 NBF | National book foundation | Calculus Corner', 'https://www.youtube.com/watch?v=wsUAAmj23Rw', '2026-07-16 08:15:09', 'wsUAAmj23Rw', 'https://img.youtube.com/vi/wsUAAmj23Rw/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(133, 'Exercise 2.2 class 11 NBF | Ex 2.2 class 11 NBF | National book foundation', 'https://www.youtube.com/watch?v=BO387hptxbg', '2026-07-16 08:15:09', 'BO387hptxbg', 'https://img.youtube.com/vi/BO387hptxbg/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(134, 'Exercise 2.1 class 11 NBF | Ex 2.1 class 11 NBF | National book foundation', 'https://www.youtube.com/watch?v=TaFnjdDxncM', '2026-07-16 08:15:09', 'TaFnjdDxncM', 'https://img.youtube.com/vi/TaFnjdDxncM/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(135, 'Exercise 1.4 class 11 NBF | Ex 1.4 class 11 NBF | National book foundation', 'https://www.youtube.com/watch?v=baPf5eg0Dws', '2026-07-16 08:15:09', 'baPf5eg0Dws', 'https://img.youtube.com/vi/baPf5eg0Dws/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(136, 'Exercise 1.3 class 11 NBF | Ex 1.3 class 11 NBF | National book foundation', 'https://www.youtube.com/watch?v=f1jMZUT7Gzo', '2026-07-16 08:15:09', 'f1jMZUT7Gzo', 'https://img.youtube.com/vi/f1jMZUT7Gzo/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(137, 'Exercise 1.2 class 11 NBF | Ex 1.2 class 11 NBF | National book foundation', 'https://www.youtube.com/watch?v=UWMt8GaR7XU', '2026-07-16 08:15:09', 'UWMt8GaR7XU', 'https://img.youtube.com/vi/UWMt8GaR7XU/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(138, 'Exercise 1.1 class 11 NBF | Ex 1.1 class 11 NBF | National book foundation', 'https://www.youtube.com/watch?v=4CsuzbAvqbI', '2026-07-16 08:15:09', '4CsuzbAvqbI', 'https://img.youtube.com/vi/4CsuzbAvqbI/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(139, 'Exercise 7.2 class 11 KPK, AJK and fbise board | Ex 7.2 class 11 | 11th  maths', 'https://www.youtube.com/watch?v=z_BA2qSFFtE', '2026-07-16 08:15:09', 'z_BA2qSFFtE', 'https://img.youtube.com/vi/z_BA2qSFFtE/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(140, 'Exercise 7.1 class 11 kpk board | Ex 1.1 class 11 kpk board | 11th class maths | by sir mehtab', 'https://www.youtube.com/watch?v=QfzWkyj0MHc', '2026-07-16 08:15:09', 'QfzWkyj0MHc', 'https://img.youtube.com/vi/QfzWkyj0MHc/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(141, 'Review Exercise unit 4 class 11 kpk, fbise board | 11th  maths', 'https://www.youtube.com/watch?v=XerFOeZ37Uc', '2026-07-16 08:15:09', 'XerFOeZ37Uc', 'https://img.youtube.com/vi/XerFOeZ37Uc/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(142, 'Exercise 4.6 class 11 kpk, fbise board | Ex 4.6 class 11 | 11th  maths', 'https://www.youtube.com/watch?v=I7L1DVzs5fk', '2026-07-16 08:15:09', 'I7L1DVzs5fk', 'https://img.youtube.com/vi/I7L1DVzs5fk/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(143, 'Exercise 4.5 class 11 kpk, fbise board | Ex 4.5 class 11 | 11th  maths', 'https://www.youtube.com/watch?v=rhRYE4QVOQg', '2026-07-16 08:15:09', 'rhRYE4QVOQg', 'https://img.youtube.com/vi/rhRYE4QVOQg/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(144, 'Exercise 4.4 class 11 kpk, fbise board | Ex 4.4 class 11 | 11th  maths', 'https://www.youtube.com/watch?v=PrBzlVmavt0', '2026-07-16 08:15:09', 'PrBzlVmavt0', 'https://img.youtube.com/vi/PrBzlVmavt0/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(145, 'Exercise 4.3 class 11 kpk, fbise board | Ex 4.3 class 11 | 11th  maths', 'https://www.youtube.com/watch?v=ksPXG3qJOdc', '2026-07-16 08:15:09', 'ksPXG3qJOdc', 'https://img.youtube.com/vi/ksPXG3qJOdc/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(146, 'Exercise 4.2 class 11 kpk, fbise board | Ex 4.2 class 11 | 11th  maths', 'https://www.youtube.com/watch?v=gChj0nKO_i4', '2026-07-16 08:15:09', 'gChj0nKO_i4', 'https://img.youtube.com/vi/gChj0nKO_i4/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(147, 'Exercise 4.1 class 11 kpk, fbise board | Ex 4.1 class 11 | 11th  maths', 'https://www.youtube.com/watch?v=H86Rf-MYv9o', '2026-07-16 08:15:09', 'H86Rf-MYv9o', 'https://img.youtube.com/vi/H86Rf-MYv9o/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(148, '4. Review Ex Unit#1 class 11 kpk, fbise board | 11th  maths', 'https://www.youtube.com/watch?v=nXQAsXj23a8', '2026-07-16 08:15:09', 'nXQAsXj23a8', 'https://img.youtube.com/vi/nXQAsXj23a8/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(149, '3. Exercise 1.3 class 11 kpk, fbise board | Ex 1.3 class 11 | 11th  maths', 'https://www.youtube.com/watch?v=1w6UMsEUiHo', '2026-07-16 08:15:09', '1w6UMsEUiHo', 'https://img.youtube.com/vi/1w6UMsEUiHo/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(150, '2. Exercise 1.2 class 11 kpk, fbise board | Ex 1.2 class 11 | 11th  maths', 'https://www.youtube.com/watch?v=MrvJau-dMkk', '2026-07-16 08:15:09', 'MrvJau-dMkk', 'https://img.youtube.com/vi/MrvJau-dMkk/hqdefault.jpg', 'Class 11', 'FBISE', 0),
(151, 'Solution of Final Paper 2025 Class 11th Maths FBISE|| National book foundation || Calculus Corner', 'https://www.youtube.com/watch?v=PUPIGIOervM', '2026-07-16 12:40:10', 'PUPIGIOervM', 'https://i.ytimg.com/vi/PUPIGIOervM/hqdefault.jpg', 'Class 11', 'FBISE', 1);

-- --------------------------------------------------------

--
-- Table structure for table `video_progress`
--

CREATE TABLE `video_progress` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `video_id` int(11) NOT NULL,
  `progress_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `is_completed` tinyint(1) NOT NULL DEFAULT 0,
  `last_watched_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `books`
--
ALTER TABLE `books`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `certificates`
--
ALTER TABLE `certificates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_certificate` (`user_id`,`course_id`),
  ADD KEY `fk_cert_course` (`course_id`);

--
-- Indexes for table `courses`
--
ALTER TABLE `courses`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `course_progress`
--
ALTER TABLE `course_progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_course_progress` (`user_id`,`course_id`),
  ADD KEY `fk_course_progress_course` (`course_id`);

--
-- Indexes for table `course_quizzes`
--
ALTER TABLE `course_quizzes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_course_quiz` (`course_id`);

--
-- Indexes for table `email_logs`
--
ALTER TABLE `email_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `enrollments`
--
ALTER TABLE `enrollments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_enrollment` (`student_id`,`course_id`),
  ADD UNIQUE KEY `uq_enrollment` (`student_id`,`course_id`);

--
-- Indexes for table `newsletter_subscribers`
--
ALTER TABLE `newsletter_subscribers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_newsletter_email` (`email`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_user_role_created` (`user_id`,`role`,`created_at`),
  ADD KEY `idx_notifications_role_created` (`role`,`created_at`);

--
-- Indexes for table `question_pool`
--
ALTER TABLE `question_pool`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_question_pool_topic` (`topic`);

--
-- Indexes for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_quiz_attempts_user_date` (`userId`,`completedAt`);

--
-- Indexes for table `resources`
--
ALTER TABLE `resources`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `site_content`
--
ALTER TABLE `site_content`
  ADD PRIMARY KEY (`section_name`);

--
-- Indexes for table `students_profile`
--
ALTER TABLE `students_profile`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `subjects`
--
ALTER TABLE `subjects`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_subject_slug` (`slug`);

--
-- Indexes for table `support_messages`
--
ALTER TABLE `support_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `student_id` (`student_id`),
  ADD KEY `idx_support_messages_student_created` (`student_id`,`created_at`);

--
-- Indexes for table `testimonials`
--
ALTER TABLE `testimonials`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_testimonial_student` (`student_id`);

--
-- Indexes for table `unban_requests`
--
ALTER TABLE `unban_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_unban_requests_student_created` (`student_id`,`created_at`),
  ADD KEY `idx_unban_requests_status_created` (`status`,`created_at`);

--
-- Indexes for table `updates`
--
ALTER TABLE `updates`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_email` (`email`);

--
-- Indexes for table `user_badges`
--
ALTER TABLE `user_badges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_badges_user_earned` (`userId`,`earnedAt`);

--
-- Indexes for table `videos`
--
ALTER TABLE `videos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_video_id` (`video_id`);

--
-- Indexes for table `video_progress`
--
ALTER TABLE `video_progress`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_video_progress` (`user_id`,`video_id`),
  ADD KEY `fk_video_progress_video` (`video_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `books`
--
ALTER TABLE `books`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `certificates`
--
ALTER TABLE `certificates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `courses`
--
ALTER TABLE `courses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `course_progress`
--
ALTER TABLE `course_progress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `course_quizzes`
--
ALTER TABLE `course_quizzes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `email_logs`
--
ALTER TABLE `email_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT for table `enrollments`
--
ALTER TABLE `enrollments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `newsletter_subscribers`
--
ALTER TABLE `newsletter_subscribers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=102;

--
-- AUTO_INCREMENT for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `resources`
--
ALTER TABLE `resources`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `subjects`
--
ALTER TABLE `subjects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `support_messages`
--
ALTER TABLE `support_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `testimonials`
--
ALTER TABLE `testimonials`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `unban_requests`
--
ALTER TABLE `unban_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `updates`
--
ALTER TABLE `updates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `user_badges`
--
ALTER TABLE `user_badges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `videos`
--
ALTER TABLE `videos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=152;

--
-- AUTO_INCREMENT for table `video_progress`
--
ALTER TABLE `video_progress`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `certificates`
--
ALTER TABLE `certificates`
  ADD CONSTRAINT `fk_cert_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_cert_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_progress`
--
ALTER TABLE `course_progress`
  ADD CONSTRAINT `fk_course_progress_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_course_progress_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `course_quizzes`
--
ALTER TABLE `course_quizzes`
  ADD CONSTRAINT `fk_course_quiz_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quiz_attempts`
--
ALTER TABLE `quiz_attempts`
  ADD CONSTRAINT `fk_quiz_attempts_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `students_profile`
--
ALTER TABLE `students_profile`
  ADD CONSTRAINT `fk_student_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `support_messages`
--
ALTER TABLE `support_messages`
  ADD CONSTRAINT `fk_support_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `unban_requests`
--
ALTER TABLE `unban_requests`
  ADD CONSTRAINT `fk_unban_student_new` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_badges`
--
ALTER TABLE `user_badges`
  ADD CONSTRAINT `fk_user_badges_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `video_progress`
--
ALTER TABLE `video_progress`
  ADD CONSTRAINT `fk_video_progress_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_video_progress_video` FOREIGN KEY (`video_id`) REFERENCES `videos` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
