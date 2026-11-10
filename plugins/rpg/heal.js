import { getUser, saveUser } from '../../lib/rpg.js';
import { sendFakeQuoted } from '../../lib/fakequoted.js';

export default {
    command: ['heal', 'minum'],
    category: 'rpg',
    execute: async (denn, m) => {
        const user = getUser(m.sender);

        if (user.health >= 100) return sendFakeQuoted(denn, m, `❤️ Darahmu sudah penuh (100/100). Kamu tidak butuh ramuan.`, { title: 'Heal', body: 'HP Penuh' });
        
        if (!user.inventory['ramuan'] || user.inventory['ramuan'] < 1) {
            return sendFakeQuoted(denn, m, `❌ Kamu tidak punya *Ramuan*!\nBeli di toko dengan *.buy ramuan 1*`, { title: 'Gagal', body: 'Ramuan Habis' });
        }

        user.inventory['ramuan'] -= 1;
        if (user.inventory['ramuan'] <= 0) delete user.inventory['ramuan'];
        
        user.health = 100;
        saveUser(m.sender, user);

        await sendFakeQuoted(denn, m, `🧪 *BERHASIL MINUM RAMUAN!*\n\n❤️ Darahmu sekarang kembali penuh: *100/100*`, { title: 'Heal', body: 'Berhasil Memulihkan HP' });
    }
};