import { CHEEKIES_COLOR } from "@src/config";
import { Scraper } from "@the-convocation/twitter-scraper";
import {
	ContainerBuilder,
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
	type Message,
	MessageFlags,
	SectionBuilder,
	TextDisplayBuilder,
	ThumbnailBuilder,
	inlineCode,
	time,
} from "discord.js";

enum ResponseFlags {
	SHOW_CONTENT = "-c",
	DELETE_MESSAGE = "-d",
}

export async function scrapeX(postId: string, message: Message) {
	try {
		if (!message.channel.isTextBased()) return;
		if (message.channel.isDMBased()) return;

		const post = await new Scraper().getTweet(postId);
		if (!post) {
			message.client.logger.info(`No post found for ID ${postId}`);
			throw new Error(`No post found for ID ${postId}`);
		}

		if (!post.photos.length && !post.videos.length) {
			message.client.logger.info(`Post ${postId} contains no photos or videos`);
			return;
		}

		const shouldShowContent = message.content
			.toLowerCase()
			.includes(ResponseFlags.SHOW_CONTENT);
		const shouldDeleteMessage = message.content
			.toLowerCase()
			.includes(ResponseFlags.DELETE_MESSAGE);

		const container = new ContainerBuilder().setAccentColor(CHEEKIES_COLOR);

		// Add header section with thumbnail
		const content = new TextDisplayBuilder().setContent(
			`Posted ${time(post.timestamp!, "R")} by [**@${post.username!}**](<https://x.com/${post.username}>)${
				shouldShowContent ? `\n\n${post.text}` : ""
			}`,
		);

		container.addSectionComponents(
			new SectionBuilder()
				.addTextDisplayComponents(content)
				.setThumbnailAccessory(
					new ThumbnailBuilder().setURL(
						message.client.user!.displayAvatarURL(),
					),
				),
		);

		// Add media gallery
		const gallery = new MediaGalleryBuilder();
		const mediaItems = [
			...post.photos.map((photo) =>
				new MediaGalleryItemBuilder().setURL(photo.url),
			),
			...post.videos.map((video) =>
				new MediaGalleryItemBuilder().setURL(video.url ?? ""),
			),
		].filter((item) => item.data.media?.url);

		if (mediaItems.length) {
			gallery.addItems(...mediaItems);
			container.addMediaGalleryComponents(gallery);
		}

		if (shouldDeleteMessage) {
			await message.channel.send({
				components: [container],
				flags: MessageFlags.IsComponentsV2,
			});
			await message.delete().catch(() => null);
		} else {
			await message.suppressEmbeds(true);
			await message.reply({
				components: [container],
				flags: MessageFlags.IsComponentsV2,
			});
		}
	} catch (error) {
		if (!message.channel.isTextBased()) return;
		if (message.channel.isDMBased()) return;

		await message.channel
			.send(`An error occurred in scrapeX: ${error}`)
			.catch(() => null);
		message.client.logger.error(`An error occurred in scrapeX: ${error}`);
	}
}
