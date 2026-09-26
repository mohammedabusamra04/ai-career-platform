import { InlineKeyboard, Keyboard } from 'grammy';

export const startInlineKeyboard = new InlineKeyboard().text(
  '🚀 Start Job Search',
  'start_search',
);

export const startReplyKeyboard = new Keyboard()
  .text('🚀 Start Job Search')
  .text('🔔 Subscription Status')
  .resized()
  .persistent();

export const mainKeyboard = startInlineKeyboard;


