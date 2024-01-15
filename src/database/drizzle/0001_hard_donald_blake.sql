CREATE TABLE `greeting_preferences` (
	`id` text PRIMARY KEY NOT NULL,
	`greeting_channel_id` text,
	`greeting_message_content` text,
	`greeting_embed_title` text,
	`greeting_embed_description` text,
	FOREIGN KEY (`id`) REFERENCES `guild_preferences`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `guild_preferences` DROP COLUMN `greeting_channel_id`;--> statement-breakpoint
ALTER TABLE `guild_preferences` DROP COLUMN `greeting_message`;