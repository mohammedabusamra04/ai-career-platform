import { InlineKeyboard } from 'grammy';

export const workTypeKeyboard = new InlineKeyboard()
  .text('Remote', 'work_remote')
  .text('Hybrid', 'work_hybrid')
  .row()
  .text('On-site', 'work_onsite');
