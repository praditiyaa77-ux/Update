import { getUser, saveUser, addXP } from '../../lib/rpg.js';
import { sendFakeQuoted } from '../../lib/fakequoted.js';

export default {
    command: ['rampok', 'rob'],
    category: 'rpg',
    execute: async (denn, m, { getTarget, prefix }) => {
        const targetJid = getTarget();
        if (!targetJid) return sendFakeQuoted(denn, m, `Tag orang yang mau dirampok!\nContoh: ${prefix}rampok @teman`, { title: 'Gagal', body: 'Target tidak valid' });
        if (targetJid === m.sender) return sendFakeQuoted(denn, m, '❌ Kamu tidak bisa merampok dirimu sendiri!', { title: 'Gagal', body: 'Tidak bisa rampok diri sendiri' });

        const user = getUser(m.sender);
        const target = getUser(targetJid);
        const targetName = target.name || targetJid.split('@')[0];

        if (!user.inventory['pedang'] || user.inventory['pedang'] < 1) {
            return sendFakeQuoted(denn, m, `❌ Kamu butuh *Pedang Kayu* untuk merampok!\nBeli di toko dengan *.buy pedang 1*`, { title: 'Gagal', body: 'Butuh Pedang' });
        }

        if ((user.health || 100) <= 20) return sendFakeQuoted(denn, m, `😫 Darahmu terlalu rendah (${user.health}/100) untuk merampok. Minum ramuan dulu!`, { title: 'Gagal', body: 'HP Terlalu Rendah' });
        if ((target.health || 100) <= 0) return sendFakeQuoted(denn, m, `❌ Target sedang sekarat, jangan dirampok!`, { title: 'Gagal', body: 'Target Sekarat' });
        if ((target.money || 0) < 500) return sendFakeQuoted(denn, m, `❌ Targetnya miskin, uang di dompetnya kurang dari $500.`, { title: 'Gagal', body: 'Target Miskin' });

        const sukses = Math.random() < 0.6;

        if (sukses) {
            const curiPersen = Math.floor(Math.random() * 20) + 20;
            const uangDicuri = Math.floor((target.money * curiPersen) / 100);

            user.money = (user.money || 0) + uangDicuri;
            target.money -= uangDicuri;
            target.health = Math.max(0, (target.health || 100) - 20);

            saveUser(m.sender, user);
            saveUser(targetJid, target);
            const xpResult = addXP(m.sender, 50);

            let teks = `🔪 *BERHASIL MERAMPOK!*\n\nKamu merampok *${targetName}* dan mendapatkan *$${uangDicuri.toLocaleString('id-ID')}*!\n\n_Target kehilangan 20 HP._`;
            if (xpResult.levelsGained) teks += `\n🎉 Kamu naik ${xpResult.levelsGained} level!`;
            
            await sendFakeQuoted(denn, m, teks, { title: 'Rampok Berhasil', body: 'Hati-hati ada polisi' });
        } else {
            const denda = 1500;
            user.money = Math.max(0, (user.money || 0) - denda);
            user.health = Math.max(0, (user.health || 100) - 30);

            saveUser(m.sender, user);

            await sendFakeQuoted(denn, m, `🚨 *GAGAL MERAMPOK!*\n\nAksi kamu ketahuan warga! Kamu didenda *$1.500* dan dipukuli hingga kehilangan *30 HP*.\n\n_Sisa uangmu: $${user.money}_`, { title: 'Rampok Gagal', body: 'Tertangkap Warga' });
        }
    }
};