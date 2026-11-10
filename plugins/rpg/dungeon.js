import { getUser, saveUser, addXP, formatMoney } from '../../lib/rpg.js';
import { sendFakeQuoted } from '../../lib/fakequoted.js';

export default {
  command: ['dungeon'],
  category: 'rpg',
  execute: async (denn, m) => {
    const user = getUser(m.sender);
    const now = Date.now();
    const cooldown = 120000;
    if (user.lastDungeon && now - user.lastDungeon < cooldown) {
      const sisa = Math.ceil((cooldown - (now - user.lastDungeon)) / 1000);
      return sendFakeQuoted(denn, m, `⏳ Tunggu ${sisa} detik lagi sebelum masuk dungeon.`, { title: 'Cooldown', body: 'Recovery' });
    }
    if ((user.health || 100) < 30) {
      return sendFakeQuoted(denn, m, '❤️ HP minimal 30 untuk masuk dungeon. Ketik *.heal*', { title: 'HP Rendah', body: 'Minimal 30 HP' });
    }

    const success = Math.random() > 0.35;
    let moneyGain, xpGain, hpLoss, status;

    if (success) {
      moneyGain = 800 + Math.floor(Math.random() * 2500);
      xpGain = 40 + Math.floor(Math.random() * 80);
      hpLoss = 10 + Math.floor(Math.random() * 20);
      status = '✅ Berhasil menaklukkan dungeon!';
    } else {
      moneyGain = 50 + Math.floor(Math.random() * 200);
      xpGain = 10 + Math.floor(Math.random() * 25);
      hpLoss = 25 + Math.floor(Math.random() * 30);
      status = '❌ Gagal... kamu terluka parah.';
    }

    user.money = (user.money || 0) + moneyGain;
    user.health = Math.max(0, (user.health || 100) - hpLoss);
    user.lastDungeon = now;
    saveUser(m.sender, user);

    const result = addXP(m.sender, xpGain);
    const updated = getUser(m.sender);

    let teks = `🏰 *DUNGEON*\n\n${status}\n\n`;
    teks += `💰 Uang: +${formatMoney(moneyGain)}\n⭐ XP: +${xpGain}\n`;
    teks += `❤️ HP: ${updated.health}/100\n💵 Dompet: ${formatMoney(updated.money)}`;
    if (result.levelsGained > 0) teks += `\n\n🎉 *LEVEL UP!* → Level ${updated.level}`;
    
    await sendFakeQuoted(denn, m, teks, { title: 'Dungeon', body: 'Patrick MD RPG' });
  }
};