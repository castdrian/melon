import { createConfigLoader } from "@neato/config";
import { z } from 'zod';

const schema = z.object({
  discordToken: z.string().min(1),
  devGuildId: z.string().optional(),
  instagramApiToken: z.string().min(1),
});

const prefix = 'CONF_';

export const config = createConfigLoader()
  .addFromFile('.env', { prefix })
  .addFromEnvironment(prefix)
  .addZodSchema(schema)
  .load();

export const MELON_COLOR = 0xd23b68;
