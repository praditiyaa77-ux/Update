import axios from 'axios';
import { sendFakeQuoted } from '../../lib/fakequoted.js';

// Helper: Coba GET dulu, kalau gagal coba POST
const fetchWithFallback = async (url, timeout = 15000) => {
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
    command: ['tiktokstalk', 'stalktiktok', 'ttstalk'],
    category: 'stalker',
    execute: async (denn, m, { prefix, command, text }) => {
        const usernameInput = (text || '').replace(/^@/, '').trim();
        
        if (!usernameInput) {
            return sendFakeQuoted(denn, m, 
                `🎵 *TIKTOK USER STALKER*\n\n*Format:* ${prefix + command} <username>\n*Contoh:* ${prefix + command} tiktok`, 
                { title: 'TikTok Stalker', body: 'Masukkan username TikTok' }
            );
        }
        
        await denn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

        try {
            const cleanUsername = usernameInput.replace(/^https?:\/\/(www\.)?tiktok\.com\/@/i, '').split('/')[0].trim();
            
            // ─── 1. Search Video Teratas (GET → POST fallback) ───
            const searchUrl = `${global.jereBaseUrl}/api/search/tiktok?apikey=${global.jereApiKey}&query=${encodeURIComponent(cleanUsername)}`;
            const jsonSearch = await fetchWithFallback(searchUrl);

            let topVideo = null;
            if (jsonSearch && jsonSearch.status && Array.isArray(jsonSearch.result)) {
                topVideo = jsonSearch.result[0] || null;
            }

            // ─── 2. Data Repost (GET → POST fallback) ───
            const repUrl = `${global.jereBaseUrl}/api/stalker/tiktokrepost?apikey=${global.jereApiKey}&username=${encodeURIComponent(cleanUsername)}`;
            const jsonRep = await fetchWithFallback(repUrl);
            const repostData = (jsonRep && jsonRep.status) ? jsonRep.result : null;

            if (!topVideo && !repostData) {
                throw new Error("Akun TikTok atau konten pengguna tidak ditemukan (atau API sedang down).");
            }

            const authorName = topVideo?.author || repostData?.videos?.[0]?.pembuat?.nama || cleanUsername;
            const profileUrl = `https://www.tiktok.com/@${cleanUsername}`;

            let card = `╭━━━〔 🎵 *TIKTOK PROFILE STALKER* 〕━━━\n`;
            card += `┃ 👤 *Username:* @${cleanUsername}\n`;
            card += `┃ 🏷️ *Full Name:* ${authorName}\n`;
            if (topVideo?.title) card += `┃ 📝 *Latest Bio:* ${topVideo.title}\n`;
            if (repostData) card += `┃ 🔁 *Total Repost:* ${repostData.total || 0} video\n`;
            if (topVideo) {
                card += `┃ 👁️ *Latest Views:* ${topVideo.stats?.views?.toLocaleString?.() || 0}\n`;
                card += `┃ ❤️ *Latest Likes:* ${topVideo.stats?.likes?.toLocaleString?.() || 0}\n`;
                card += `┃ 💬 *Latest Comments:* ${topVideo.stats?.comments?.toLocaleString?.() || 0}\n`;
                card += `┃ 🔄 *Latest Shares:* ${topVideo.stats?.shares?.toLocaleString?.() || 0}\n`;
            }
            card += `┃ 💎 *Verified:* ✅ TikTok Creator\n`;
            card += `┃ 🔗 *Profile Link:* ${profileUrl}\n`;
            card += `╰━━━━━━━━━━━━━━━━━━━━━━━`;

            const coverImg = repostData?.videos?.[0]?.pembuat?.foto || topVideo?.cover_url || topVideo?.cover || repostData?.videos?.[0]?.cover;
            
            if (coverImg && coverImg.startsWith('http')) {
                try {
                    await denn.sendMessage(m.chat, { image: { url: coverImg }, caption: card }, { quoted: m });
                } catch { await m.reply(card); }
            } else {
                await m.reply(card);
            }

            await denn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
            
        } catch (e) {
            console.error('TikTok Stalk Error:', e.message);
            await denn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
            
            sendFakeQuoted(denn, m, `❌ *Gagal Stalk TikTok:* ${e.message}`, { 
                title: 'TikTok Stalker Gagal', 
                body: 'Akun tidak ditemukan atau server API down.' 
            });
        }
    }
};