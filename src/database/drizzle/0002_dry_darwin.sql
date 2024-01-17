ALTER TABLE guild_preferences ADD `tiktok_auto_embed` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE guild_preferences ADD `join_role_enabled` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE guild_preferences ADD `join_role_id` text;