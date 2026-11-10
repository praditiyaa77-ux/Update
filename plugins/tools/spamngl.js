import axios from 'axios';
import { sendFakeQuoted } from '../../lib/fakequoted.js';

export default {
    command: ['spamngl', 'nglspam', 'ngl'],
    category: 'tools',
    execute: async (denn, m, { prefix, command, text }) => {
        if (!text || !text.includes('|')) {
            return sendFakeQuoted(denn, m, 
                `📨 *SPAM NGL.LINK ANONYMOUS*\n\n` +
                `Format: *${prefix + command} <link_ngl>|<pesan>|<jumlah>*\n\n` +
                `_Contoh:_\n` +
                `${prefix + command} https://ngl.link/jerexd|Semangat ngoding bang!|5\n` +
                `${prefix + command} ngl.link/denncode|Halo|3`, 
                {
                    title: 'Spam NGL',
                    body: 'Masukkan link NGL dengan format benar'
                }
            );
        }

        try {
            await denn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

            // Pisahkan parameter berdasarkan tanda |
            let [linkOrUser, question, limit] = text.split('|').map(s => s.trim());
            let count = parseInt(limit || '5');
            
            if (isNaN(count) || count < 1) count = 5;
            if (count > 25) count = 25;

            // ─── EKSTRAK USERNAME DARI LINK ───
            let username = linkOrUser;
            if (/^(https?:\/\/)?(www\.)?ngl\.link\//i.test(linkOrUser)) {
                username = linkOrUser
                    .replace(/^(https?:\/\/)?(www\.)?ngl\.link\//i, '') // Hapus domain
                    .split(/[/?#]/)[0] // Ambil bagian sebelum slash/query
                    .trim();
            } else if (/https?:\/\//i.test(linkOrUser)) {
                return sendFakeQuoted(denn, m, 
                    `❌ Link tidak valid! Pastikan menggunakan link *ngl.link*.\n\nContoh:\n${prefix + command} https://ngl.link/jerexd|Halo|3`, 
                    {
                        title: 'Link Tidak Valid',
                        body: 'Gunakan link ngl.link'
                    }
                );
            }

            if (!username || !question) {
                throw new Error('Username/link dan pesan tidak boleh kosong.');
            }

            // Gunakan API Key dari settings.js
            let apiKey = global.jereApiKey;
            let apiUrl = `${global.jereBaseUrl}/api/tools/spamngl?apikey=${apiKey}&username=${encodeURIComponent(username)}&question=${encodeURIComponent(question)}&limit=${count}`;

            let res = await axios.get(apiUrl, { timeout: 20000 });
            let json = res.data;

            if (!json.status) {
                throw new Error(json.error || json.message || "Gagal mengirim spam NGL.");
            }

            let caption = `📨 *SPAM NGL.LINK BERHASIL*\n\n`;
            caption += `🔗 *Link:* https://ngl.link/${username}\n`;
            caption += `👤 *Username:* ${username}\n`;
            caption += `💬 *Pesan:* ${question}\n`;
            caption += `📊 *Jumlah:* ${count} Pesan\n\n`;
            caption += `✅ *Request by:* ${m.pushName || 'User'}`;

            await sendFakeQuoted(denn, m, caption, {
                title: 'Spam NGL Berhasil',
                body: `Mengirim ${count} pesan ke ${username}`
            });
            
            await denn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

        } catch (e) {
            console.error('[NGL Error]', e.message);
            await denn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
            m.reply(`❌ *Spam NGL Gagal*\nError: ${e.message}`);
        }
    }
};