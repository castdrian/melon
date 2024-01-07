import { Scraper } from '@the-convocation/twitter-scraper';
import { type BufferResolvable, type Message, time } from 'discord.js';

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

    const content = `Posted ${time(tweet.timestamp!, 'R')} by [@${tweet.username}](<https://twitter.com/${
      tweet.username
    }>):\n\n${tweet.text}`;
    await message.suppressEmbeds(true);
    await message.reply({ content, files: attachments });
  } catch (error) {
    message.client.logger.error(`An error occurred in scrapeTweet: ${error}`);
  }
}
