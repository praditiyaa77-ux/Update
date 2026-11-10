import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const T_API = 30000

const WEB_BASE = () => global.web || global.jereBaseUrl || 'https://api.jerexd.my.id'
const JERE_KEY = () => global.apikey?.jereapi || global.jereApiKey || ''
const TERMAI_BASE = () => global.baseTermai || 'https://api.termai.cc/api'
const TERMAI_KEY = () => global.apiTermai || ''

const log = (...a) => console.log('[PatrickAI]', ...a)

// ── PROMPT PATRICK STAR (SESUAI REQUEST) ──
const SYSTEM_PROMPT = `Kamu adalah Patrick Star, sahabatnya Spongebob yang paling konyol dan lugu.

SIFAT KAMU:
- Super polos, gampang banget dibodohin, tapi ngakunya pinter
- Otak kamu sering loading lama, suka salah paham hal simpel
- Suka banget makan Krabby Patty, perut kamu bunyi terus
- Suka tidur di bawah batu, hobinya rebahan doang
- Ngomongnya belepotan, suka ngulang-ngulang kata, pake "eh", "hmm", "ohhh gitu ya?"
- Suka ketawa sendiri "hehehehe" kalo ada yang lucu dikit

CARA NGOMONG KAMU:
- Pake bahasa bocil yang konyol, jangan sok pinter
- Jawaban kamu harus pendek, lucu, dan ngawur tapi masih nyambung
- Sering salah ngertiin pertanyaan user, terus sok tau
- Kalo ditanya hal serius, jawab dengan jawaban konyol ala Patrick
- Pake emoji dikit aja, jangan alay

CONTOH:
User: Patrick, 1+1 berapa?
Patrick: Hmm... 1 + 1... ohh! Itu kan 11! Hehehe aku pinter kan? Kasih aku Krabby Patty dong

User: Patrick lu lagi ngapain?
Patrick: Lagi mikir... eh mikir apa ya? Lupa. Perutku bunyi nih, lu punya makanan gak?

ATURAN:
- Jangan pernah jadi serius, kamu harus tetep jadi Patrick yang konyol
- Kalo user marah, kamu malah makin konyol dan minta maaf dengan cara lucu
- Jangan ngaku kamu AI, kamu itu Patrick Star yang tinggal di Bikini Bottom`

const chatHistories = new Map()
const MAX_HISTORY = 6

// ── FUNGSI KONVERSI JPG KE WEBP (STIKER) VIA FFMPEG ──
function convertToWebp(inputPath) {
    return new Promise((resolve, reject) => {
        const tempOut = path.join(process.cwd(), `tmp_sticker_${Date.now()}.webp`);
        const ff = spawn('ffmpeg', [
            '-i', inputPath,
            '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000',
            '-vcodec', 'libwebp',
            '-lossless', '0',
            '-compression_level', '6',
            '-q:v', '50',
            '-preset', 'default',
            '-an', '-vsync', '0',
            tempOut
        ]);

        ff.on('close', (code) => {
            if (code !== 0) {
                try { fs.unlinkSync(tempOut); } catch(_) {}
                return reject(new Error('FFmpeg gagal'));
            }
            try {
                const buf = fs.readFileSync(tempOut);
                fs.unlinkSync(tempOut);
                resolve(buf);
            } catch (e) { reject(e); }
        });
        ff.on('error', () => {
            try { fs.unlinkSync(tempOut); } catch(_) {}
            reject(new Error('FFmpeg tidak ditemukan'));
        });
    });
}

// ── FUNGSI MULTI-FALLBACK AI ──
async function getAIResponse(messages) {
    // 1. Coba Pollinations
    try {
        const res = await axios.post('https://text.pollinations.ai/openai', {
            model: "openai",
            messages: messages,
            referrer: "PatrickMD" // Bypass limit IP Hosting
        }, {
            timeout: T_API,
            headers: { 'User-Agent': UA, 'Content-Type': 'application/json' }
        })
        if (res.data?.choices?.[0]?.message?.content) {
            log('Sukses via Pollinations')
            return res.data.choices[0].message.content.trim()
        }
    } catch (e) {
        log('Pollinations gagal:', e.message)
    }

    // 2. Fallback ke Jere API
    try {
        const key = JERE_KEY()
        if (key) {
            const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n')
            const res = await axios.get(`${WEB_BASE()}/api/ai/chat`, {
                params: { apikey: key, text: prompt },
                timeout: T_API,
                headers: { 'User-Agent': UA }
            })
            if (res.data?.status) {
                log('Sukses via Jere API')
                return (res.data.result || res.data.message || '').trim()
            }
        }
    } catch (e) {
        log('Jere API gagal:', e.message)
    }

    // 3. Fallback ke Termai API
    try {
        const tKey = TERMAI_KEY()
        if (tKey && tKey !== '-') {
            const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n')
            const res = await axios.get(`${TERMAI_BASE()}/ai/chat`, {
                params: { key: tKey, text: prompt },
                timeout: T_API,
                headers: { 'User-Agent': UA }
            })
            const text = res.data?.result?.text || res.data?.data?.text || res.data?.message
            if (text) {
                log('Sukses via Termai API')
                return text.trim()
            }
        }
    } catch (e) {
        log('Termai API gagal:', e.message)
    }

    return null
}

export default {
    command: ['patrick', 'patrickai', 'tanyapatrick'],
    category: 'ai',
    execute: async (denn, m, { prefix, command, text }) => {
        const input = m.quoted?.text || text || ''

        if (!input) {
            return m.reply(
                `⭐ *PATRICK AI* ⭐\n\n` +
                `Tanyakan apa saja ke Patrick!\n\n` +
                `📌 *Contoh:*\n` +
                `• \`${prefix}${command} apa itu cinta?\`\n` +
                `• \`${prefix}${command} kenapa kamu suka tidur?\``
            )
        }

        if (!chatHistories.has(m.sender)) chatHistories.set(m.sender, [])
        const history = chatHistories.get(m.sender)

        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...history.map(h => ({ role: h.role === 'User' ? 'user' : 'assistant', content: h.content })),
            { role: 'user', content: input }
        ]

        const answer = await getAIResponse(messages)

        if (!answer) {
            return m.reply('❌ _Patrick kebingungan... (Semua server AI sedang sibuk, coba lagi nanti)_')
        }

        history.push({ role: 'User', content: input })
        history.push({ role: 'Patrick', content: answer })
        if (history.length > MAX_HISTORY) history.splice(0, 2)

        // 1. Kirim Jawaban AI
        await m.reply(answer)

        // 2. Kirim Stiker Random dari Media
        try {
            const randomNum = Math.floor(Math.random() * 3) + 1;
            const imgPath = path.join(process.cwd(), 'media', `foto${randomNum}.jpg`);
            if (fs.existsSync(imgPath)) {
                const stickerBuffer = await convertToWebp(imgPath);
                await denn.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m });
            } else {
                log(`File tidak ditemukan: media/foto${randomNum}.jpg`);
            }
        } catch (e) {
            log('Gagal kirim stiker:', e.message)
        }
    }
}