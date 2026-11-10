import { getUser, saveUser, addXP, formatMoney } from '../../lib/rpg.js';
import { sendFakeQuoted } from '../../lib/fakequoted.js';

export default {
  command: ['mining', 'tambang'],
  category: 'rpg',
  execute: async (denn, m) => {
    const user = getUser(m.sender);
    const now = Date.now();
    const cooldown = 45000;
    if (user.lastMining && now - user.lastMining < cooldown) {
      const sisa = Math.ceil((cooldown - (now - user.lastMining)) / 1000);
      return sendFakeQuoted(denn, m, `⏳ Tunggu ${sisa} detik lagi sebelum menambang.`, { title: 'Cooldown', body: 'Menambang' });
    }

    const ores = [
      { name: 'Batu Bara', money: [100, 300], xp: [5, 15] },
      { name: 'Besi', money: [200, 500], xp: [10, 25] },
      { name: 'Tembaga', money: [250, 600], xp: [12, 28] },
      { name: 'Emas', money: [800, 2000], xp: [30, 60] },
      { name: 'Berlian', money: [1500, 4000], xp: [50, 100] }
    ];

    const ore = ores[Math.floor(Math.random() * ores.length)];
    const moneyGain = ore.money[0] + Math.floor(Math.random() * (ore.money[1] - ore.money[0] + 1));
    const xpGain = ore.xp[0] + Math.floor(Math.random() * (ore.xp[1] - ore.xp[0] + 1));

    user.money = (user.money || 0) + moneyGain;
    user.lastMining = now;
    saveUser(m.sender, user);

    const result = addXP(m.sender, xpGain);
    const updated = getUser(m.sender);

    let teks = `⛏️ *MINING*\n\nHasil: *${ore.name}*\n`;
    teks += `💰 Uang: +${formatMoney(moneyGain)}\n⭐ XP: +${xpGain}\n`;
    teks += `💵 Dompet: ${formatMoney(updated.money)}\n📊 Level: ${updated.level}`;
    if (result.levelsGained > 0) teks += `\n\n🎉 *LEVEL UP!* → Level ${updated.level}`;
    
    await sendFakeQuoted(denn, m, teks, { title: 'Mining', body: 'Patrick MD RPG' });
  }
};