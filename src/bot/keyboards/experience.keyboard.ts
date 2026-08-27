import { InlineKeyboard } from 'grammy';

export const experienceKeyboard = new InlineKeyboard()
  .text('Junior', 'experience_junior')
  .text('Mid', 'experience_mid')
  .row()
  .text('Senior', 'experience_senior');
