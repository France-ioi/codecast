
CREATE TABLE `sessions` (
  `session_id` varchar(128) NOT NULL,
  `expires` int(11) unsigned NOT NULL,
  `data` text,
  PRIMARY KEY (`session_id`)
) DEFAULT CHARSET=utf8;

CREATE TABLE `user_configs` (
  `user_id` int(11) NOT NULL,
  `value` text NOT NULL,
  PRIMARY KEY (`user_id`)
) DEFAULT CHARSET=utf8;

