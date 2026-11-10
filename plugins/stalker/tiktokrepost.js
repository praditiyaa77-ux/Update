import axios from 'axios';
import { sendFakeQuoted } from '../../lib/fakequoted.js';

// Helper: Coba GET dulu, kalau gagal coba POST
const fetchWithFallback = async (url, timeout = 20000) => {
    try {
        const res = await axios.get(url, { timeout });
        if (res.data && res.data.status) return res.data;
    } catch (e) {}

    try {
        const res = await axios.post(url, {}, { timeout });
        if (res.data && res.data.status) return res.data;
    } catch (e) {}

    return null;
};

export default {
    command: ['ttrepost', 'tiktokrepost', 'reposttt'],
    category: 'stalker',
    execute: async (denn, m, { prefix, command, text }) => {
        const input = (text || '').trim();
        
        if (!input) {
            return sendFakeQuoted(denn, m, 
                `🎵 *TIKTOK REPOST STALKER*\n\n` +
                `*Format:* ${prefix + command} <username> [mode]\n` +
                `*Contoh:* ${prefix + command} username\n\n` +
                `*Opsi:* Tambahkan "semua" untuk menarik lebih banyak video repost:\n` +
                `${prefix + command} username semua`, 
                { title: 'TikTok Repost', body: 'Masukkan username target' }
            );
        }
        
        await denn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

        try {
            const [rawUname, ...modeParts] = input.split(' ');
            const cleanUsername = rawUname.replace(/^@/, '').replace(/^https?:\/\/(www\.)?tiktok\.com\/@/i, '').split('/')[0].trim();
            const mode = modeParts.join(' ').toLowerCase() === 'semua' ? 'semua' : '';

            const url = `${global.jereBaseUrl}/api/stalker/tiktokrepost?apikey=${global.jereApiKey}&username=${encodeURIComponent(cleanUsername)}${mode ? `&mode=${encodeURIComponent(mode)}` : ''}`;
            
            // Ambil data menggunakan helper anti-error
            const data = await fetchWithFallback(url);

            if (!data || !data.result) {
                throw new Error(data?.error || data?.message || "Gagal mengambil data repost TikTok atau user tidak ditemukan");
            }

            const result = data.result;
            const videos = result.videos || [];

            if (videos.length === 0) {
                await denn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
                return m.reply(`⚠️ Tidak ditemukan video repost pada akun TikTok *@${cleanUsername}*.`);
            }

            const firstAuthor = videos[0]?.pembuat;
            let summaryCard = `╭━━━〔 🔁 *TIKTOK REPOST STALKER* 〕━━━\n`;
            summaryCard += `┃ 👤 *Target User:* @${result.username || cleanUsername}\n`;
            if (firstAuthor?.nama) summaryCard += `┃ 🏷️ *Nama:* ${firstAuthor.nama}\n`;
            summaryCard += `┃ 📹 *Total Video Repost:* ${videos.length} video\n`;
            summaryCard += `┃ 🔄 *Ada Lagi:* ${result.adaLagi ? 'Ya' : 'Tidak'}\n`;
            summaryCard += `┃ 💎 *Status:* ✅ Verified Repost Feed\n`;
            summaryCard += `┃ ⏳ *Mengirim video... Mohon tunggu*\n`;
            summaryCard += `╰━━━━━━━━━━━━━━━━━━━━━━━`;

            if (firstAuthor?.foto && firstAuthor.foto.startsWith('http')) {
                try {
                    await denn.sendMessage(m.chat, { image: { url: firstAuthor.foto }, caption: summaryCard }, { quoted: m });
                } catch (errCover) {
                    await m.reply(summaryCard);
                }
            } else {
                await m.reply(summaryCard);
            }

            let sent = 0;
            // Limit to sending max 5 videos to avoid rate limit/flood
            const videosToSend = videos.slice(0, 5);

            for (let i = 0; i < videosToSend.length; i++) {
                const video = videosToSend[i];
                const videoUrl = video.play_tanpa_watermark || video.play_dengan_watermark;
                if (!videoUrl) continue;

                let vidCaption = `╭━━━〔 📹 *VIDEO ${i + 1}/${videosToSend.length}* 〕━━━\n`;
                vidCaption += `┃ 📝 *Judul:* ${video.judul || '-'}\n`;
                vidCaption += `┃ 👤 *Pembuat:* @${video.pembuat?.username || '-'} (${video.pembuat?.nama || '-'})\n`;
                vidCaption += `┃ ⏱️ *Durasi:* ${video.durasi || 0} detik\n`;
                vidCaption += `┃ 👁️ *Views:* ${video.stats?.ditonton?.toLocaleString?.() || 0}\n`;
                vidCaption += `┃ ❤️ *Likes:* ${video.stats?.disukai?.toLocaleString?.() || 0}\n`;
                vidCaption += `┃ 💬 *Comments:* ${video.stats?.komentar?.toLocaleString?.() || 0}\n`;
                vidCaption += `┃ 🔗 *Music:* ${video.musik_info?.judul || '-'} - ${video.musik_info?.artis || '-'}\n`;
                vidCaption += `╰━━━━━━━━━━━━━━━━━━━━━━━`;

                try {
                    const videoResponse = await axios.get(videoUrl, {
                        responseType: 'arraybuffer',
                        timeout: 45000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
                        }
                    });
                    const videoBuffer = Buffer.from(videoResponse.data);

                    await denn.sendMessage(m.chat, {
                        video: videoBuffer,
                        caption: vidCaption,
                        fileName: `tiktok_repost_${cleanUsername}_${i + 1}.mp4`
                    }, { quoted: m });
                    sent++;

                    if (i < videosToSend.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1500));
                    }
                } catch (err) {
                    console.error(`Gagal download video ${i + 1}:`, err.message);
                    // Fallback: send cover image with link
                    if (video.cover) {
                        try {
                            await denn.sendMessage(m.chat, {
                                image: { url: video.cover },
                                caption: `${vidCaption}\n\n*Direct Play Link:* ${videoUrl}`
                            }, { quoted: m });
                            sent++;
                        } catch (e2) {}
                    }
                }
            }

            if (sent === 0) {
                await denn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
                return m.reply("❌ Gagal mengunduh file media video. Server video upstream mungkin dibatasi.");
            }

            await denn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
            
        } catch (e) {
            console.error('TikTok Repost Error:', e.message);
            await denn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
            
            sendFakeQuoted(denn, m, `❌ *Gagal Stalk Repost:* ${e.message}`, { 
                title: 'TikTok Repost Gagal', 
                body: 'Akun tidak ditemukan atau server API down.' 
            });
        }
    }
};