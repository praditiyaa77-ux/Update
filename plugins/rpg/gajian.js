import { getUser, saveUser, addXP, formatMoney } from '../../lib/rpg.js';
import { sendFakeQuoted } from '../../lib/fakequoted.js';

export default {
  command: ['gajian'],
  category: 'rpg',
  execute: async (denn, m) => {
    const user = getUser(m.sender);
    const now = Date.now();
    const key = 'lastGajian';
    const cooldown = 40000;
    if (user[key] && now - user[key] < cooldown) {
      const sisa = Math.ceil((cooldown - (now - user[key])) / 1000);
      return sendFakeQuoted(denn, m, `⏳ Tunggu ${sisa} detik lagi.`, { title: 'Cooldown', body: 'Gajian' });
    }

    const moneyGain = 100 + Math.floor(Math.random() * 900);
    const xpGain = 10 + Math.floor(Math.random() * 40);

    user.money = (user.money || 0) + moneyGain;
    user[key] = now;
    saveUser(m.sender, user);

    const result = addXP(m.sender, xpGain);
    const updated = getUser(m.sender);

    let teks = `🎮 *GAJIAN*\n\n💰 Uang: +${formatMoney(moneyGain)}\n⭐ XP: +${xpGain}\n`;
    teks += `💵 Dompet: ${formatMoney(updated.money)}\n📊 Level: ${updated.level}`;
    if (result.levelsGained > 0) teks += `\n\n🎉 *LEVEL UP!* → Level ${updated.level}`;
    
    await sendFakeQuoted(denn, m, teks, { title: 'Gajian', body: 'Patrick MD RPG' });
  }
};