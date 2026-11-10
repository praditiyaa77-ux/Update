import axios from 'axios';
import { sendFakeQuoted } from '../../lib/fakequoted.js';

export default {
    command: ['igstalk', 'stalkig', 'instagramstalk'],
    category: 'stalker',
    execute: async (denn, m, { prefix, command, text }) => {
        const usernameInput = (text || '').replace(/^@/, '').trim();
        
        if (!usernameInput) {
            return sendFakeQuoted(denn, m, 
                `📸 *INSTAGRAM STALKER*\n\n*Format:* ${prefix + command} <username>\n*Contoh:* ${prefix + command} instagram`, 
                { title: 'Instagram Stalker', body: 'Masukkan username Instagram' }
            );
        }
        
        await denn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

        try {
            let cleanUsername = usernameInput.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').split('/')[0].replace(/^@/, '').trim();
            let data = null;
            let lastError = '';

            // ─── 1. Coba Endpoint Utama (GET) ───
            try {
                const res = await axios.get(`${global.jereBaseUrl}/api/stalker/igstalk?apikey=${global.jereApiKey}&username=${encodeURIComponent(cleanUsername)}`, { timeout: 15000 });
                if (res.data && res.data.status) data = res.data;
            } catch (e) { lastError = e.message; }

            // ─── 2. Coba Endpoint Utama (POST) ───
            if (!data) {
                try {
                    const res = await axios.post(`${global.jereBaseUrl}/api/stalker/igstalk?apikey=${global.jereApiKey}&username=${encodeURIComponent(cleanUsername)}`, {}, { timeout: 15000 });
                    if (res.data && res.data.status) data = res.data;
                } catch (e) { lastError = e.message; }
            }

            // ─── 3. Coba Endpoint Cadangan (Fallback) ───
            if (!data) {
                try {
                    const resFb = await axios.get(`${global.jereBaseUrl}/api/tools/instagram-stalker?apikey=${global.jereApiKey}&username=${encodeURIComponent(cleanUsername)}`, { timeout: 15000 });
                    const jsonFb = resFb.data;
                    if (jsonFb && jsonFb.status && jsonFb.result) {
                        const r = jsonFb.result;
                        data = {
                            status: true,
                            username: r.username || cleanUsername,
                            metadata: {
                                posts: r.posts || '0',
                                followers: r.followers || '0',
                                following: r.following || '0',
                                avatar: r.profilePic || ''
                            },
                            stories: {
                                data: {
                                    user: {
                                        full_name: r.name || '-',
                                        biography: r.bio || '-',
                                        profile_pic_url: r.profilePic || '',
                                        is_private: false,
                                        is_verified: false
                                    }
                                }
                            }
                        };
                    }
                } catch (e) { lastError = e.message; }
            }

            if (!data || !data.status) {
                throw new Error(data?.error || data?.message || lastError || "Akun tidak ditemukan atau profil bersifat private");
            }

            const uname = data.username || cleanUsername;
            const meta = data.metadata || {};
            const u = data.stories?.data?.user || {};

            const fullName = u.full_name || meta.fullName || '-';
            const bio = u.biography || meta.bio || '-';
            const posts = meta.posts || u.edge_owner_to_timeline_media?.count || '0';
            const followers = meta.followers || u.edge_followed_by?.count || '0';
            const following = meta.following || u.edge_follow?.count || '0';
            const isPrivate = typeof u.is_private === 'boolean' ? (u.is_private ? '🔒 Ya (Private)' : '🔓 Tidak (Public)') : '🔓 Public';
            const isVerified = typeof u.is_verified === 'boolean' ? (u.is_verified ? '💎 Ya (Verified)' : '❌ Tidak') : '❌ Tidak';
            const avatar = meta.avatar || u.profile_pic_url || u.profile_pic_url_hd || '';
            const profileUrl = `https://www.instagram.com/${uname}`;

            let card = `╭━━━〔 📸 *INSTAGRAM PROFILE* 〕━━━\n`;
            card += `┃ 👤 *Username:* @${uname}\n`;
            card += `┃ 🏷️ *Full Name:* ${fullName}\n`;
            card += `┃ 📝 *Bio:* ${bio}\n`;
            card += `┃ 👥 *Followers:* ${followers}\n`;
            card += `┃ 👣 *Following:* ${following}\n`;
            card += `┃ 📮 *Total Posts:* ${posts}\n`;
            card += `┃ 💎 *Verified:* ${isVerified}\n`;
            card += `┃ 🔒 *Account Type:* ${isPrivate}\n`;
            card += `┃ 🔗 *Profile Link:* ${profileUrl}\n`;
            card += `╰━━━━━━━━━━━━━━━━━━━━━━━`;

            if (avatar && avatar.startsWith('http')) {
                try {
                    await denn.sendMessage(m.chat, { image: { url: avatar }, caption: card }, { quoted: m });
                } catch { await m.reply(card); }
            } else {
                await m.reply(card);
            }

            await denn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
            
        } catch (e) {
            console.error('IG Stalk Error:', e.message);
            await denn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
            
            sendFakeQuoted(denn, m, `❌ *Gagal Stalk IG:* ${e.message}`, { 
                title: 'Instagram Stalker Gagal', 
                body: 'Akun tidak ditemukan, private, atau server API down.' 
            });
        }
    }
};