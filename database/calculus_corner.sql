/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.5.29-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: calculus_corner
-- ------------------------------------------------------
-- Server version	10.5.29-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ai_conversations`
--

DROP TABLE IF EXISTS `ai_conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_conversations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_ai_conversation_user` (`user_id`),
  CONSTRAINT `fk_ai_conversation_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_conversations`
--

LOCK TABLES `ai_conversations` WRITE;
/*!40000 ALTER TABLE `ai_conversations` DISABLE KEYS */;
/*!40000 ALTER TABLE `ai_conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ai_generation_logs`
--

DROP TABLE IF EXISTS `ai_generation_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_generation_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_generation_logs`
--

LOCK TABLES `ai_generation_logs` WRITE;
/*!40000 ALTER TABLE `ai_generation_logs` DISABLE KEYS */;
INSERT INTO `ai_generation_logs` VALUES (1,0,'2026-06-30 06:24:21');
/*!40000 ALTER TABLE `ai_generation_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ai_messages`
--

DROP TABLE IF EXISTS `ai_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conversation_id` int(11) NOT NULL,
  `sender` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_ai_message_conv` (`conversation_id`),
  CONSTRAINT `fk_ai_message_conv` FOREIGN KEY (`conversation_id`) REFERENCES `ai_conversations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_messages`
--

LOCK TABLES `ai_messages` WRITE;
/*!40000 ALTER TABLE `ai_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `ai_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ai_tutor_logs`
--

DROP TABLE IF EXISTS `ai_tutor_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_tutor_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_ai_tutor_logs_student` (`student_id`),
  CONSTRAINT `fk_ai_tutor_logs_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_tutor_logs`
--

LOCK TABLES `ai_tutor_logs` WRITE;
/*!40000 ALTER TABLE `ai_tutor_logs` DISABLE KEYS */;
INSERT INTO `ai_tutor_logs` VALUES (3,6,'2026-07-06 18:07:17'),(4,5,'2026-07-07 07:10:44');
/*!40000 ALTER TABLE `ai_tutor_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `text` varchar(255) NOT NULL,
  `link` varchar(500) DEFAULT NULL,
  `active` int(11) NOT NULL DEFAULT 1,
  `priority` int(11) NOT NULL DEFAULT 0,
  `start_date` timestamp NULL DEFAULT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `title` varchar(150) NOT NULL DEFAULT 'Notice',
  `display_order` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `certificates`
--

DROP TABLE IF EXISTS `certificates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'issued',
  `issued_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_certificate` (`user_id`,`course_id`),
  KEY `fk_cert_course` (`course_id`),
  CONSTRAINT `fk_cert_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cert_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `certificates`
--

LOCK TABLES `certificates` WRITE;
/*!40000 ALTER TABLE `certificates` DISABLE KEYS */;
/*!40000 ALTER TABLE `certificates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `course_quizzes`
--

DROP TABLE IF EXISTS `course_quizzes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_quizzes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) NOT NULL,
  `questions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`questions`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_course_quiz` (`course_id`),
  CONSTRAINT `fk_course_quiz_course` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_quizzes`
--

LOCK TABLES `course_quizzes` WRITE;
/*!40000 ALTER TABLE `course_quizzes` DISABLE KEYS */;
INSERT INTO `course_quizzes` VALUES (4,10,'[{\"question\":\"2+2\",\"options\":[\"1\",\"2\",\"3\",\"4\"],\"correctAnswer\":\"4\"}]','2026-07-06 15:24:32'),(5,11,'[{\"question\":\"1+4\",\"options\":[\"2\",\"4\",\"5\",\"8\"],\"correctAnswer\":\"5\"},{\"question\":\"1+6\",\"options\":[\"2\",\"7\",\"8\",\"9\"],\"correctAnswer\":\"7\"}]','2026-07-06 15:24:53'),(6,12,'[{\"question\":\"(1+2)-1\",\"options\":[\"1\",\"2\",\"4\",\"8\"],\"correctAnswer\":\"2\"}]','2026-07-06 15:25:24');
/*!40000 ALTER TABLE `course_quizzes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `quiz_required` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES (10,'High School','Mastering Limits & Continuity','A comprehensive guide to understanding limits, infinity, and the continuity of functions in single-variable calculus.','[\"10 Video Lectures\",\"5 Practice Quizzes\",\"Certificate of Completion\"]','49.99',1,'2026-06-30 11:14:43','https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=600&h=400&fit=crop',NULL,'9.99',1),(11,'College','Advanced Derivatives','Dive deep into the rules of differentiation, chain rule, implicit differentiation, and related rates.','[\"15 Video Lectures\",\"10 Practice Quizzes\",\"Certificate of Completion\"]','59.99',1,'2026-06-30 11:14:43','https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&h=400&fit=crop',NULL,'14.99',1),(12,'University','Integral Calculus Applications','Learn how to apply integrals to find areas, volumes, and solve real-world physics problems.','[\"20 Video Lectures\",\"Final Exam\",\"Certificate of Completion\"]','79.99',0,'2026-06-30 11:14:43','https://images.unsplash.com/photo-1596496181848-3091d4878b24?w=600&h=400&fit=crop',NULL,'19.99',1);
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_logs`
--

DROP TABLE IF EXISTS `email_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `recipient_email` varchar(255) NOT NULL,
  `email_type` varchar(50) NOT NULL,
  `status` varchar(20) NOT NULL,
  `error_message` text DEFAULT NULL,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_logs`
--

LOCK TABLES `email_logs` WRITE;
/*!40000 ALTER TABLE `email_logs` DISABLE KEYS */;
INSERT INTO `email_logs` VALUES (1,'msaadi3806@gmail.com','newsletter_announcement','sent',NULL,'2026-06-29 18:44:10'),(2,'saad.procoder@gmail.com','unban_notification','sent',NULL,'2026-06-30 05:10:15'),(3,'saad.procoder@gmail.com','unban_notification','sent',NULL,'2026-06-30 05:10:17'),(4,'msaadi3806@gmail.com','newsletter_announcement','sent',NULL,'2026-06-30 06:21:18'),(5,'muneebse65@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f74c399a40sm78558656d6.29 - gsmtp','2026-07-06 15:17:11'),(6,'mhasop997@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c41d2cde7sm99054801cf.18 - gsmtp','2026-07-06 15:17:11'),(7,'smpakistan2004@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f4724bab15sm138380966d6.43 - gsmtp','2026-07-06 15:17:11'),(8,'msaadi3806@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c41d2d688sm97061871cf.17 - gsmtp','2026-07-06 15:17:11'),(9,'workvault.7@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c41d2cf18sm100844161cf.14 - gsmtp','2026-07-06 15:22:59'),(10,'mhasop997@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f46e27d555sm138150916d6.7 - gsmtp','2026-07-06 15:22:59'),(11,'msaadi3806@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials af79cd13be357-92e90cc18f1sm948012285a.40 - gsmtp','2026-07-06 15:22:59'),(12,'smpakistan2004@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials af79cd13be357-92e90ce5126sm952082185a.41 - gsmtp','2026-07-06 15:22:59'),(13,'muneebse65@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f46e27d137sm139759616d6.9 - gsmtp','2026-07-06 15:22:59'),(14,'snpakistan80@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials af79cd13be357-92e90ba754fsm971342385a.18 - gsmtp','2026-07-06 15:22:59'),(15,'nadeem@iiu.edu.pk','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c50a937f1sm67580011cf.10 - gsmtp','2026-07-06 15:22:59'),(16,'msaadi3806@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c41b281c9sm94112581cf.9 - gsmtp','2026-07-06 15:39:54'),(17,'mhasop997@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials af79cd13be357-92e90ba754fsm975151185a.18 - gsmtp','2026-07-06 15:39:54'),(18,'snpakistan80@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials af79cd13be357-92e90cce037sm937963685a.38 - gsmtp','2026-07-06 15:39:54'),(19,'workvault.7@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c41decc5csm92784661cf.26 - gsmtp','2026-07-06 15:39:54'),(20,'nadeem@iiu.edu.pk','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c41da510dsm90760631cf.22 - gsmtp','2026-07-06 15:39:54'),(21,'smpakistan2004@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials af79cd13be357-92e90b80785sm958652885a.3 - gsmtp','2026-07-06 15:39:54'),(22,'muneebse65@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f46e371bdfsm137442026d6.1 - gsmtp','2026-07-06 15:39:54'),(23,'mhasop997@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8fca1c1356esm20923756d6.37 - gsmtp','2026-07-07 07:20:16'),(24,'workvault.7@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c41b19a66sm105359181cf.7 - gsmtp','2026-07-07 07:20:16'),(25,'muneebse65@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f46f304533sm153478876d6.18 - gsmtp','2026-07-07 07:20:16'),(26,'nadeem@iiu.edu.pk','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f46e27d53fsm155004056d6.5 - gsmtp','2026-07-07 07:20:16'),(27,'smpakistan2004@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials af79cd13be357-92e90cc18f1sm1099622385a.40 - gsmtp','2026-07-07 07:20:16'),(28,'snpakistan80@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f4724bab9esm151265306d6.42 - gsmtp','2026-07-07 07:20:16'),(29,'msaadi3806@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials af79cd13be357-92e90c923c4sm1140200185a.24 - gsmtp','2026-07-07 07:20:16'),(30,'snpakistan80@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f471814408sm153320716d6.23 - gsmtp','2026-07-07 07:20:37'),(31,'muneebse65@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f471815818sm155985486d6.31 - gsmtp','2026-07-07 07:20:37'),(32,'nadeem@iiu.edu.pk','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f4724bab15sm154275216d6.43 - gsmtp','2026-07-07 07:20:37'),(33,'smpakistan2004@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f46e27d526sm163497346d6.4 - gsmtp','2026-07-07 07:20:37'),(34,'workvault.7@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials af79cd13be357-92e90bb8629sm1115231585a.19 - gsmtp','2026-07-07 07:20:37'),(35,'msaadi3806@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f471815818sm155985476d6.31 - gsmtp','2026-07-07 07:20:37'),(36,'mhasop997@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials af79cd13be357-92e90ccde4fsm1115658585a.39 - gsmtp','2026-07-07 07:20:37'),(37,'snpakistan80@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c4190e9e0sm133160711cf.0 - gsmtp','2026-07-08 12:29:47'),(38,'nadeem@iiu.edu.pk','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c41b19a66sm132197871cf.7 - gsmtp','2026-07-08 12:29:48'),(39,'smpakistan2004@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c41db2c61sm139315921cf.24 - gsmtp','2026-07-08 12:29:48'),(40,'hellomelo@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials af79cd13be357-92e90cc18f1sm1380248685a.40 - gsmtp','2026-07-08 12:29:48'),(41,'msaadi3806@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c41ab77dcsm134673781cf.2 - gsmtp','2026-07-08 12:29:48'),(42,'mhasop997@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials 6a1803df08f44-8f472a9ad1fsm181414176d6.47 - gsmtp','2026-07-08 12:29:48'),(43,'muneebse65@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c41f1ee58sm131002321cf.29 - gsmtp','2026-07-08 12:29:48'),(44,'workvault.7@gmail.com','newsletter_announcement','failed','Invalid login: 535-5.7.8 Username and Password not accepted. For more information, go to\n535 5.7.8  https://support.google.com/mail/?p=BadCredentials d75a77b69052e-51c4190e9e0sm133160701cf.0 - gsmtp','2026-07-08 12:29:48');
/*!40000 ALTER TABLE `email_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enrollments`
--

DROP TABLE IF EXISTS `enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `enrollments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `course_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `certificate_status` varchar(20) NOT NULL DEFAULT 'none',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_enrollment` (`student_id`,`course_id`),
  UNIQUE KEY `uq_enrollment` (`student_id`,`course_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enrollments`
--

LOCK TABLES `enrollments` WRITE;
/*!40000 ALTER TABLE `enrollments` DISABLE KEYS */;
INSERT INTO `enrollments` VALUES (1,1,1,'2026-06-29 18:34:00','approved','issued'),(2,2,1,'2026-06-30 04:17:13','approved','issued'),(3,3,2,'2026-06-30 06:22:14','approved','issued'),(4,5,10,'2026-07-06 15:27:26','approved','rejected'),(5,5,11,'2026-07-06 15:31:05','approved','issued'),(6,8,10,'2026-07-07 07:25:24','approved','issued');
/*!40000 ALTER TABLE `enrollments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `newsletter_subscribers`
--

DROP TABLE IF EXISTS `newsletter_subscribers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `newsletter_subscribers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `subscribed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `unsubscribe_token` varchar(255) DEFAULT NULL,
  `last_email_sent` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_newsletter_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `newsletter_subscribers`
--

LOCK TABLES `newsletter_subscribers` WRITE;
/*!40000 ALTER TABLE `newsletter_subscribers` DISABLE KEYS */;
INSERT INTO `newsletter_subscribers` VALUES (2,'msaadi3806@gmail.com','2026-06-30 11:14:44',1,'active',NULL,NULL,'2026-06-30 11:14:44','2026-06-30 11:14:44'),(3,'muneebse65@gmail.com','2026-06-30 11:14:44',1,'active',NULL,NULL,'2026-06-30 11:14:44','2026-06-30 11:14:44'),(4,'smpakistan2004@gmail.com','2026-06-30 11:14:44',1,'active',NULL,NULL,'2026-06-30 11:14:44','2026-06-30 11:14:44'),(5,'mhasop997@gmail.com','2026-06-30 11:14:44',1,'active',NULL,NULL,'2026-06-30 11:14:44','2026-06-30 11:14:44'),(6,'workvault.7@gmail.com','2026-07-06 15:18:54',1,'active','984da90016b3bac6b52dc74a8410efe8f725c8b59f7a4e258d49426703423097',NULL,'2026-07-06 15:18:54','2026-07-06 15:18:54'),(7,'nadeem@iiu.edu.pk','2026-07-06 15:20:32',1,'active','fa4f99ac3f6f6c6f1f0347aa9c9f7e81589c8a3d9e8bb6f770710d4620135bb9',NULL,'2026-07-06 15:20:32','2026-07-06 15:20:32'),(8,'snpakistan80@gmail.com','2026-07-06 15:22:09',1,'active','66bbe442cc3bfe7ed3cec9c43f9b459bf015a678ff4320671b4440e1967288f2',NULL,'2026-07-06 15:22:09','2026-07-06 15:22:09'),(9,'hellomelo@gmail.com','2026-07-07 13:42:01',1,'active','3513f931c5305d0476558b89965176e052e12968131f5e4503a6f7e954ef9556',NULL,'2026-07-07 13:42:01','2026-07-07 13:42:01');
/*!40000 ALTER TABLE `newsletter_subscribers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `text` text NOT NULL,
  `type` varchar(50) NOT NULL,
  `is_read` tinyint(4) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `role` varchar(20) NOT NULL DEFAULT 'student',
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_role_created` (`user_id`,`role`,`created_at`),
  KEY `idx_notifications_role_created` (`role`,`created_at`),
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=86 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,NULL,'New Course Added!','A new course \"All-in-one Mathematics\" is now available.','course',1,'2026-06-29 18:23:31','student'),(2,NULL,'New Resource Uploaded','Study Sheet: Formula Sheet','resource',1,'2026-06-29 18:24:58','student'),(3,NULL,'New Video Added','New Lecture: Class 12 Math New Book 2026 Unit 1 Exercise 1.3 Complete Solution | Ex 1.3 Class 12th | Punjab Board','video',1,'2026-06-29 18:26:24','student'),(4,NULL,'New Announcement Published','1st year result has been declared','announcement',1,'2026-06-29 18:28:46','student'),(5,NULL,'New Student Registered','Student Muhammad Saad (msaadi3806@gmail.com) has joined the platform.','registration',1,'2026-06-29 18:30:37','admin'),(7,NULL,'New Course Enrollment','Student msaadi3806@gmail.com enrolled in \"All-in-one Mathematics\".','enrollment',1,'2026-06-29 18:34:00','admin'),(8,NULL,'New Announcement Published','nkiiknfgjhgigi','announcement',1,'2026-06-29 18:44:06','student'),(9,NULL,'New Student Registered','Student Muhammad Saad (saad.procoder@gmail.com) has joined the platform.','registration',1,'2026-06-30 04:17:01','admin'),(11,NULL,'New Course Enrollment','Student saad.procoder@gmail.com enrolled in \"All-in-one Mathematics\".','enrollment',1,'2026-06-30 04:17:13','admin'),(13,NULL,'New Unban Request','Student Muhammad Saad (saad.procoder@gmail.com) has submitted an unban appeal.','unban_request',1,'2026-06-30 04:58:22','admin'),(17,NULL,'New Student Registered','Student Muhammad Saad (msaadi8306@gmail.com) has joined the platform.','registration',1,'2026-06-30 06:10:52','admin'),(18,NULL,'New Course Added!','A new course \"All-in-one Course\" is now available.','course',1,'2026-06-30 06:16:50','student'),(19,NULL,'New Resource Uploaded','Study Sheet: Algebra','resource',1,'2026-06-30 06:18:36','student'),(20,NULL,'New Video Added','New Lecture: Review Ex 9 || Solution of Trigonometric Equation || 12th Maths || NBF 2026 || Calculus Corner','video',1,'2026-06-30 06:19:12','student'),(21,NULL,'New Announcement Published','11 Result has been declared.','announcement',1,'2026-06-30 06:21:15','student'),(23,NULL,'New Course Enrollment','Student msaadi8306@gmail.com enrolled in \"All-in-one Course\".','enrollment',1,'2026-06-30 06:22:14','admin'),(27,NULL,'New Student Registered','Student Haseeb (mhasop997@gmail.com) has joined the platform.','registration',1,'2026-06-30 07:55:06','admin'),(28,NULL,'New Course Added!','A new course \"All-in-one\" is now available.','course',1,'2026-06-30 09:28:12','student'),(30,NULL,'Quiz Completed','Student msaadi8306@gmail.com completed a quiz: score 0/10.','quiz_submission',1,'2026-06-30 09:36:44','admin'),(31,NULL,'New Course Added!','A new course \"Calculus\" is now available.','course',1,'2026-06-30 09:51:52','student'),(32,NULL,'New Course Added!','A new course \"djfkj\" is now available.','course',1,'2026-06-30 09:59:32','student'),(33,NULL,'New Course Added!','A new course \"QQQ\" is now available.','course',1,'2026-06-30 10:01:00','student'),(34,NULL,'New Resource Uploaded','Study Sheet: Mat','resource',1,'2026-06-30 10:03:55','student'),(35,NULL,'New Resource Uploaded','Study Sheet: aa','resource',1,'2026-06-30 10:07:01','student'),(36,NULL,'New Resource Uploaded','Study Sheet: aa','resource',1,'2026-06-30 10:08:31','student'),(37,NULL,'New Student Review','Haseeb submitted a new review. Pending approval.','testimonial',1,'2026-06-30 10:49:17','admin'),(38,NULL,'New Student Review','Haseeb submitted a new review. Pending approval.','testimonial',1,'2026-06-30 11:00:33','admin'),(39,NULL,'New Student Registered','Student Saad (msaadi3806@gmail.com) has joined the platform.','registration',1,'2026-07-06 15:11:12','admin'),(40,NULL,'New Video Added','New Lecture: Ex 1.5 class 11 Math New Book 2026 Unit 1 complete solution | Ex 1.5 Class 11 | Punjab Board | PTCB','video',1,'2026-07-06 15:15:37','student'),(41,NULL,'New Announcement Published','ii','announcement',1,'2026-07-06 15:17:10','student'),(42,NULL,'New Announcement Published','11 class result has been declared...','announcement',1,'2026-07-06 15:22:58','student'),(43,5,'Course Enrollment Confirmed','You have been successfully enrolled in \"Mastering Limits & Continuity\".','course',1,'2026-07-06 15:27:26','student'),(44,NULL,'New Course Enrollment','Student msaadi3806@gmail.com enrolled in \"Mastering Limits & Continuity\".','enrollment',1,'2026-07-06 15:27:26','admin'),(45,5,'Enrollment Approved','Your enrollment in \"Mastering Limits & Continuity\" has been approved!','enrollment',1,'2026-07-06 15:27:35','student'),(46,NULL,'Certificate Request','Student msaadi3806@gmail.com requested a certificate for \"Mastering Limits & Continuity\".','enrollment',1,'2026-07-06 15:27:58','admin'),(47,5,'Certificate Issued','Your certificate for \"Mastering Limits & Continuity\" has been issued!','certificate',1,'2026-07-06 15:28:01','student'),(48,NULL,'Certificate Request','Student msaadi3806@gmail.com requested a certificate for \"Mastering Limits & Continuity\".','enrollment',1,'2026-07-06 15:28:18','admin'),(49,5,'Certificate Issued','Your certificate for \"Mastering Limits & Continuity\" has been issued!','certificate',1,'2026-07-06 15:28:26','student'),(50,NULL,'Certificate Request','Student msaadi3806@gmail.com requested a certificate for \"Mastering Limits & Continuity\".','enrollment',1,'2026-07-06 15:29:37','admin'),(51,5,'Certificate Issued','Your certificate for \"Mastering Limits & Continuity\" has been issued!','certificate',1,'2026-07-06 15:29:41','student'),(52,NULL,'Certificate Request','Student msaadi3806@gmail.com requested a certificate for \"Mastering Limits & Continuity\".','enrollment',1,'2026-07-06 15:30:01','admin'),(53,5,'Certificate Request Rejected','Your certificate request for \"Mastering Limits & Continuity\" has been rejected.','certificate',1,'2026-07-06 15:30:09','student'),(54,5,'Course Enrollment Confirmed','You have been successfully enrolled in \"Advanced Derivatives\".','course',1,'2026-07-06 15:31:05','student'),(55,NULL,'New Course Enrollment','Student msaadi3806@gmail.com enrolled in \"Advanced Derivatives\".','enrollment',1,'2026-07-06 15:31:05','admin'),(56,5,'Enrollment Approved','Your enrollment in \"Advanced Derivatives\" has been approved!','enrollment',1,'2026-07-06 15:31:11','student'),(57,NULL,'Certificate Request','Student msaadi3806@gmail.com requested a certificate for \"Advanced Derivatives\".','enrollment',1,'2026-07-06 15:31:46','admin'),(58,5,'Certificate Issued','Your certificate for \"Advanced Derivatives\" has been issued!','certificate',1,'2026-07-06 15:31:52','student'),(59,NULL,'New Announcement Published','hello testing','announcement',1,'2026-07-06 15:39:53','student'),(60,NULL,'New Student Registered','Student Emily Torus (sibylpeach@tohru.org) has joined the platform.','registration',1,'2026-07-06 18:06:00','admin'),(61,NULL,'New Student Registered','Student Faisal Iqbal (faisaliqbal.numl@gmail.com) has joined the platform.','registration',1,'2026-07-06 18:08:05','admin'),(62,6,'New Message from Emily Torus','Hi....','support',1,'2026-07-06 18:08:06','admin'),(63,7,'New Achievement Unlocked!','Congratulations! You earned the \"First Attempt\" badge: Awarded after completing your first quiz attempt!','badge',1,'2026-07-06 18:08:08','student'),(64,NULL,'Quiz Completed','Student faisaliqbal.numl@gmail.com completed a quiz: score 5/10.','quiz_submission',1,'2026-07-06 18:08:08','admin'),(65,NULL,'New Video Added','New Lecture: Class 12 Math New Book 2026 Unit 1 Exercise 1.3 Complete Solution | Ex 1.3 Class 12th | Punjab Board','video',1,'2026-07-07 07:18:03','student'),(66,NULL,'New Announcement Published','HSSC-I result has been declared','announcement',1,'2026-07-07 07:20:15','student'),(67,NULL,'New Announcement Published','HSSC-II result has been declared','announcement',1,'2026-07-07 07:20:37','student'),(68,NULL,'New Student Registered','Student Saad (saad.procoder@gmail.com) has joined the platform.','registration',1,'2026-07-07 07:25:00','admin'),(69,8,'Course Enrollment Confirmed','You have been successfully enrolled in \"Mastering Limits & Continuity\".','course',0,'2026-07-07 07:25:24','student'),(70,NULL,'New Course Enrollment','Student saad.procoder@gmail.com enrolled in \"Mastering Limits & Continuity\".','enrollment',1,'2026-07-07 07:25:24','admin'),(71,8,'Enrollment Approved','Your enrollment in \"Mastering Limits & Continuity\" has been approved!','enrollment',0,'2026-07-07 07:25:44','student'),(72,NULL,'Certificate Request','Student saad.procoder@gmail.com requested a certificate for \"Mastering Limits & Continuity\".','enrollment',1,'2026-07-07 07:26:16','admin'),(73,8,'Certificate Issued','Your certificate for \"Mastering Limits & Continuity\" has been issued!','certificate',0,'2026-07-07 07:26:24','student'),(74,NULL,'New Resource Uploaded','Study Sheet: Test Notes','resource',1,'2026-07-07 10:23:58','student'),(75,NULL,'New Student Registered','Student servercheck (jabhi5388@gmail.com) has joined the platform.','registration',1,'2026-07-07 10:45:20','admin'),(76,NULL,'New Student Registered','Student servercheck (jabhi538d8@gmail.com) has joined the platform.','registration',1,'2026-07-07 11:53:36','admin'),(77,5,'New Achievement Unlocked!','Congratulations! You earned the \"First Attempt\" badge: Awarded after completing your first quiz attempt!','badge',0,'2026-07-08 10:22:10','student'),(78,5,'New Achievement Unlocked!','Congratulations! You earned the \"Consistency Badge\" badge: Completed 5 quiz assessments!','badge',0,'2026-07-08 10:22:10','student'),(79,NULL,'Quiz Completed','Student msaadi3806@gmail.com completed a quiz: score 1/5.','quiz_submission',1,'2026-07-08 10:22:10','admin'),(80,NULL,'New Video Added','New Lecture: Ex 1.5 class 11 Math New Book 2026 Unit 1 complete solution | Ex 1.5 Class 11 | Punjab Board | PTCB','video',1,'2026-07-08 12:02:44','student'),(81,NULL,'New Resource Uploaded','Study Sheet: 11 English','resource',1,'2026-07-08 12:29:06','student'),(82,NULL,'New Announcement Published','declared','announcement',1,'2026-07-08 12:29:46','student'),(83,NULL,'New Student Registered','Student SixAlps Agency (sixalps.agency@gmail.com) has joined the platform.','registration',1,'2026-07-08 18:01:28','admin'),(84,NULL,'New Student Registered','Student Dineflow (smpakistan2004@gmail.com) has joined the platform.','registration',1,'2026-07-09 00:55:49','admin'),(85,NULL,'New Resource Uploaded','Study Sheet: FBISE Chapter 1 Complex Number','resource',0,'2026-07-09 05:14:30','student');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `question_pool`
--

DROP TABLE IF EXISTS `question_pool`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `question_pool` (
  `id` varchar(50) NOT NULL,
  `topic` varchar(100) NOT NULL,
  `question` text NOT NULL,
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`options`)),
  `correctAnswer` varchar(255) NOT NULL,
  `difficulty` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_question_pool_topic` (`topic`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `question_pool`
--

LOCK TABLES `question_pool` WRITE;
/*!40000 ALTER TABLE `question_pool` DISABLE KEYS */;
INSERT INTO `question_pool` VALUES ('q_1_1782818083884','Derivatives','What is the derivative of f(x) = 1x^3 + 2x?','[\"3x^2 + 2\",\"1x^2 + 2\",\"3x^2\",\"2\"]','3x^2 + 2','Medium','2026-06-30 11:14:43'),('q_10_1782818083884','Derivatives','What is the derivative of f(x) = 10x^3 + 20x?','[\"30x^2 + 20\",\"10x^2 + 20\",\"30x^2\",\"20\"]','30x^2 + 20','Medium','2026-06-30 11:14:43'),('q_11_1782818083884','Integrals','Evaluate the integral of f(x) = 11x dx','[\"5.5x^2 + C\",\"11x^2 + C\",\"22x + C\",\"11x + C\"]','5.5x^2 + C','Hard','2026-06-30 11:14:43'),('q_12_1782818083884','Limits','Evaluate the limit: lim (x -> 12) of (x^2 - 144) / (x - 12)','[\"12\",\"24\",\"144\",\"Undefined\"]','24','Easy','2026-06-30 11:14:43'),('q_13_1782818083884','Derivatives','What is the derivative of f(x) = 13x^3 + 26x?','[\"39x^2 + 26\",\"13x^2 + 26\",\"39x^2\",\"26\"]','39x^2 + 26','Medium','2026-06-30 11:14:43'),('q_14_1782818083884','Integrals','Evaluate the integral of f(x) = 14x dx','[\"7x^2 + C\",\"14x^2 + C\",\"28x + C\",\"14x + C\"]','7x^2 + C','Hard','2026-06-30 11:14:43'),('q_15_1782818083884','Limits','Evaluate the limit: lim (x -> 15) of (x^2 - 225) / (x - 15)','[\"15\",\"30\",\"225\",\"Undefined\"]','30','Easy','2026-06-30 11:14:43'),('q_16_1782818083884','Derivatives','What is the derivative of f(x) = 16x^3 + 32x?','[\"48x^2 + 32\",\"16x^2 + 32\",\"48x^2\",\"32\"]','48x^2 + 32','Medium','2026-06-30 11:14:43'),('q_17_1782818083884','Integrals','Evaluate the integral of f(x) = 17x dx','[\"8.5x^2 + C\",\"17x^2 + C\",\"34x + C\",\"17x + C\"]','8.5x^2 + C','Hard','2026-06-30 11:14:43'),('q_1783482981303_wbp54si2i','Addition','2+2','[\"1\",\"2\",\"3\",\"4\"]','4','medium','2026-07-08 03:56:21'),('q_18_1782818083884','Limits','Evaluate the limit: lim (x -> 18) of (x^2 - 324) / (x - 18)','[\"18\",\"36\",\"324\",\"Undefined\"]','36','Easy','2026-06-30 11:14:43'),('q_19_1782818083884','Derivatives','What is the derivative of f(x) = 19x^3 + 38x?','[\"57x^2 + 38\",\"19x^2 + 38\",\"57x^2\",\"38\"]','57x^2 + 38','Medium','2026-06-30 11:14:43'),('q_2_1782818083884','Integrals','Evaluate the integral of f(x) = 2x dx','[\"1x^2 + C\",\"2x^2 + C\",\"4x + C\",\"2x + C\"]','1x^2 + C','Hard','2026-06-30 11:14:43'),('q_20_1782818083884','Integrals','Evaluate the integral of f(x) = 20x dx','[\"10x^2 + C\",\"20x^2 + C\",\"40x + C\",\"20x + C\"]','10x^2 + C','Hard','2026-06-30 11:14:43'),('q_21_1782818083884','Limits','Evaluate the limit: lim (x -> 21) of (x^2 - 441) / (x - 21)','[\"21\",\"42\",\"441\",\"Undefined\"]','42','Easy','2026-06-30 11:14:43'),('q_22_1782818083884','Derivatives','What is the derivative of f(x) = 22x^3 + 44x?','[\"66x^2 + 44\",\"22x^2 + 44\",\"66x^2\",\"44\"]','66x^2 + 44','Medium','2026-06-30 11:14:44'),('q_23_1782818083884','Integrals','Evaluate the integral of f(x) = 23x dx','[\"11.5x^2 + C\",\"23x^2 + C\",\"46x + C\",\"23x + C\"]','11.5x^2 + C','Hard','2026-06-30 11:14:44'),('q_24_1782818083884','Limits','Evaluate the limit: lim (x -> 24) of (x^2 - 576) / (x - 24)','[\"24\",\"48\",\"576\",\"Undefined\"]','48','Easy','2026-06-30 11:14:44'),('q_25_1782818083884','Derivatives','What is the derivative of f(x) = 25x^3 + 50x?','[\"75x^2 + 50\",\"25x^2 + 50\",\"75x^2\",\"50\"]','75x^2 + 50','Medium','2026-06-30 11:14:44'),('q_26_1782818083884','Integrals','Evaluate the integral of f(x) = 26x dx','[\"13x^2 + C\",\"26x^2 + C\",\"52x + C\",\"26x + C\"]','13x^2 + C','Hard','2026-06-30 11:14:44'),('q_27_1782818083884','Limits','Evaluate the limit: lim (x -> 27) of (x^2 - 729) / (x - 27)','[\"27\",\"54\",\"729\",\"Undefined\"]','54','Easy','2026-06-30 11:14:44'),('q_28_1782818083884','Derivatives','What is the derivative of f(x) = 28x^3 + 56x?','[\"84x^2 + 56\",\"28x^2 + 56\",\"84x^2\",\"56\"]','84x^2 + 56','Medium','2026-06-30 11:14:44'),('q_29_1782818083884','Integrals','Evaluate the integral of f(x) = 29x dx','[\"14.5x^2 + C\",\"29x^2 + C\",\"58x + C\",\"29x + C\"]','14.5x^2 + C','Hard','2026-06-30 11:14:44'),('q_3_1782818083884','Limits','Evaluate the limit: lim (x -> 3) of (x^2 - 9) / (x - 3)','[\"3\",\"6\",\"9\",\"Undefined\"]','6','Easy','2026-06-30 11:14:43'),('q_30_1782818083884','Limits','Evaluate the limit: lim (x -> 30) of (x^2 - 900) / (x - 30)','[\"30\",\"60\",\"900\",\"Undefined\"]','60','Easy','2026-06-30 11:14:44'),('q_4_1782818083884','Derivatives','What is the derivative of f(x) = 4x^3 + 8x?','[\"12x^2 + 8\",\"4x^2 + 8\",\"12x^2\",\"8\"]','12x^2 + 8','Medium','2026-06-30 11:14:43'),('q_5_1782818083884','Integrals','Evaluate the integral of f(x) = 5x dx','[\"2.5x^2 + C\",\"5x^2 + C\",\"10x + C\",\"5x + C\"]','2.5x^2 + C','Hard','2026-06-30 11:14:43'),('q_6_1782818083884','Limits','Evaluate the limit: lim (x -> 6) of (x^2 - 36) / (x - 6)','[\"6\",\"12\",\"36\",\"Undefined\"]','12','Easy','2026-06-30 11:14:43'),('q_7_1782818083884','Derivatives','What is the derivative of f(x) = 7x^3 + 14x?','[\"21x^2 + 14\",\"7x^2 + 14\",\"21x^2\",\"14\"]','21x^2 + 14','Medium','2026-06-30 11:14:43'),('q_8_1782818083884','Integrals','Evaluate the integral of f(x) = 8x dx','[\"4x^2 + C\",\"8x^2 + C\",\"16x + C\",\"8x + C\"]','4x^2 + C','Hard','2026-06-30 11:14:43'),('q_9_1782818083884','Limits','Evaluate the limit: lim (x -> 9) of (x^2 - 81) / (x - 9)','[\"9\",\"18\",\"81\",\"Undefined\"]','18','Easy','2026-06-30 11:14:43');
/*!40000 ALTER TABLE `question_pool` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quiz_attempts`
--

DROP TABLE IF EXISTS `quiz_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `quiz_attempts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `score` int(11) NOT NULL,
  `totalQuestions` int(11) NOT NULL,
  `percentage` decimal(5,2) NOT NULL,
  `answers` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`answers`)),
  `timeTaken` int(11) NOT NULL,
  `quizType` varchar(50) NOT NULL,
  `topic` varchar(100) DEFAULT NULL,
  `completedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_quiz_attempts_user_date` (`userId`,`completedAt`),
  CONSTRAINT `fk_quiz_attempts_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quiz_attempts`
--

LOCK TABLES `quiz_attempts` WRITE;
/*!40000 ALTER TABLE `quiz_attempts` DISABLE KEYS */;
INSERT INTO `quiz_attempts` VALUES (8,5,1,1,100.00,'[{\"questionId\":0,\"selectedAnswer\":\"4\",\"correctAnswer\":\"4\",\"isCorrect\":true}]',0,'course_final','10','2026-07-06 15:27:55'),(9,5,1,1,100.00,'[{\"questionId\":0,\"selectedAnswer\":\"4\",\"correctAnswer\":\"4\",\"isCorrect\":true}]',0,'course_final','10','2026-07-06 15:28:13'),(10,5,1,1,100.00,'[{\"questionId\":0,\"selectedAnswer\":\"4\",\"correctAnswer\":\"4\",\"isCorrect\":true}]',0,'course_final','10','2026-07-06 15:29:34'),(11,5,1,1,100.00,'[{\"questionId\":0,\"selectedAnswer\":\"4\",\"correctAnswer\":\"4\",\"isCorrect\":true}]',0,'course_final','10','2026-07-06 15:29:52'),(12,5,1,1,100.00,'[{\"questionId\":0,\"selectedAnswer\":\"4\",\"correctAnswer\":\"4\",\"isCorrect\":true}]',0,'course_final','10','2026-07-06 15:30:38'),(13,5,1,1,100.00,'[{\"questionId\":0,\"selectedAnswer\":\"5\",\"correctAnswer\":\"5\",\"isCorrect\":true}]',0,'course_final','11','2026-07-06 15:31:42'),(14,7,5,10,50.00,'[{\"questionId\":\"q_22_1782818083884\",\"selectedAnswer\":\"44\",\"correctAnswer\":\"66x^2 + 44\",\"isCorrect\":false},{\"questionId\":\"q_25_1782818083884\",\"selectedAnswer\":\"50\",\"correctAnswer\":\"75x^2 + 50\",\"isCorrect\":false},{\"questionId\":\"q_1_1782818083884\",\"selectedAnswer\":\"3x^2 + 2\",\"correctAnswer\":\"3x^2 + 2\",\"isCorrect\":true},{\"questionId\":\"q_10_1782818083884\",\"selectedAnswer\":\"30x^2 + 20\",\"correctAnswer\":\"30x^2 + 20\",\"isCorrect\":true},{\"questionId\":\"q_4_1782818083884\",\"selectedAnswer\":\"8\",\"correctAnswer\":\"12x^2 + 8\",\"isCorrect\":false},{\"questionId\":\"q_16_1782818083884\",\"selectedAnswer\":\"16x^2 + 32\",\"correctAnswer\":\"48x^2 + 32\",\"isCorrect\":false},{\"questionId\":\"q_13_1782818083884\",\"selectedAnswer\":\"13x^2 + 26\",\"correctAnswer\":\"39x^2 + 26\",\"isCorrect\":false},{\"questionId\":\"q_28_1782818083884\",\"selectedAnswer\":\"84x^2 + 56\",\"correctAnswer\":\"84x^2 + 56\",\"isCorrect\":true},{\"questionId\":\"q_19_1782818083884\",\"selectedAnswer\":\"57x^2 + 38\",\"correctAnswer\":\"57x^2 + 38\",\"isCorrect\":true},{\"questionId\":\"q_7_1782818083884\",\"selectedAnswer\":\"21x^2 + 14\",\"correctAnswer\":\"21x^2 + 14\",\"isCorrect\":true}]',26,'timed','Derivatives','2026-07-06 18:08:08'),(15,8,1,1,100.00,'[{\"questionId\":0,\"selectedAnswer\":\"4\",\"correctAnswer\":\"4\",\"isCorrect\":true}]',0,'course_final','10','2026-07-07 07:26:06'),(16,5,1,5,20.00,'[{\"questionId\":\"q_7_1782818083884\",\"selectedAnswer\":\"21x^2 + 14\",\"correctAnswer\":\"21x^2 + 14\",\"isCorrect\":true},{\"questionId\":\"q_1_1782818083884\",\"selectedAnswer\":\"3x^2\",\"correctAnswer\":\"3x^2 + 2\",\"isCorrect\":false},{\"questionId\":\"q_10_1782818083884\",\"selectedAnswer\":\"10x^2 + 20\",\"correctAnswer\":\"30x^2 + 20\",\"isCorrect\":false},{\"questionId\":\"q_4_1782818083884\",\"selectedAnswer\":\"8\",\"correctAnswer\":\"12x^2 + 8\",\"isCorrect\":false},{\"questionId\":\"q_19_1782818083884\",\"selectedAnswer\":\"19x^2 + 38\",\"correctAnswer\":\"57x^2 + 38\",\"isCorrect\":false}]',10,'topic','Derivatives','2026-07-08 10:22:10');
/*!40000 ALTER TABLE `quiz_attempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `resources`
--

DROP TABLE IF EXISTS `resources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `resources` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `file_url` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `original_filename` varchar(255) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `category` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `resources`
--

LOCK TABLES `resources` WRITE;
/*!40000 ALTER TABLE `resources` DISABLE KEYS */;
INSERT INTO `resources` VALUES (11,'FBISE Chapter 1 Complex Number','/uploads/resources/1783574070220-98275237-Ex_1.1_NBF_11th_maths.pdf','2026-07-09 05:14:30','Ex 1.1 NBF 11th maths.pdf','{\"size_bytes\":3813771,\"extension\":\"pdf\",\"mime_type\":\"application/pdf\"}','Grade 11');
/*!40000 ALTER TABLE `resources` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `site_content`
--

DROP TABLE IF EXISTS `site_content`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `site_content` (
  `section_name` varchar(50) NOT NULL,
  `content_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`content_data`)),
  PRIMARY KEY (`section_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_content`
--

LOCK TABLES `site_content` WRITE;
/*!40000 ALTER TABLE `site_content` DISABLE KEYS */;
INSERT INTO `site_content` VALUES ('about','{\"badge\":\"About Us\",\"heading\":\"Transforming Math Anxiety into\",\"heading_gradient\":\"Mathematical Mastery\",\"paragraph1\":\"Calculus Corner is more than just a tutoring platform. We are a dedicated educational hub designed to make complex mathematical concepts intuitive, engaging, and accessible to everyone. Our mission is to build foundational strength that lasts a lifetime.\",\"paragraph2\":\"\",\"image_url\":\"/uploads/images/1783505153682-959636645.png\"}'),('announcements','[{\"id\":1,\"text\":\"🎉 New Course on Multivariable Calculus dropping next week! Early bird discount available.\",\"isActive\":true},{\"id\":2,\"text\":\"📢 Scheduled Maintenance: The site will be down for 2 hours on Sunday at 2 AM EST.\",\"isActive\":true},{\"id\":3,\"text\":\"💡 Tip of the week: Always double check your constants of integration (+C)!\",\"isActive\":true}]'),('bank_details','{\"account_name\": \"Calculus Corner Admin\", \"account_number\": \"1234-5678-9012\", \"bank_name\": \"Standard Chartered\"}'),('certificate','{\"price\":\"500\"}'),('contact','{\"email\":\"Thecalculuscornerofficial@gmail.com\",\"phone\":\"+92 302 8983263\",\"address\":\"Islamabad, Pakistan\",\"facebook_url\":\"#\",\"twitter_url\":\"#\",\"instagram_url\":\"#\",\"youtube_url\":\"#\",\"whatsapp_number\":\"\"}'),('logo','{\"logo_url\":\"http://localhost:5000/uploads/logo/logo-1783573159027-973198481.png\"}');
/*!40000 ALTER TABLE `site_content` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students_profile`
--

DROP TABLE IF EXISTS `students_profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `students_profile` (
  `user_id` int(11) NOT NULL,
  `bio` text DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `progress` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`progress`)),
  PRIMARY KEY (`user_id`),
  CONSTRAINT `fk_student_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students_profile`
--

LOCK TABLES `students_profile` WRITE;
/*!40000 ALTER TABLE `students_profile` DISABLE KEYS */;
INSERT INTO `students_profile` VALUES (5,'','/uploads/images/img-1783506562508-735891380.jpg','{}'),(6,NULL,NULL,'{}'),(7,NULL,NULL,'{}'),(8,NULL,NULL,'{}'),(9,NULL,NULL,'{}'),(12,NULL,NULL,'{}');
/*!40000 ALTER TABLE `students_profile` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subjects`
--

DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `subjects` (
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_subject_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subjects`
--

LOCK TABLES `subjects` WRITE;
/*!40000 ALTER TABLE `subjects` DISABLE KEYS */;
INSERT INTO `subjects` VALUES (1,'trigonometry','Trigonometry','Go from basic angle ratios all the way to complex trig functions, with clear examples at every step.','Core Foundation','TriangleRight','bg-pink-50 text-pink-600','Trigonometry Mastery | Calculus Corner','Master trigonometry with our comprehensive guide covering everything from basic ratios to complex identities.','Trigonometry is the branch of mathematics that studies relationships involving lengths and angles of triangles. It is essential for understanding waves, oscillations, and geometry in multidimensional spaces.','Trigonometry is the foundation for advanced calculus, physics, and engineering. Without it, modeling periodic phenomena like sound waves, light, or alternating current would be impossible.','[\"Right-Angled Triangles (SOH CAH TOA)\",\"The Unit Circle and Radian Measure\",\"Graphing Sine, Cosine, and Tangent\",\"Trigonometric Identities and Proofs\",\"Law of Sines and Law of Cosines\",\"Inverse Trigonometric Functions\"]','High school students in grades 10-12 preparing for pre-calculus, AP Physics, or college-level engineering courses.','We break down complex identities into easy-to-understand, step-by-step proofs and provide interactive practice problems to help you memorize the unit circle effortlessly','[\"Fluently convert between degrees and radians.\",\"Solve missing sides and angles in any triangle.\",\"Prove complex trigonometric identities.\",\"Graph and transform trigonometric functions accurately.\"]','[\"Memorize the exact values of sine, cosine, and tangent for key angles (30, 45, 60).\",\"Always check if your calculator is in Degree or Radian mode before an exam.\",\"When proving identities, try converting everything to sine and cosine first.\"]','Medium','Angles and Periodic Functions','Grade 10-11','4-5 hours / week','trigonometry','[\"algebra\",\"geometry\",\"calculus\"]','2026-06-30 03:26:35'),(2,'algebra','Algebra','Build a solid base in equations, inequalities, and functions — the foundation everything else is built on.','Core Subject','FunctionSquare','bg-blue-50 text-blue-600','Algebra Mastery | Calculus Corner','Learn everything about Algebra from simple equations to complex polynomials.','Algebra is the gateway to advanced mathematics. It introduces the concept of using letters to represent unknown numbers.','It develops logical thinking and problem-solving skills necessary for science, engineering, and everyday life.','[\"Linear Equations\",\"Quadratic Functions\",\"Polynomials\",\"Exponentials and Logarithms\"]','Students beginning their high school math journey.','We provide clear, step-by-step solutions to complex algebraic equations.','[\"Solve equations with multiple variables.\",\"Graph linear and quadratic functions.\",\"Factor complex polynomials.\"]','[\"Always double check your negative signs.\",\"Memorize the quadratic formula.\"]','Medium','Equations & Graphs','Grade 9-10','3-4 hours / week','algebra','[\"trigonometry\",\"calculus\"]','2026-06-30 03:28:50'),(3,'calculus','Calculus','Get comfortable with limits, derivatives, and integrals through lessons that make the concepts click.','Advanced Level','InfinityIcon','bg-amber-50 text-amber-600','Calculus Mastery | Calculus Corner','Master the principles of continuous change, limits, derivatives, and integrals.','Calculus is the mathematical study of continuous change. It has two major branches: differential calculus and integral calculus.','Calculus is essential for physics, engineering, economics, and computer science.','[\"Limits and Continuity\",\"Derivatives\",\"Applications of Derivatives\",\"Integrals\",\"Applications of Integration\"]','Advanced high school students and college freshmen.','We use interactive animations and detailed step-by-step proofs to demystify complex calculus concepts.','[\"Evaluate complex limits.\",\"Differentiate and integrate transcendental functions.\",\"Apply calculus to real-world physics problems.\"]','[\"Practice the chain rule until it becomes second nature.\",\"Draw pictures for related rates and optimization problems.\"]','Hard','Rates of Change','Grade 11-12','5-7 hours / week','calculus','[\"algebra\",\"trigonometry\"]','2026-06-30 03:28:50');
/*!40000 ALTER TABLE `subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `support_messages`
--

DROP TABLE IF EXISTS `support_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `support_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `sender_role` varchar(20) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `idx_support_messages_student_created` (`student_id`,`created_at`),
  CONSTRAINT `fk_support_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `support_messages`
--

LOCK TABLES `support_messages` WRITE;
/*!40000 ALTER TABLE `support_messages` DISABLE KEYS */;
INSERT INTO `support_messages` VALUES (9,6,'student','Hi.','2026-07-06 18:08:06');
/*!40000 ALTER TABLE `support_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `testimonials`
--

DROP TABLE IF EXISTS `testimonials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `testimonials` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `role` varchar(150) NOT NULL,
  `text` text NOT NULL,
  `rating` int(11) NOT NULL DEFAULT 5,
  `student_id` int(11) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'approved',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_testimonial_student` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `testimonials`
--

LOCK TABLES `testimonials` WRITE;
/*!40000 ALTER TABLE `testimonials` DISABLE KEYS */;
INSERT INTO `testimonials` VALUES (5,'Sarah Jenkins','AP Calculus Student','This platform completely changed how I look at math. The visual explanations of derivatives made everything click for me! I finally scored an A on my exam.',5,NULL,'approved'),(6,'David Chen','Engineering Freshman','The resources and practice quizzes are top-notch. The integration techniques module saved my grade in University Calc II.',5,NULL,'approved'),(7,'Emily Davis','High School Junior','I loved the video lectures! They are concise and right to the point. The UI is also super clean and easy to navigate.',4,NULL,'approved');
/*!40000 ALTER TABLE `testimonials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `unban_requests`
--

DROP TABLE IF EXISTS `unban_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `unban_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_unban_requests_student_created` (`student_id`,`created_at`),
  KEY `idx_unban_requests_status_created` (`status`,`created_at`),
  CONSTRAINT `fk_unban_student_new` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unban_requests`
--

LOCK TABLES `unban_requests` WRITE;
/*!40000 ALTER TABLE `unban_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `unban_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_badges`
--

DROP TABLE IF EXISTS `user_badges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_badges` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `badgeName` varchar(100) NOT NULL,
  `earnedAt` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_badges_user_earned` (`userId`,`earnedAt`),
  CONSTRAINT `fk_user_badges_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_badges`
--

LOCK TABLES `user_badges` WRITE;
/*!40000 ALTER TABLE `user_badges` DISABLE KEYS */;
INSERT INTO `user_badges` VALUES (2,7,'First Attempt','2026-07-06 18:08:08'),(3,5,'First Attempt','2026-07-08 10:22:10'),(4,5,'Consistency Badge','2026-07-08 10:22:10');
/*!40000 ALTER TABLE `user_badges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (5,'Saad','msaadi3806@gmail.com','$2b$10$RwuOS/VwYUAY6qU4RgOW/OFbZ0y.WQAT7C7nVsGiw5gzopKjQIos2','student','2026-07-06 15:11:12','active',0,NULL,NULL,NULL,0),(6,'Emily Torus','sibylpeach@tohru.org','$2b$10$YfhgugGYRMroOd0Lw5ex/O4UoxXtF4IpHrlSsZkyD0LB2xCWikJdu','student','2026-07-06 18:06:00','active',0,NULL,NULL,NULL,0),(7,'Faisal Iqbal','faisaliqbal.numl@gmail.com','$2b$10$jkQTlxEuTmNzyrCLLJQ9F.9RtLCk1iM.S8rv/7jo2obekm6z/KPf2','student','2026-07-06 18:08:05','active',0,NULL,NULL,NULL,0),(8,'Saad','saad.procoder@gmail.com','$2b$10$BxQRZx2heo.vTHUj0CNBw.3im6ilumB9QN7sWsqw6xOFLnlyD7rQi','student','2026-07-07 07:25:00','active',0,NULL,NULL,NULL,0),(9,'servercheck','jabhi5388@gmail.com','$2b$10$N9G3fBVefkTyn52869ZSB.QP.FFTG07mPp3PFCT1G4NL5PAFPv.V2','student','2026-07-07 10:45:20','active',0,NULL,NULL,NULL,0),(12,'Dineflow','smpakistan2004@gmail.com','$2b$10$H1N1XdUwtt/DOL2bgAzGBeffSF6RUk3sD6Po2D/f2l1qJDMxwmT52','student','2026-07-09 00:55:49','active',0,NULL,NULL,NULL,0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `videos`
--

DROP TABLE IF EXISTS `videos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `videos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `url` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `video_id` varchar(50) NOT NULL,
  `thumbnail` varchar(255) DEFAULT NULL,
  `category` varchar(50) NOT NULL DEFAULT 'Calculus',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_video_id` (`video_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `videos`
--

LOCK TABLES `videos` WRITE;
/*!40000 ALTER TABLE `videos` DISABLE KEYS */;
INSERT INTO `videos` VALUES (7,'Class 12 Math New Book 2026 Unit 1 Exercise 1.3 Complete Solution | Ex 1.3 Class 12th | Punjab Board','https://www.youtube.com/watch?v=nmc6yX7SuVY','2026-07-07 07:18:03','nmc6yX7SuVY','https://i.ytimg.com/vi/nmc6yX7SuVY/hqdefault.jpg','Grade 12'),(8,'Ex 1.5 class 11 Math New Book 2026 Unit 1 complete solution | Ex 1.5 Class 11 | Punjab Board | PTCB','https://www.youtube.com/watch?v=WHzADl-EX0c','2026-07-08 12:02:44','WHzADl-EX0c','https://i.ytimg.com/vi/WHzADl-EX0c/hqdefault.jpg','Grade 12');
/*!40000 ALTER TABLE `videos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-09 13:53:36
