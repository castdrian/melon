CREATE TABLE `guild_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`twitter_auto_embed` integer DEFAULT false NOT NULL,
	`instagram_auto_embed` integer DEFAULT false NOT NULL,
	`greeting_channel_id` text,
	`greeting_message` text
);
