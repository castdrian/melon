import { Scraper } from '@the-convocation/twitter-scraper';
import { type BufferResolvable, type Message, time } from 'discord.js';

enum ResponseFlags {
  SHOW_CONTENT = '-c',
  DELETE_MESSAGE = '-d',
}

export async function scrapeTweet(tweetId: string, message: Message) {
  try {
    const tweet = await new Scraper().getTweet(tweetId);
    if (!tweet) {
      message.client.logger.info(`No tweet found for ID ${tweetId}`);
      return;
    }

    if (!tweet.photos.length && !tweet.videos.length) {
      message.client.logger.info(`Tweet ${tweetId} contains no photos or videos`);
      return;
    }

    const attachments: BufferResolvable[] = [];
    tweet.photos.forEach((photo) => attachments.push(photo.url));
    tweet.videos.forEach((video) => attachments.push(video.url ?? ''));

    if (!attachments.length) {
      message.client.logger.info(`No attachments found for Tweet ${tweetId}`);
      return;
    }

    const shouldShowContent = message.content.toLowerCase().includes(ResponseFlags.SHOW_CONTENT);
    const shouldDeleteMessage = message.content.toLowerCase().includes(ResponseFlags.DELETE_MESSAGE);

    const content = `Posted ${time(tweet.timestamp!, 'R')} by [@${tweet.username}](<https://twitter.com/${
      tweet.username
    }>)${shouldShowContent ? `:\n\n${tweet.text}` : ''}`;

    if (shouldDeleteMessage) {
      await message.channel.send({ content, files: attachments });
      await message.delete().catch(() => null);
    } else {
      await message.reply({ content, files: attachments });
    }
  } catch (error) {
    message.client.logger.error(`An error occurred in scrapeTweet: ${error}`);
  }
}
