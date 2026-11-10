import { getUser, formatMoney } from '../../lib/rpg.js';
import { sendFakeQuoted } from '../../lib/fakequoted.js';

export default {
  command: ['level', 'lvl', 'xp'],
  category: 'rpg',
  execute: async (denn, m) => {
    const user = getUser(m.sender);
    const need = (user.level || 1) * 100;
    const percent = Math.min(100, Math.floor(((user.xp || 0) / need) * 100));
    const bar = '█'.repeat(Math.floor(percent / 10)) + '░'.repeat(10 - Math.floor(percent / 10));

    const teks = `⭐ *LEVEL & XP*\n\nLevel: *${user.level || 1}*\nXP: *${user.xp || 0}/${need}* (${percent}%)\n[${bar}]\n\n💵 Dompet: ${formatMoney(user.money)}\n🏦 Bank: ${formatMoney(user.bank)}\n❤️ HP: ${user.health || 100}/100\n🎟️ Limit: ${user.limit || 0}\n\n_Main fitur RPG untuk naik XP._`;
    
    await sendFakeQuoted(denn, m, teks, { title: 'Level & XP', body: 'Patrick MD RPG' });
  }
};