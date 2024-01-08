import { Listener } from '@sapphire/framework';
import { ChannelType, Message } from 'discord.js';

import { scrapeInstagram } from '@root/src/util/instagram';
import { scrapeTweet } from '@root/src/util/twitter';

export class MessageListener extends Listener {
  public async run(message: Message) {
    if (message.author.bot) return;
    if (message.channel.type === ChannelType.DM) return;

    const tweetId = this.extractTweetId(message.content);
    if (tweetId) {
      await scrapeTweet(tweetId, message);
    }

    const instagramUrl = this.extractInstagramUrl(message.content);
    if (instagramUrl) {
      await scrapeInstagram(instagramUrl, message);
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
}
