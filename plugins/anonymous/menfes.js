import axios from 'axios'
import { getUser } from '../../lib/userdb.js'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const T_THUMB = 15000

// Database sementara di memori
const menfessDB = new Map()

// ── FUNGSI AMBIL THUMBNAIL BUFFER ──
async function fetchThumbnail(url) {
    const targetUrl = url || global.thumbnail
    if (!targetUrl || typeof targetUrl !== 'string' || !/^https?:\/\//i.test(targetUrl)) return null
    
    try {
        const res = await axios.get(targetUrl, {
            responseType: 'arraybuffer',
            timeout: T_THUMB,
            maxContentLength: 5 * 1024 * 1024,
            headers: { 'User-Agent': UA }
        })
        const buf = Buffer.from(res.data || [])
        // Validasi magic bytes gambar
        if (buf.length < 100) return null
        if (buf[0] === 0xFF && buf[1] === 0xD8) return buf // JPG
        if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return buf // PNG
        if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return buf // WEBP
        return null
    } catch (_) {
        return null
    }
}

// ── PASSIVE LISTENER (PROXY BALASAN) ──
if (!(global.passiveListeners instanceof Map)) {
    global.passiveListeners = new Map();
}

global.passiveListeners.delete('*_menfess');
global.passiveListeners.set('*_menfess', async (denn, m, body) => {
    try {
        if (!m.quoted || !m.quoted.key || !m.quoted.key.id) return false;

        const quotedId = m.quoted.key.id;
        const data = menfessDB.get(quotedId);

        if (data) {
            const { senderJid, receiverJid } = data;
            const currentJid = m.sender;
            const target = (currentJid === senderJid) ? receiverJid : senderJid;
            
            if (!target) return false;

            const targetUser = getUser(target);
            if (!targetUser) {
                await m.reply('⚠️ Tidak bisa mengirim balasan. Pengguna tersebut mungkin sudah tidak terdaftar atau menghapus bot.');
                return true;
            }

            const isFromOriginalSender = (currentJid === senderJid);
            const header = isFromOriginalSender 
                ? `📩 *BALASAN ANONIM UNTUKMU*\n\n` 
                : `📩 *BALASAN DARI PENERIMA*\n\n`;

            // Ambil thumbnail buffer
            const thumbBuffer = await fetchThumbnail(global.thumbnail);

            const sentMsg = await denn.sendMessage(target, {
                text: `${header}${body}\n\n_Balas (reply) pesan ini untuk membalas lagi secara anonim._`,
                contextInfo: {
                    externalAdReply: {
                        title: "Pesan Anonim Masuk",
                        body: "Privasi terjaga 100%",
                        thumbnail: thumbBuffer || undefined,
                        thumbnailUrl: !thumbBuffer ? global.thumbnail : undefined,
                        mediaType: 1,
                        renderLargerThumbnail: false,
                        sourceUrl: "https://whatsapp.com/channel/0029Vb8vySGAYlUMLcZVFT3d/102"
                    }
                }
            });

            if (sentMsg && sentMsg.key && sentMsg.key.id) {
                menfessDB.set(sentMsg.key.id, {
                    senderJid: target,
                    receiverJid: currentJid
                });
            }

            await m.reply('✅ Balasan anonim kamu berhasil dikirim.');
            return true;
        }
        return false;
    } catch (e) {
        console.error('[Menfess] Error pada listener:', e.message);
        return false;
    }
});

export default {
    command: ['menfess', 'menfes', 'nf'],
    category: 'anonymous',
    execute: async (denn, m, { prefix, command, text, isOwner }) => {
        if (!text) {
            return m.reply(
                `📩 *MENFESS (PESAN ANONIM)*\n\n` +
                `Kirim pesan rahasia tanpa ketahuan siapa pengirimnya!\n\n` +
                `📌 *Format:*\n` +
                `\`${prefix}${command} <nomor> <pesan>\`\n\n` +
                `📌 *Contoh:*\n` +
                `\`${prefix}${command} 628123456789 Halo, aku suka sama kamu dari dulu\`\n\n` +
                `_Penerima bisa membalas pesan ini, dan balasannya akan diteruskan ke kamu secara anonim._`
            );
        }

        const match = text.match(/^(\d+)\s+(.+)$/s);
        if (!match) {
            return m.reply(`❌ Format salah! Pastikan ada spasi antara nomor dan pesan.\nContoh:\n\`${prefix}${command} 628xxx Halo\``);
        }

        const targetNumber = match[1].trim();
        const pesan = match[2].trim();

        if (targetNumber.length < 10 || targetNumber.length > 15) {
            return m.reply('❌ Nomor tidak valid! Gunakan format kode negara (contoh: 628xxx).');
        }

        const targetJid = `${targetNumber}@s.whatsapp.net`;

        if (targetJid === m.sender) {
            return m.reply('❌ Kamu tidak bisa mengirim menfess ke dirimu sendiri.');
        }

        const targetUser = getUser(targetJid);
        if (!targetUser && !isOwner) {
            return m.reply('❌ Nomor tersebut belum terdaftar sebagai pengguna bot ini.');
        }

        await m.reply('⏳ Sedang mengirim pesan anonim...');

        try {
            const [onWa] = await denn.onWhatsApp(targetJid);
            if (!onWa || !onWa.exists) {
                return m.reply('❌ Nomor tersebut tidak terdaftar di WhatsApp.');
            }

            // Ambil thumbnail buffer untuk externalAdReply
            const thumbBuffer = await fetchThumbnail(global.thumbnail);

            const sentMsg = await denn.sendMessage(targetJid, {
                text: `📩 *PESAN ANONIM MASUK*\n\n${pesan}\n\n_Balas (reply) pesan ini untuk membalas secara anonim. Identitasmu akan dirahasiakan._`,
                contextInfo: {
                    externalAdReply: {
                        title: "Pesan Anonim Masuk",
                        body: "Privasi terjaga 100%",
                        thumbnail: thumbBuffer || undefined,
                        thumbnailUrl: !thumbBuffer ? global.thumbnail : undefined,
                        mediaType: 1,
                        renderLargerThumbnail: false,
                        sourceUrl: "https://whatsapp.com/channel/0029Vb8vySGAYlUMLcZVFT3d/102"
                    }
                }
            });

            if (sentMsg && sentMsg.key && sentMsg.key.id) {
                menfessDB.set(sentMsg.key.id, {
                    senderJid: m.sender,
                    receiverJid: targetJid
                });
            }

            await m.reply('✅ Pesan anonim berhasil dikirim!\n\nTunggu balasan dari dia ya. Kalau dia balas, kamu akan dapat notifikasinya di sini.');
        } catch (e) {
            console.error('[Menfess] Gagal kirim:', e.message);
            await m.reply(`❌ Gagal mengirim menfess.\n\n_${e.message}_`);
        }
    }
}