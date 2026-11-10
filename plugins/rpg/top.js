import { getAllUsers, formatMoney } from '../../lib/rpg.js';
import { sendFakeQuoted } from '../../lib/fakequoted.js';

export default {
    command: ['top', 'leaderboard'],
    category: 'rpg',
    execute: async (denn, m) => {
        const allUsers = getAllUsers();
        
        const sortedUsers = Object.entries(allUsers)
            .map(([jid, data]) => {
                return { jid, ...data, totalMoney: (data.money || 0) + (data.bank || 0) };
            })
            .sort((a, b) => b.totalMoney - a.totalMoney)
            .slice(0, 10);

        if (sortedUsers.length === 0) return sendFakeQuoted(denn, m, 'Belum ada user yang bermain RPG.', { title: 'Leaderboard', body: 'Kosong' });

        let txt = `🏆 *TOP 10 GLOBAL (TERKAYA)* 🏆\n\n`;
        
        sortedUsers.forEach((user, index) => {
            let medal = `${index + 1}.`;
            if (index === 0) medal = '🥇';
            if (index === 1) medal = '🥈';
            if (index === 2) medal = '🥉';

            const name = user.name || user.jid.split('@')[0];
            
            txt += `${medal} *${name}*\n`;
            txt += `└ 💰 Total: $${user.totalMoney.toLocaleString('id-ID')} (Lv.${user.level || 1})\n\n`;
        });

        await sendFakeQuoted(denn, m, txt, { title: 'Top Global', body: 'Patrick MD RPG' });
    }
};