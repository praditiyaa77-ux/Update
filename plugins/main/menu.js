import os from 'os';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { spawn } from 'child_process';
import { clockString, formatSize } from '../../lib/helper.js';

const TMP_DIR = path.join(process.cwd(), 'database', 'tmp');
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

async function downloadImage(url) {
  if (!url || typeof url !== 'string' || !/^https?:\/\//i.test(url)) return null;
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 12000,
      maxContentLength: 5 * 1024 * 1024,
      headers: { 'User-Agent': 'Mozilla/5.0' },
      validateStatus: () => true
    });
    if (res.status >= 400) return null;
    const buf = Buffer.from(res.data || []);
    if (buf.length < 100) return null;
    const head = buf.slice(0, 200).toString('utf8').toLowerCase();
    if (head.includes('<!doctype') || head.includes('<html')) return null;
    return buf;
  } catch {
    return null;
  }
}

function makeSquareThumb(buffer, size = 300) {
  return new Promise((resolve) => {
    const tmpIn = path.join(TMP_DIR, `menu_in_${Date.now()}.jpg`);
    const tmpOut = path.join(TMP_DIR, `menu_out_${Date.now()}.jpg`);
    try { fs.writeFileSync(tmpIn, buffer); } catch { return resolve(null); }

    const ff = spawn('ffmpeg', [
      '-y', '-i', tmpIn,
      '-vf', `crop='min(iw,ih)':'min(iw,ih)',scale=${size}:${size}:flags=lanczos`,
      '-q:v', '5', '-frames:v', '1', tmpOut
    ]);

    ff.on('close', (code) => {
      try { fs.unlinkSync(tmpIn); } catch {}
      if (code !== 0) {
        try { fs.unlinkSync(tmpOut); } catch {}
        return resolve(null);
      }
      try {
        const out = fs.readFileSync(tmpOut);
        fs.unlinkSync(tmpOut);
        if (out.length < 100 || out.length > 200 * 1024) return resolve(null);
        resolve(out);
      } catch { resolve(null); }
    });

    ff.on('error', () => {
      try { fs.unlinkSync(tmpIn); } catch {}
      resolve(null);
    });
  });
}

function getTimeInZone(timeZone) {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(new Date()).replace(/\./g, ':');
  } catch {
    return '--:--:--';
  }
}

export default {
  command: ['menu', 'help'],
  category: 'main',
  execute: async (denn, m, { prefix, isOwner }) => {
    const uptime = clockString(process.uptime() * 1000);
    const tanggal = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const totalFitur = global.plugins ? global.plugins.size : 0;
    const ram = `${formatSize(os.totalmem() - os.freemem())} / ${formatSize(os.totalmem())}`;
    const platform = os.platform();
    const status = isOwner ? '👑 Owner' : '👤 User';

    const jamWIB  = getTimeInZone('Asia/Jakarta');
    const jamWITA = getTimeInZone('Asia/Makassar');
    const jamWIT  = getTimeInZone('Asia/Jayapura');

    // Kelompokkan command (hanya command UTAMA, tanpa alias)
    const categorized = {};
    if (global.plugins) {
      global.plugins.forEach((plugin) => {
        if (!plugin || !plugin.command) return;
        if (plugin.category === 'hidden') return;

        const cat = (plugin.category || 'other').toLowerCase();
        const cmds = Array.isArray(plugin.command) ? plugin.command : [plugin.command];
        const validCmds = cmds.filter(c => typeof c === 'string' && c.trim() !== '');
        if (validCmds.length === 0) return;

        const mainCmd = validCmds[0];
        if (!categorized[cat]) categorized[cat] = new Set();
        categorized[cat].add(mainCmd);
      });
    }

    const categoryOrder = [
      'main', 'anonymous', 'downloader', 'tools', 'group', 'stalker', 'rpg', 'fun', 'game',
      'anime', 'islamic', 'info', 'search', 'owner', 'panel', 'maker', 'sticker', 'other'
    ];
    
    const categoryTitles = {
      main: 'MAIN MENU', anonymous: 'ANONYMOUS', downloader: 'DOWNLOADER',
      tools: 'TOOLS & CONVERT', group: 'GROUP MENU', stalker: 'SOCIAL STALKER',
      rpg: 'RPG & EKONOMI', fun: 'FUN & ISENG', game: 'GAME', anime: 'ANIME',
      islamic: 'ISLAMIC', info: 'INFORMASI', search: 'PENCARIAN', owner: 'OWNER MENU',
      panel: 'PANEL MENU', maker: 'MAKER & AI', sticker: 'STICKER', other: 'LAINNYA'
    };

    const categoryEmojis = {
      main: '⚙️', anonymous: '🕵️', downloader: '📥', tools: '🛠️', group: '👥',
      stalker: '🔍', rpg: '🎮', fun: '🎉', game: '🕹️', anime: '🌸',
      islamic: '🕌', info: 'ℹ️', search: '🔎', owner: '👑', panel: '💻',
      maker: '🎨', sticker: '🎨', other: '📦'
    };

    let dynamicMenu = '';
    
    for (const cat of categoryOrder) {
      if (!categorized[cat] || categorized[cat].size === 0) continue;
      
      const title = categoryTitles[cat] || cat.toUpperCase();
      const emoji = categoryEmojis[cat] || '📦';
      const sortedCmds = Array.from(categorized[cat]).sort();
      
      // ─── DESAIN KATEGORI BARU ───
      dynamicMenu += `【 ${emoji} *${title}* 】\n`;
      for (const cmd of sortedCmds) {
        dynamicMenu += `  ◃ ${prefix}${cmd}\n`;
      }
      dynamicMenu += `\n`;
    }

    // ─── TAMPILAN MENU BARU (TECH MINIMALIST) ───
    const menu = `
 Halo Saya Adalah _${global.namabot.toUpperCase()}_
Saya Asisten Bot Whatsapp Yang Siap Membantu Kamu Kapan Pun Kamu Butuh.
Saya Dibuat Untuk Menemani Kamu, Melayani Kamu, Dan Membuat Hari-Hari Kamu Jadi Lebih Mudah Dan Lebih Seru.

┌─ [ 👤 *USER INFO* ]
│ ◈ Nama   : ${m.pushName || 'User'}
│ ◈ Status : ${status}
│ ◈ Mode   : ${global.db?.public ? '🌐 PUBLIC' : '🔒 SELF'}
└──────────────

┌─ [ 🖥️ *SISTEM INFO* ]
│ ◈ WIB    : ${jamWIB}
│ ◈ WITA   : ${jamWITA}
│ ◈ WIT    : ${jamWIT}
│ ◈ Tanggal: ${tanggal}
│ ◈ Uptime : ${uptime}
│ ◈ OS     : ${platform}
│ ◈ RAM    : ${ram}
│ ◈ Fitur  : ${totalFitur} Command
└──────────────

${dynamicMenu}✦ *Powered by ©${global.namaowner}* ✦
`.trim();

    const rawThumb = await downloadImage(global.thumbnail);
    const squareThumb = rawThumb ? await makeSquareThumb(rawThumb) : null;

    const msgContent = {
      image: { url: global.fotomenu },
      caption: menu,
      contextInfo: {
        externalAdReply: {
          title: global.namabot,
          body: `Fitur: ${totalFitur} | Uptime: ${uptime}`,
          thumbnail: squareThumb || undefined,
          thumbnailUrl: !squareThumb ? global.thumbnail : undefined,
          sourceUrl: global.linkMenu,
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    };

    try {
      await denn.sendMessage(m.chat, msgContent, { quoted: m });
    } catch (e) {
      try {
        await denn.sendMessage(m.chat, { text: menu, contextInfo: msgContent.contextInfo }, { quoted: m });
      } catch (_) {
        await m.reply(menu);
      }
    }
  }
};