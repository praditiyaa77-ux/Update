import { getUser, saveUser, addXP, formatMoney } from '../../lib/rpg.js';
import { sendFakeQuoted } from '../../lib/fakequoted.js';

export default {
    command: ['kerja', 'work'],
    category: 'rpg',
    execute: async (denn, m) => {
        const user = getUser(m.sender);
        const cooldown = 300000;
        const now = Date.now();

        if (user.lastKerja && now - user.lastKerja < cooldown) {
            const timeLeft = cooldown - (now - user.lastKerja);
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            return sendFakeQuoted(denn, m, `😫 Kamu masih kelelahan!\nIstirahat selama *${minutes} menit ${seconds} detik* lagi.`, { title: 'Cooldown', body: 'Bekerja' });
        }

        const jobs = [
            { name: "Kuli Bangunan", pay: 1500 },
            { name: "Kurir Paket", pay: 2000 },
            { name: "Programmer", pay: 3500 },
            { name: "Driver Ojek", pay: 1800 },
            { name: "Barista Cafe", pay: 2200 }
        ];

        const job = jobs[Math.floor(Math.random() * jobs.length)];
        const bonusXP = Math.floor(Math.random() * 20) + 10;

        user.money = (user.money || 0) + job.pay;
        user.lastKerja = now;
        saveUser(m.sender, user);
        
        const result = addXP(m.sender, bonusXP);
        const updated = getUser(m.sender);

        let teks = `💼 *KERJA SELESAI!*\n\nKamu bekerja sebagai *${job.name}*.\n\n`;
        teks += `💰 Gaji: *${formatMoney(job.pay)}*\n✨ XP didapat: *+${bonusXP}*\n`;
        teks += `💵 Dompet: ${formatMoney(updated.money)}\n`;
        teks += `📊 Level: ${updated.level}`;
        if (result.levelsGained) teks += `\n🎉 Naik ${result.levelsGained} level!`;

        await sendFakeQuoted(denn, m, teks, { title: 'Pekerjaan', body: 'Patrick MD RPG' });
    }
};