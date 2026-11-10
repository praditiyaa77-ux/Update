import { getUser, saveUser, addXP } from '../../lib/rpg.js';
import { sendFakeQuoted } from '../../lib/fakequoted.js';

export default {
    command: ['mancing', 'fishing'],
    category: 'rpg',
    execute: async (denn, m) => {
        const user = getUser(m.sender);
        
        if (!user.inventory['pancing'] || user.inventory['pancing'] < 1) {
            return sendFakeQuoted(denn, m, `❌ Kamu tidak punya *Pancing*!\nBeli dulu di toko dengan command *.buy pancing 1*`, { title: 'Gagal', body: 'Tidak ada pancing' });
        }

        const cooldown = 60000;
        const now = Date.now();

        if (user.lastMancing && now - user.lastMancing < cooldown) {
            const timeLeft = cooldown - (now - user.lastMancing);
            const seconds = Math.ceil(timeLeft / 1000);
            return sendFakeQuoted(denn, m, `🎣 Sabar... Ikan sedang berkumpul.\nTunggu *${seconds} detik* lagi.`, { title: 'Cooldown', body: 'Memancing' });
        }

        const roll = Math.random();
        let hasilId = '';
        let xpDidapat = 15;

        if (roll < 0.1) {
            hasilId = 'ikan_hiu';
            xpDidapat = 50;
        } else if (roll < 0.5) {
            hasilId = 'ikan_lele';
            xpDidapat = 25;
        } else {
            hasilId = 'sepatu_bekas';
            xpDidapat = 5;
        }

        if (!user.inventory[hasilId]) user.inventory[hasilId] = 0;
        user.inventory[hasilId] += 1;
        user.lastMancing = now;
        saveUser(m.sender, user);

        const result = addXP(m.sender, xpDidapat);

        await sendFakeQuoted(denn, m, `🎣 *MANCING SELESAI!*\n\nKamu mendapatkan: *1x ${hasilId.replace(/_/g, ' ').toUpperCase()}*\n✨ XP: *+${xpDidapat}*\n\n_Cek tasmu dengan .inv_`, { title: 'Mancing', body: 'Patrick MD RPG' });
    }
};