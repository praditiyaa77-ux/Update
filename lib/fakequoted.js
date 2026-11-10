import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const T_THUMB = 15000

// Potong gambar jadi persegi (Anti Blank Hitam)
function makeSquareThumb(buffer, size = 300) {
    return new Promise((resolve) => {
        const tmpIn = path.join(process.cwd(), `tmp_thumb_in_${Date.now()}.jpg`);
        const tmpOut = path.join(process.cwd(), `tmp_thumb_out_${Date.now()}.jpg`);
        try { fs.writeFileSync(tmpIn, buffer); } catch { return resolve(buffer); }

        const ff = spawn('ffmpeg', [
            '-y', '-i', tmpIn,
            '-vf', `crop='min(iw,ih)':'min(iw,ih)',scale=${size}:${size}:flags=lanczos`,
            '-q:v', '5', '-frames:v', '1', tmpOut
        ]);

        ff.on('close', (code) => {
            try { fs.unlinkSync(tmpIn); } catch {}
            if (code !== 0) {
                try { fs.unlinkSync(tmpOut); } catch {}
                return resolve(buffer);
            }
            try {
                const out = fs.readFileSync(tmpOut);
                fs.unlinkSync(tmpOut);
                if (out.length < 100 || out.length > 150 * 1024) return resolve(buffer);
                resolve(out);
            } catch { resolve(buffer); }
        });

        ff.on('error', () => {
            try { fs.unlinkSync(tmpIn); } catch {}
            resolve(buffer);
        });
    });
}

async function fetchThumbnail(url) {
    const targetUrl = url || global.thumbnail
    if (!targetUrl || !/^https?:\/\//i.test(targetUrl)) return null
    
    try {
        const res = await axios.get(targetUrl, {
            responseType: 'arraybuffer',
            timeout: T_THUMB,
            maxContentLength: 5 * 1024 * 1024,
            headers: { 'User-Agent': UA }
        })
        const buf = Buffer.from(res.data || [])
        if (buf.length < 100) return null
        
        let isImage = false
        if (buf[0] === 0xFF && buf[1] === 0xD8) isImage = true // JPG
        if (buf[0] === 0x89 && buf[1] === 0x50) isImage = true // PNG
        if (buf.slice(0, 4).toString('ascii') === 'RIFF') isImage = true // WEBP

        if (isImage) return await makeSquareThumb(buf)
        return null
    } catch (_) {
        return null
    }
}

export async function sendFakeQuoted(denn, m, text, options = {}) {
    const thumbBuffer = await fetchThumbnail(global.thumbnail);

    const fakeQuoted = {
        key: {
            fromMe: false,
            participant: '0@s.whatsapp.net',
            remoteJid: m.chat,
            id: '3EB0C767D097BB6F5E9A'
        },
        message: {
            conversation: options.title || 'System PatrickMD'
        }
    };

    const msgContent = {
        text: String(text),
        mentions: options.mentions || [],
        contextInfo: {
            externalAdReply: {
                title: options.title || "Patrick MD",
                body: options.body || "Sistem Keamanan Bot",
                thumbnail: thumbBuffer || undefined,
                thumbnailUrl: !thumbBuffer ? global.thumbnail : undefined,
                mediaType: 1,
                renderLargerThumbnail: false,
                sourceUrl: "https://whatsapp.com/channel/0029Vb8vySGAYlUMLcZVFT3d/102"
            }
        }
    };

    try {
        return await denn.sendMessage(m.chat, msgContent, { quoted: fakeQuoted });
    } catch (e) {
        return await denn.sendMessage(m.chat, { text: String(text), mentions: options.mentions || [] });
    }
}