import { sendFakeQuoted } from '../lib/fakequoted.js'

const TRIGGERS = ['bot', 'patrick', 'patrickmd', 'patrick md', 'patrickmd bot']
const COOLDOWN_MS = 15000

const lastReply = new Map()

function getUptime() {
    const totalSec = Math.floor(process.uptime())
    const days    = Math.floor(totalSec / 86400)
    const hours   = Math.floor((totalSec % 86400) / 3600)
    const minutes = Math.floor((totalSec % 3600) / 60)
    const seconds = totalSec % 60
    const parts = []
    if (days > 0)    parts.push(`${days} Hari`)
    if (hours > 0)   parts.push(`${hours} Jam`)
    if (minutes > 0) parts.push(`${minutes} Menit`)
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds} Detik`)
    return parts.join(' ')
}

const listener = async (denn, m, body) => {
    const lower = String(body || '').toLowerCase().trim()
    if (!lower) return false
    if (/^[^a-zA-Z0-9\s]/.test(lower)) return false

    const matched = TRIGGERS.find((t) => {
        if (!lower.startsWith(t)) return false
        const rest = lower.slice(t.length)
        return rest === '' || /^[\s,.!?]/.test(rest)
    })
    if (!matched) return false

    const key = `${m.chat}:${m.sender}`
    const now = Date.now()
    const last = lastReply.get(key) || 0
    if (now - last < COOLDOWN_MS) return true
    lastReply.set(key, now)

    if (lastReply.size > 300) {
        for (const [k, v] of lastReply) {
            if (now - v > COOLDOWN_MS * 4) lastReply.delete(k)
        }
    }

    const response =
        `Uhh Kenapa Menggil Aku Lagi Sibuk, Aku Aktif 24 Jam, Dan Aku Sudah Aktif Selama ${getUptime()}\n\n© Denn`

    try {
        await sendFakeQuoted(denn, m, response, {
            title: 'Patrick MD',
            body: 'Runtime : `${getUptime()}'
        })
    } catch (e) {
        console.error('[logicpatrick] Gagal kirim:', e.message)
    }

    return true
}

// Daftarkan listener tanpa console.log
if (global.passiveListeners instanceof Map) {
    global.passiveListeners.set('*', listener)
}

export default { listener }