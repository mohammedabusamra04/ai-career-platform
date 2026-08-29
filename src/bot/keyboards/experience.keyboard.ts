import { InlineKeyboard } from 'grammy';

export const experienceKeyboard = new InlineKeyboard()
  .text('Intern', 'experience:intern')
  .text('Junior', 'experience:junior')
  .row()
  .text('Mid', 'experience:mid')
  .text('Senior', 'experience:senior')
  .row()
  .text('Lead', 'experience:lead')
  .text('Any', 'experience:any');
