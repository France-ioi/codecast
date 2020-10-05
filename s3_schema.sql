CREATE TABLE `s3_grants` (
  `id` int(11) NOT NULL,
  `bucket_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARSET=utf8;

CREATE TABLE `s3_buckets` (
  `id` int(11) NOT NULL,
  `access_key_id` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARSET=utf8;

CREATE TABLE `s3_access_keys` (
  `id` int(11) NOT NULL,
  `secret` varchar(255) NOT NULL,
  `region` varchar(255) NOT NULL,
  `bucket` varchar(255) NOT NULL,
  `path` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARSET=utf8;
