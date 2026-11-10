import { getUser, saveUser, addXP, formatMoney } from '../../lib/rpg.js';
import { sendFakeQuoted } from '../../lib/fakequoted.js';

const cooldown = 10 * 60 * 1000;
const places = [
  { name: 'Hutan Pinus', money: [500, 1800], xp: [12, 25], item: 'batu' },
  { name: 'Tepi Sungai', money: [300, 1200], xp: [10, 22], item: 'ikan_lele' },
  { name: 'Pasar Lama', money: [700, 2200], xp: [15, 28], item: 'sepatu_bekas' },
  { name: 'Pantai Selatan', money: [900, 2600], xp: [18, 32], item: 'ikan_hiu' }
];

const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export default {
  command: ['explore', 'jelajah'],
  category: 'rpg',
  execute: async (denn, m) => {
    const user = getUser(m.sender);
    const now = Date.now();
    const remaining = cooldown - (now - (user.lastExplore || 0));
    if (remaining > 0) return sendFakeQuoted(denn, m, `🧭 Kamu masih beristirahat. Coba lagi dalam ${Math.ceil(remaining / 60000)} menit.`, { title: 'Cooldown', body: 'Lelah Menjelajah' });
    if ((user.health || 100) < 20) return sendFakeQuoted(denn, m, '❤️ HP minimal 20 untuk menjelajah. Pulihkan HP terlebih dahulu.', { title: 'HP Rendah', body: 'Butuh Ramuan' });

    const place = places[Math.floor(Math.random() * places.length)];
    const money = randomBetween(...place.money);
    const xp = randomBetween(...place.xp);
    const foundItem = Math.random() < 0.35;
    
    user.money = (user.money || 0) + money;
    user.lastExplore = now;
    user.health = Math.max(0, (user.health || 100) - randomBetween(2, 8));
    if (foundItem) user.inventory[place.item] = (user.inventory[place.item] || 0) + 1;
    saveUser(m.sender, user);
    
    const result = addXP(m.sender, xp);
    const updated = getUser(m.sender);
    
    let teks = `🧭 *JELAJAH BERHASIL*\n\nLokasi: *${place.name}*\n`;
    teks += `💰 Uang: +${formatMoney(money)}\n✨ XP: +${xp}\n`;
    teks += `${foundItem ? `🎒 Item: +1 ${place.item}` : '🎒 Tidak menemukan item'}\n`;
    teks += `❤️ HP tersisa: ${updated.health}/100`;
    if (result.levelsGained > 0) teks += `\n🎉 Naik ${result.levelsGained} level!`;
    
    return sendFakeQuoted(denn, m, teks, { title: 'Explore', body: 'Patrick MD RPG' });
  }
};