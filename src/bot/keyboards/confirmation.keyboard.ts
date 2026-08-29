import { InlineKeyboard } from 'grammy';

export const confirmationKeyboard = new InlineKeyboard()
  .text('✅ Confirm', 'preferences:confirm')
  .row()
  .text('🔄 Restart', 'preferences:restart')
  .text('✏️ Update', 'preferences:update');
