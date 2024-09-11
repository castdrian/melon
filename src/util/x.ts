import { Scraper } from '@the-convocation/twitter-scraper';
import { type BufferResolvable, type Message, inlineCode, time } from 'discord.js';

enum ResponseFlags {
	SHOW_CONTENT = '-c',
	DELETE_MESSAGE = '-d',
}

export async function scrapeX(postId: string, message: Message) {
	try {
		const post = await new Scraper().getTweet(postId);
		if (!post) {
			message.client.logger.info(`No post found for ID ${postId}`);
			throw new Error(`No post found for ID ${postId}`);
		}

		if (!post.photos.length && !post.videos.length) {
			message.client.logger.info(`Post ${postId} contains no photos or videos`);
			return;
		}

		const attachments: BufferResolvable[] = [];
		post.photos.forEach((photo) => attachments.push(photo.url));
		post.videos.forEach((video) => attachments.push(video.url ?? ''));

		if (!attachments.length) {
			message.client.logger.info(`No attachments found for post ${postId}`);
			return;
		}

		const shouldShowContent = message.content.toLowerCase().includes(ResponseFlags.SHOW_CONTENT);
		const shouldDeleteMessage = message.content.toLowerCase().includes(ResponseFlags.DELETE_MESSAGE);

		const content = `Posted ${time(post.timestamp!, 'R')} by [${inlineCode(`@${post.username!}`)}](<https://x.com/${post.username
			}>)${shouldShowContent ? `:\n\n${post.text}` : ''}`;

		if (shouldDeleteMessage) {
			await message.channel.send({ content, files: attachments });
			await message.delete().catch(() => null);
		} else {
			await message.suppressEmbeds(true).catch(() => null);
			await message.reply({ content, files: attachments });
		}
	} catch (error) {
		await message.channel.send(`An error occurred in scrapeX: ${error}`).catch(() => null);
		message.client.logger.error(`An error occurred in scrapeX: ${error}`);
	}
}
