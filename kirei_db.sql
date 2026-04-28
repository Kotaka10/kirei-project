-- MySQL dump 10.13  Distrib 8.4.8, for Linux (aarch64)
--
-- Host: localhost    Database: kirei_db
-- ------------------------------------------------------
-- Server version	8.4.8

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_name` varchar(255) NOT NULL,
  `zipcode` varchar(10) DEFAULT NULL,
  `prefecture` varchar(50) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `other_address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `building_name` varchar(255) DEFAULT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `contract_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companies`
--

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
INSERT INTO `companies` VALUES (1,'株式会社kirei','1000001','東京都','千代田区千代田','392-1','','0120-011-011','2026-03-01','active','2026-03-18 08:14:04','2026-03-24 08:50:04'),(2,'株式会社CREAN','1000002','東京都','千代田区皇居外苑','999-1','','0120-022-022','2026-03-07','active','2026-03-18 08:14:04','2026-03-18 08:14:04'),(3,'株式会社beauty','1000003','東京都','千代田区一橋','333-1','','0120-033-033','2026-03-15','negotiating','2026-03-18 08:14:04','2026-03-18 08:14:04'),(4,'株式会社Fabulous','1000004','東京都','千代田区千代田','392-1','','0120-011-011','2026-02-27','契約中','2026-03-24 07:27:00','2026-03-24 07:27:53'),(7,'株式会社kirei','1000001','東京都','千代田区千代田','392-1','','0120-011-011','2026-02-27','契約中','2026-03-24 08:52:36','2026-03-24 08:52:52');
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `company_emails`
--

DROP TABLE IF EXISTS `company_emails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_emails` (
  `id` int NOT NULL AUTO_INCREMENT,
  `company_id` int NOT NULL,
  `email` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `company_emails_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_emails`
--

LOCK TABLES `company_emails` WRITE;
/*!40000 ALTER TABLE `company_emails` DISABLE KEYS */;
INSERT INTO `company_emails` VALUES (1,1,'kirei@kirei.com'),(2,2,'clean@clean.com'),(3,3,'beauty@beauty.com'),(4,4,'kirei@kirei.com'),(7,7,'kirei@kirei.com');
/*!40000 ALTER TABLE `company_emails` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_name` varchar(255) NOT NULL,
  `description` text,
  `quantity` int NOT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `unit_price` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES (1,'りんご','赤くてまんまるのりんご',10,'個',160,'2026-03-18 07:09:19','2026-03-18 07:09:19'),(2,'みかん','甘さと酸っぱさが絶妙なみかん',10,'個',190,'2026-03-18 07:09:19','2026-03-23 00:03:29'),(3,'ぶどう','一粒一粒が大きいふどう',10,'房',700,'2026-03-18 07:09:19','2026-03-23 00:03:08'),(6,'もも','甘味たっぷりのもも',10,'個',250,'2026-03-24 02:26:04','2026-03-24 02:26:04');
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `zipcode` varchar(10) DEFAULT NULL,
  `prefecture` varchar(50) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `other_address` varchar(255) DEFAULT NULL,
  `building_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `publication_date` date DEFAULT NULL,
  `expiration_date` date DEFAULT NULL,
  `notes` text,
  `memo` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'山田太郎','070-111-222','3340011','埼玉県','川口市三ツ和','999-1','',NULL,NULL,'','','2026-03-18 07:55:19','2026-03-18 07:55:19'),(2,'山田花子','070-333-444','3340012','埼玉県','川口市八幡木','888-1','',NULL,NULL,'','','2026-03-18 07:55:19','2026-03-18 07:55:19'),(3,'山田次郎','070-555-666','3340013','埼玉県','川口市鳩ヶ谷','777-1','',NULL,NULL,'','','2026-03-18 07:55:19','2026-03-18 07:55:19'),(8,'山田三郎','0222-222-22','1000004','東京都','千代田区大手町','','',NULL,NULL,'','','2026-03-24 09:00:41','2026-03-24 09:00:41');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'kirei_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

CREATE TABLE IF NOT EXISTS `chats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sender_user_id` int NOT NULL,
  `receiver_user_id` int NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `text` text NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Dump completed on 2026-03-26  3:42:33
