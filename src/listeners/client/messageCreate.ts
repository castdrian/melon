import { createContext, runInContext } from 'node:vm';

import { Listener } from '@sapphire/framework';
import { ChannelType, Message, codeBlock } from 'discord.js';

import { isInstagramAutoEmbedEnabled, isTwitterAutoEmbedEnabled } from '@root/src/database/db';
import { scrapeInstagram } from '@root/src/util/instagram';
import { scrapeTweet } from '@root/src/util/twitter';

export class MessageListener extends Listener {
  public async run(message: Message) {
    if (message.author.bot) return;
    if (message.channel.type === ChannelType.DM) return;

    if (message.mentions.has(message.client.user!) && message.author.id === message.client.application.owner?.id) {
      await this.runCode(message);
    }

    const tweetId = this.extractTweetId(message.content);
    if (tweetId) {
      if (await isTwitterAutoEmbedEnabled(message.guildId!)) {
        await scrapeTweet(tweetId, message);
      }
    }

    const instagramUrl = this.extractInstagramUrl(message.content);
    if (instagramUrl) {
      if (await isInstagramAutoEmbedEnabled(message.guildId!)) {
        await scrapeInstagram(instagramUrl, message);
      }
    }
  }

  private extractTweetId(text: string): string | null {
    const regex = /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/;
    const matches = regex.exec(text);
    return matches ? matches[1] : null;
  }

  private extractInstagramUrl(text: string): string | null {
    const regex = /((?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel)\/([^/?#&]+)).*/g;
    const matches = regex.exec(text);
    return matches ? matches[1] : null;
  }

  private async runCode(message: Message) {
    const code = message.content.replace(`<@${message.client.user!.id}>`, '').trim();
    try {
      const result = runInContext(code, createContext({ message }), { timeout: 30000 });
      await message.reply(codeBlock('ts', result));
    } catch (error) {
      await message.reply(`An error occurred: ${error}`);
    }
  }
}
