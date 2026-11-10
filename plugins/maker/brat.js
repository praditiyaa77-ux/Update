import axios from 'axios'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
const T_API = 30000
const T_GLOBAL = 45000
const MAX_TEXT_LENGTH = 150 // Batas maksimal karakter teks

const log = (...a) => console.log('[Brat]', ...a)

const isHtml = (buf) => {
    if (!buf || buf.length < 16) return true
    const head = buf.slice(0, 512).toString('utf8').toLowerCase()
    return head.includes('<!doctype') || head.includes('<html') || head.includes('<body')
}

const isImageBuf = (buf) => {
    if (!buf || buf.length < 100) return false
    if (buf[0] === 0xFF && buf[1] === 0xD8) return true // JPG
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return true // PNG
    if (buf.slice(0, 4).toString('ascii') === 'RIFF' && buf.slice(8, 12).toString('ascii') === 'WEBP') return true // WEBP
    if (buf.slice(0, 3).toString('ascii') === 'GIF') return true // GIF
    return false
}

const withTimeout = (promise, ms, label = 'op') => {
    let t
    const timeout = new Promise((_, rej) => {
        t = setTimeout(() => rej(new Error(`${label} timeout ${ms}ms`)), ms)
    })
    return Promise.race([promise, timeout]).finally(() => clearTimeout(t))
}

export default {
    command: ['brat'],
    category: 'maker',
    execute: async (denn, m, { prefix, text }) => {
        const query = (text || '').trim()
        
        if (!query) {
            return m.reply(
                `📌 *BRAT GENERATOR*\n\n` +
                `• \`${prefix}brat <teks>\`\n\n` +
                `Contoh:\n\`${prefix}brat halo dunia\``
            )
        }

        if (query.length > MAX_TEXT_LENGTH) {
            return m.reply(`❌ Teks terlalu panjang! Maksimal ${MAX_TEXT_LENGTH} karakter.`)
        }

        await m.reply(global.msg.wait)

        const task = (async () => {
            // URL API di-encode agar aman untuk spasi dan karakter khusus
            const apiUrl = `https://aqul-brat.hf.space/api/brat?text=${encodeURIComponent(query)}`
            
            let res
            try {
                res = await withTimeout(axios.get(apiUrl, {
                    responseType: 'arraybuffer',
                    timeout: T_API,
                    maxContentLength: 15 * 1024 * 1024,
                    headers: { 'User-Agent': UA },
                    validateStatus: () => true
                }), T_API + 5000, 'brat-api')
            } catch (e) {
                log('api err:', e.message)
                return m.reply(`❌ Gagal menghubungi server Brat.\n\n_${e.message}_`)
            }

            const outBuf = Buffer.from(res.data || [])
            const ct = String(res.headers['content-type'] || '').toLowerCase()

            // Cek jika API mengembalikan JSON (misal limit/error)
            if (ct.includes('application/json')) {
                let json = null
                try {
                    json = JSON.parse(outBuf.toString('utf8'))
                } catch (_) {
                    return m.reply('❌ Respons API tidak valid (JSON rusak).')
                }
                return m.reply(`❌ API Error: ${json.error || json.message || json.msg || 'Gagal membuat gambar Brat.'}`)
            }

            if (res.status >= 400) {
                return m.reply(`❌ Server Brat error (HTTP ${res.status}).`)
            }

            if (outBuf.length < 1024 || isHtml(outBuf) || !isImageBuf(outBuf)) {
                return m.reply('❌ Hasil dari server bukan gambar yang valid.')
            }

            // Kirim hasil
            const caption = `🎨 *BRAT GENERATOR*\n\n✉️ *Teks:* ${query}\n✨ *Request:* ${m.pushName || 'User'}`

            try {
                await denn.sendMessage(m.chat, { image: outBuf, caption }, { quoted: m })
            } catch (e) {
                log('send image err:', e.message)
                // Fallback jika gagal kirim sebagai gambar (misal resolusi terlalu besar)
                await denn.sendMessage(m.chat, {
                    document: outBuf,
                    mimetype: 'image/png',
                    fileName: `brat_${Date.now()}.png`,
                    caption
                }, { quoted: m })
            }
        })()

        try {
            await withTimeout(task, T_GLOBAL, 'global')
        } catch (e) {
            log('global timeout:', e.message)
            return m.reply(`⏱️ Proses terlalu lama (> ${T_GLOBAL / 1000}s). Coba lagi nanti.`)
        }
    }
}