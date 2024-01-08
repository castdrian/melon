import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';

import { config } from '@src/config';

const sqlite = new Database(config.devGuildId ? ':memory:' : 'melon.db', { create: true });
export const db = drizzle(sqlite);
