-- phpMyAdmin SQL Dump
-- version 4.2.12deb2+deb8u2
-- http://www.phpmyadmin.net
--
-- Host: franceioi.cinniket56wn.eu-central-1.rds.amazonaws.com
-- Generation Time: Oct 30, 2019 at 12:01 PM
-- Server version: 5.6.44-log
-- PHP Version: 5.6.33-0+deb8u1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `codecast_example`
--

-- --------------------------------------------------------

--
-- Table structure for table `s3_access_keys`
--

CREATE TABLE IF NOT EXISTS `s3_access_keys` (
  `id` varchar(128) NOT NULL,
  `secret` varchar(128) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `s3_access_keys`
--

INSERT INTO `s3_access_keys` (`id`, `secret`) VALUES
('AKIAJ5EIIE24XNQMH5KQ', 'SECRET');

-- --------------------------------------------------------

--
-- Table structure for table `s3_buckets`
--

CREATE TABLE IF NOT EXISTS `s3_buckets` (
`id` int(11) NOT NULL,
  `region` text NOT NULL,
  `bucket` text NOT NULL,
  `access_key_id` varchar(128) NOT NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

--
-- Dumping data for table `s3_buckets`
--

INSERT INTO `s3_buckets` (`id`, `region`, `bucket`, `access_key_id`) VALUES
(1, 'eu-central-1', 'fioi-recordings', 'SECRET');

-- --------------------------------------------------------

--
-- Table structure for table `s3_grants`
--

CREATE TABLE IF NOT EXISTS `s3_grants` (
`id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `bucket_id` int(11) NOT NULL,
  `path` varchar(128) NOT NULL,
  `priority` int(11) NOT NULL DEFAULT '0'
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8;

--
-- Dumping data for table `s3_grants`
--

INSERT INTO `s3_grants` (`id`, `user_id`, `bucket_id`, `path`, `priority`) VALUES
(1, 11385, 1, 'sebc', 1),
(2, 11385, 1, 'guest', 2),
(3, 100050340, 1, 'dartmouth', 2),
(4, 100050340, 1, 'tcom', 1),
(5, 31073, 1, 'tcom', 1),
(6, 31073, 1, 'dartmouth', 2),
(7, 100043393, 1, 'tcom', 1),
(8, 100043393, 1, 'dartmouth', 2),
(9, 100004827, 1, 'dartmouth', 1),
(10, 100004827, 1, 'tcom', 2),
(11, 2, 1, 'tcom', 1),
(12, 2, 1, 'dartmouth', 2),
(13, 142222, 1, 'tcom', 1);

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE IF NOT EXISTS `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) unsigned NOT NULL,
  `data` text CHARACTER SET utf8mb4 COLLATE utf8mb4_bin
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`session_id`, `expires`, `data`) VALUES
('-0SQ7HSwQnd-lE48UoK5ZkeyG3Xyf8B9', 1572751153, '{"cookie":{"originalMaxAge":604800000,"expires":"2019-11-03T03:19:12.664Z","secure":true,"httpOnly":true,"path":"/"}}');

-- --------------------------------------------------------

--
-- Table structure for table `user_configs`
--

CREATE TABLE IF NOT EXISTS `user_configs` (
  `user_id` int(11) NOT NULL,
  `value` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Dumping data for table `user_configs`
--

INSERT INTO `user_configs` (`user_id`, `value`) VALUES
(0, '{"s3AccessKeyId":"AKIAJ5EIIE24","s3SecretAccessKey":"SECRET","s3Region":"eu-central-1","s3Bucket":"fioi-recordings","uploadPath":"guest"}'),
(2, '{"s3AccessKeyId":"AKIAJ5EIIE24XNQMH5KQ","s3SecretAccessKey":"SECRET","s3Region":"eu-central-1","s3Bucket":"fioi-recordings","uploadPath":"mathias"}');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `s3_access_keys`
--
ALTER TABLE `s3_access_keys`
 ADD PRIMARY KEY (`id`);

--
-- Indexes for table `s3_buckets`
--
ALTER TABLE `s3_buckets`
 ADD PRIMARY KEY (`id`), ADD KEY `s3_buckets_access_key_id` (`access_key_id`) USING BTREE;

--
-- Indexes for table `s3_grants`
--
ALTER TABLE `s3_grants`
 ADD PRIMARY KEY (`id`), ADD KEY `s3_grants_bucket_id` (`bucket_id`) USING BTREE;

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
 ADD PRIMARY KEY (`session_id`);

--
-- Indexes for table `user_configs`
--
ALTER TABLE `user_configs`
 ADD PRIMARY KEY (`user_id`), ADD UNIQUE KEY `ix_user_configs_user_id` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `s3_buckets`
--
ALTER TABLE `s3_buckets`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT for table `s3_grants`
--
ALTER TABLE `s3_grants`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT,AUTO_INCREMENT=14;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

CREATE TABLE IF NOT EXISTS `statistics_logs` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `codecast` VARCHAR(128) NOT NULL DEFAULT '',
    `name` VARCHAR(128) NOT NULL,
    `folder` VARCHAR(128) NOT NULL DEFAULT 'none',
    `bucket` VARCHAR(128) NOT NULL DEFAULT 'none',
    `date_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `viewed` INT(11) NOT NULL DEFAULT '0',
    `compiled` INT(11) NOT NULL DEFAULT '0',
    `compile_time` DECIMAL(10,3) NOT NULL DEFAULT '0',
    `referer` TEXT NULL,
    `browser` TEXT NULL,
    `language` TEXT NULL,
    `resolution` TEXT NULL,
    PRIMARY KEY (`id`)
) ENGINE = InnoDB;
