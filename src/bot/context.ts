import type { Context } from 'grammy';
import type { SessionFlavor } from 'grammy';

import type { PreferenceSession } from './session.js';

export type BotContext = Context & SessionFlavor<PreferenceSession>;
