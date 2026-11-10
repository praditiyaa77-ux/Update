import axios from 'axios';
import { sendFakeQuoted } from '../../lib/fakequoted.js';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) { return dateStr; }
}

export default {
    command: ['githubstalk', 'stalkgithub', 'ghstalk', 'github'],
    category: 'stalker',
    execute: async (denn, m, { prefix, command, text }) => {
        const usernameInput = (text || '').replace(/^@/, '').trim();
        
        if (!usernameInput) {
            return sendFakeQuoted(denn, m, 
                `🐙 *GITHUB STALKER*\n\n*Format:* ${prefix + command} <username>\n*Contoh:* ${prefix + command} torvalds`, 
                { title: 'GitHub Stalker', body: 'Masukkan username GitHub' }
            );
        }
        
        await denn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } });

        try {
            const cleanUsername = usernameInput.replace(/^https?:\/\/(www\.)?github\.com\//i, '').split('/')[0].trim();
            const url = `${global.jereBaseUrl}/api/stalker/stalkgithub?apikey=${global.jereApiKey}&username=${encodeURIComponent(cleanUsername)}`;

            // FIX: Menggunakan POST sesuai requirement API Jere
            const response = await axios.post(url, {}, { 
                timeout: 15000,
                headers: {
                    "Content-Type": "application/json"
                }
            });
            
            const json = response.data;

            if (!json.status || !json.result) {
                throw new Error(json.error || json.message || json.detail || "Akun GitHub tidak ditemukan");
            }

            const p = json.result;
            const createdAt = formatDate(p.created_at);
            const updatedAt = formatDate(p.updated_at);

            let card = `╭━━━〔 🐙 *GITHUB PROFILE* 〕━━━\n`;
            card += `┃ 👤 *Username:* @${p.username || cleanUsername}\n`;
            card += `┃ 🏷️ *Name:* ${p.name || '-'}\n`;
            card += `┃ 📝 *Bio:* ${p.bio || '-'}\n`;
            card += `┃ 👥 *Followers:* ${p.followers?.toLocaleString?.() ?? (p.followers || 0)}\n`;
            card += `┃ 👣 *Following:* ${p.following?.toLocaleString?.() ?? (p.following || 0)}\n`;
            card += `┃ 📦 *Public Repos:* ${p.public_repos ?? 0}\n`;
            card += `┃ 📋 *Public Gists:* ${p.public_gists ?? 0}\n`;
            card += `┃ 📅 *Joined Date:* ${createdAt}\n`;
            card += `┃ 🔄 *Last Activity:* ${updatedAt}\n`;
            if (p.company) card += `┃ 🏢 *Company:* ${p.company}\n`;
            if (p.location) card += `┃ 📍 *Location:* ${p.location}\n`;
            if (p.blog) card += `┃ 🌐 *Blog / Web:* ${p.blog}\n`;
            card += `┃ 🔗 *Profile Link:* ${p.url || `https://github.com/${p.username || cleanUsername}`}\n`;
            card += `╰━━━━━━━━━━━━━━━━━━━━━━━`;

            const avatarUrl = p.avatar || p.avatar_url;
            if (avatarUrl && avatarUrl.startsWith('http')) {
                try {
                    await denn.sendMessage(m.chat, { image: { url: avatarUrl }, caption: card }, { quoted: m });
                } catch { await m.reply(card); }
            } else {
                await m.reply(card);
            }

            await denn.sendMessage(m.chat, { react: { text: "✅", key: m.key } });
        } catch (e) {
            console.error('GitHub Stalk Error:', e.message);
            await denn.sendMessage(m.chat, { react: { text: "❌", key: m.key } });
            sendFakeQuoted(denn, m, `❌ *Gagal Stalk GitHub:* ${e.message}`, { title: 'GitHub Stalker', body: 'Gagal mengambil data' });
        }
    }
};