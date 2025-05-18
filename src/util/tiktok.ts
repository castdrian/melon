import { fetchVideo } from "@prevter/tiktok-scraper";
import { CHEEKIES_COLOR } from "@src/config";
import {
	ContainerBuilder,
	type Message,
	MessageFlags,
	SectionBuilder,
	TextDisplayBuilder,
	ThumbnailBuilder,
	inlineCode,
} from "discord.js";

enum ResponseFlags {
	SHOW_CONTENT = "-c",
	DELETE_MESSAGE = "-d",
}

export async function scrapeTikTok(tikTokUrl: string, message: Message) {
	try {
		if (!message.channel.isTextBased()) return;
		if (message.channel.isDMBased()) return;

		const video = await fetchVideo(tikTokUrl);
		const buffer = await video.download();
		const shouldShowContent = message.content
			.toLowerCase()
			.includes(ResponseFlags.SHOW_CONTENT);
		const shouldDeleteMessage = message.content
			.toLowerCase()
			.includes(ResponseFlags.DELETE_MESSAGE);

		const container = new ContainerBuilder().setAccentColor(CHEEKIES_COLOR);

		// Add header section with thumbnail
		const content = new TextDisplayBuilder().setContent(
			`Posted by []**@${video.author}**](<https://tiktok.com/@${video.author}>)${
				shouldShowContent ? `\n\n${video.description}` : ""
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

		if (shouldDeleteMessage) {
			await message.channel.send({
				files: [{ attachment: buffer, name: "tiktok.mp4" }],
				components: [container],
				flags: MessageFlags.IsComponentsV2,
			});
			await message.delete().catch(() => null);
		} else {
			await message.suppressEmbeds(true);
			await message.reply({
				files: [{ attachment: buffer, name: "tiktok.mp4" }],
				components: [container],
				flags: MessageFlags.IsComponentsV2,
			});
		}
	} catch (error) {
		if (!message.channel.isTextBased()) return;
		if (message.channel.isDMBased()) return;

		await message.channel
			.send(`An error occurred in scrapeTikTok: ${error}`)
			.catch(() => null);
		message.client.logger.error(`An error occurred in scrapeTikTok: ${error}`);
	}
}
