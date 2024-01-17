import { createContext, runInContext } from 'node:vm';

import { Listener } from '@sapphire/framework';
import { ChannelType, Message, codeBlock } from 'discord.js';

import {
  isInstagramAutoEmbedEnabled,
  isTikTokAutoEmbedEnabled,
  isTwitterAutoEmbedEnabled,
} from '@root/src/database/db';
import { scrapeInstagram } from '@root/src/util/instagram';
import { scrapeTikTok } from '@root/src/util/tiktok';
import { scrapeTweet } from '@root/src/util/twitter';

export class MessageListener extends Listener {
  public async run(message: Message) {
    if (message.author.bot) return;
    if (message.channel.type === ChannelType.DM) return;

    if (message.mentions.has(message.client.user!) && message.author.id === message.client.application.owner?.id) {
      await message.channel.sendTyping();
      await this.runCode(message);
    }

    const tweetId = this.extractTweetId(message.content);
    if (tweetId) {
      if (await isTwitterAutoEmbedEnabled(message.guildId!)) {
        await message.channel.sendTyping();
        await scrapeTweet(tweetId, message);
      }
    }

    const instagramUrl = this.extractInstagramUrl(message.content);
    if (instagramUrl) {
      if (await isInstagramAutoEmbedEnabled(message.guildId!)) {
        await message.channel.sendTyping();
        await scrapeInstagram(instagramUrl, message);
      }
    }

    const tikTokUrl = this.extractTikTokUrl(message.content);
    if (tikTokUrl) {
      if (await isTikTokAutoEmbedEnabled(message.guildId!)) {
        await message.channel.sendTyping();
        await scrapeTikTok(tikTokUrl, message);
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

  private extractTikTokUrl(text: string): string | null {
    const tikTokRegex =
      /^.*https:\/\/(?:m|www|vm)?\.?tiktok\.com\/((?:.*\b(?:(?:usr|v|embed|user|video)\/|\?shareId=|\&item_id=)(\d+))|\w+)/;
    const matches = tikTokRegex.exec(text);
    return matches ? matches[0] : null;
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
