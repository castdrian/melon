CREATE TABLE `guild_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`twitter_auto_embed` integer DEFAULT 0,
	`instagram_auto_embed` integer DEFAULT 0,
	`greeting_channel_id` text,
	`greeting_message` text
);
