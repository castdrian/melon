import { fetchVideo } from '@prevter/tiktok-scraper';
import { AttachmentBuilder, type Message, inlineCode } from 'discord.js';

enum ResponseFlags {
	SHOW_CONTENT = '-c',
	DELETE_MESSAGE = '-d',
}

export async function scrapeTikTok(tikTokUrl: string, message: Message) {
	try {
		const video = await fetchVideo(tikTokUrl);
		const buffer = await video.download();
		const files = [new AttachmentBuilder(buffer).setName('tiktok.mp4')];

		const shouldShowContent = message.content.toLowerCase().includes(ResponseFlags.SHOW_CONTENT);
		const shouldDeleteMessage = message.content.toLowerCase().includes(ResponseFlags.DELETE_MESSAGE);

		const content = `Posted by [${inlineCode(`@${video.author}`)}](<https://tiktok.com/@${video.author}>)${shouldShowContent ? `:\n\n${video.description}` : ''
			}`;

		if (shouldDeleteMessage) {
			await message.channel.send({ content, files });
			await message.delete().catch(() => null);
		} else {
			await message.suppressEmbeds(true).catch(() => null);
			await message.reply({ content, files });
		}
	} catch (error) {
		await message.channel.send(`An error occurred in scrapeTikTok: ${error}`).catch(() => null);
		message.client.logger.error(`An error occurred in scrapeTikTok: ${error}`);
	}
}
