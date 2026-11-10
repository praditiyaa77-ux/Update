import axios from 'axios';
import { sendFakeQuoted } from '../../lib/fakequoted.js';

export default {
    command: ['ssweb', 'screenshot', 'sspc', 'sshp', 'ss'],
    category: 'tools',
    execute: async (denn, m, { prefix, command, text }) => {
        if (!text) {
            return sendFakeQuoted(denn, m, 
                `📸 *SCREENSHOT WEBSITE*\n\n` +
                `Format: *${prefix + command} <url>*\n\n` +
                `_Contoh:_\n` +
                `${prefix + command} https://google.com\n` +
                `${prefix + command} github.com --mobile\n` +
                `${prefix + command} youtube.com --full --dark`, 
                {
                    title: 'Screenshot Web',
                    body: 'Masukkan URL yang ingin di-screenshot'
                }
            );
        }

        try {
            await denn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

            let url = text.split(' ')[0].trim();
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }

            // Deteksi argumen tambahan (--mobile, --full, --dark)
            let device = text.includes('--mobile') ? 'mobile' : (text.includes('--tablet') ? 'tablet' : 'desktop');
            let fullPage = text.includes('--full') ? 'true' : 'false';
            let theme = text.includes('--dark') ? 'dark' : 'light';

            // Gunakan global variable dari settings.js
            let apiKey = global.jereApiKey;
            let apiUrl = `${global.jereBaseUrl}/api/tools/ssweb?apikey=${apiKey}&url=${encodeURIComponent(url)}&device=${device}&theme=${theme}&fullPage=${fullPage}`;

            // Request menggunakan axios (Arraybuffer untuk gambar)
            let res = await axios.get(apiUrl, { 
                responseType: 'arraybuffer',
                timeout: 30000 
            });

            let buffer = Buffer.from(res.data || []);
            if (!buffer || buffer.length < 100) {
                throw new Error("Hasil gambar screenshot kosong atau gagal diunduh.");
            }

            let caption = `📸 *SCREENSHOT WEBSITE*\n\n`;
            caption += `🔗 *URL:* ${url}\n`;
            caption += `📱 *Device:* ${device}\n`;
            caption += `🎨 *Theme:* ${theme}\n`;
            caption += `📄 *Full Page:* ${fullPage === 'true' ? 'Ya' : 'Tidak'}\n\n`;
            caption += `✅ *Request by:* ${m.pushName || 'User'}`;

            // Kirim gambar dengan caption
            await denn.sendMessage(m.chat, {
                image: buffer,
                caption: caption
            }, { quoted: m });

            await denn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });

        } catch (e) {
            console.error('[SSWeb Error]', e.message);
            await denn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
            
            sendFakeQuoted(denn, m, `❌ *Gagal Screenshot Web*\nError: ${e.message}`, {
                title: 'Screenshot Gagal',
                body: 'Pastikan URL valid atau coba lagi nanti'
            });
        }
    }
};