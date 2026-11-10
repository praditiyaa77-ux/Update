import axios from 'axios';
import { sendFakeQuoted } from '../../lib/fakequoted.js';

export default {
    command: ['web2apk', 'buatapk', 'linktoapk'],
    category: 'tools',
    execute: async (denn, m, { prefix, command, text }) => {
        if (!text || !text.includes('|')) {
            return sendFakeQuoted(denn, m, 
                `📱 *WEB TO APK CONVERTER*\n\n` +
                `Format: *${prefix + command} <url>|<nama app>*\n\n` +
                `_Contoh:_\n` +
                `${prefix + command} https://google.com|GoogleApp`, 
                {
                    title: 'Web to APK',
                    body: 'Masukkan URL dan nama aplikasi'
                }
            );
        }

        let [url, name] = text.split('|').map(s => s.trim());
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        if (!name) {
            return m.reply('❌ Nama aplikasi tidak boleh kosong.');
        }

        // 1. Beri respon instan ke user
        await denn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });
        await m.reply("⏳ *Sedang memproses...*\n_Mengompilasi website menjadi APK Android. Proses ini memakan waktu 1-3 menit. Bot akan mengirim file jika sudah selesai._");

        // 2. Jalankan proses di belakang layar (Background)
        (async () => {
            try {
                let apiKey = global.jereApiKey;
                let apiUrl = `${global.jereBaseUrl}/api/tools/web2apk?apikey=${apiKey}`;
                
                console.log(`[Web2APK] Memulai proses untuk: ${url} -> ${name}`);

                // Gunakan timeout sangat besar untuk background process
                let res = await axios.post(apiUrl, { url, name }, { timeout: 300000 });
                let json = res.data;

                if (!json || !json.status) throw new Error(json?.error || "API gagal membuat APK.");

                let data = json.result || {};
                let downloadUrl = data.download_url;

                if (!downloadUrl) throw new Error('API tidak mengembalikan link download APK.');

                console.log(`[Web2APK] Berhasil dibuat. Mendownload APK...`);

                // Download file APK
                let apkRes = await axios.get(downloadUrl, { 
                    responseType: 'arraybuffer',
                    timeout: 120000 
                });
                
                let apkBuffer = Buffer.from(apkRes.data || []);
                if (!apkBuffer || apkBuffer.length < 100) throw new Error('File APK kosong.');

                let safeName = name.replace(/[^a-zA-Z0-9_\-]/g, '_');

                let caption = `📱 *APK BERHASIL DIBUAT*\n\n`;
                caption += `📛 *Nama App:* ${data.app_name || name}\n`;
                caption += `📦 *Package:* ${data.package_name || '-'}\n\n`;
                caption += `✅ *Request by:* ${m.pushName || 'User'}`;

                // Kirim dokumen APK
                await denn.sendMessage(m.chat, {
                    document: apkBuffer,
                    fileName: `${safeName}.apk`,
                    mimetype: 'application/vnd.android.package-archive',
                    caption: caption
                }, { quoted: m });

                await denn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
                console.log(`[Web2APK] Selesai & berhasil dikirim.`);

            } catch (err) {
                console.error('[Web2APK Background Error]', err.message);
                await denn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
                
                sendFakeQuoted(denn, m, `❌ *Web2APK Gagal*\n\nError: ${err.message}`, {
                    title: 'Gagal Membuat APK',
                    body: 'Server API mungkin sedang sibuk atau mati.'
                });
            }
        })();
    }
};