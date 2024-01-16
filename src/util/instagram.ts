import { type BufferResolvable, type Message, time } from 'discord.js';
import { getCookie, igApi } from 'insta-fetcher';

import { config } from '@src/config';

enum ResponseFlags {
  SHOW_CONTENT = '-c',
  DELETE_MESSAGE = '-d',
}

export async function scrapeInstagram(instagramURL: string, message: Message) {
  try {
    const sessionId = (await getCookie(config.instagramUsername, config.instagramPassword)) as string;
    const ig = new igApi(sessionId);

    async function retry<T>(promiseFn: () => Promise<T>, retries: number): Promise<T> {
      try {
        return await promiseFn();
      } catch (error) {
        if (retries > 0) {
          return retry(promiseFn, retries - 1);
        }
        throw error;
      }
    }

    const post = await retry(() => ig.fetchPost(instagramURL), 2);
    if (!post) {
      message.client.logger.info(`No post found for URL ${instagramURL}`);
      throw new Error(`No post found for URL ${instagramURL}`);
    }

    const attachments: BufferResolvable[] = [];

    for (const item of post.links) {
      if (item.type === 'image') {
        const res = await fetch(item.url);
        const buffer = Buffer.from(await res.arrayBuffer());
        attachments.push(buffer);
      } else if (item.type === 'video') {
        attachments.push(item.url);
      }
    }

    const shouldShowContent = message.content.toLowerCase().includes(ResponseFlags.SHOW_CONTENT);
    const shouldDeleteMessage = message.content.toLowerCase().includes(ResponseFlags.DELETE_MESSAGE);

    const content = `Posted ${time(post.taken_at_timestamp, 'R')} by [@${post.username}](<https://www.instagram.com/${
      post.username
    }>)${shouldShowContent ? `:\n\n${post.caption}` : ''}`;

    if (shouldDeleteMessage) {
      await message.channel.send({ content, files: attachments });
      await message.delete().catch(() => null);
    } else {
      await message.suppressEmbeds(true).catch(() => null);
      await message.reply({ content, files: attachments });
    }
  } catch (error) {
    await message.channel.send(`An error occurred in scrapeInstagram: ${error}`).catch(() => null);
    message.client.logger.error(`An error occurred in scrapeInstagram: ${error}`);
  }
}
