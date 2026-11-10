import { saveDatabase } from '../../lib/database.js'
import { sendFakeQuoted } from '../../lib/fakequoted.js'

export default {
    command: ['antiswgc2'],
    category: 'group',
    execute: async (denn, m, { prefix, command, args, checkAdmin }) => {
        if (!m.isGroup) return m.reply(global.msg.group)
        
        const { isAdmin, isBotAdmin } = await checkAdmin()
        if (!isAdmin) return m.reply(global.msg.admin)
        if (!isBotAdmin) return m.reply(global.msg.botadmin)

        const action = args[0]?.toLowerCase()
        if (!['on', 'off'].includes(action)) {
            return sendFakeQuoted(denn, m, 
                `🛡️ *ANTI SW GRUP V2)*\n\n` +
                `Fitur ini akan menghapus status (SW) yang men-tag grup ini **DAN** mengeluarkan (kick) member yang membuatnya.\n\n` +
                `⚠️ _Pastikan bot adalah Admin agar bisa melakukan kick._\n\n` +
                `📌 *Format:*\n` +
                `\`${prefix}${command} on\` — Aktifkan\n` +
                `\`${prefix}${command} off\` — Matikan`,
                { title: "Anti SW Tegas", body: "Sistem Keamanan Grup" }
            )
        }

        const gid = m.chat
        if (!global.db.chats[gid]) global.db.chats[gid] = {}

        global.db.chats[gid].antiswgc2 = (action === 'on')
        saveDatabase()

        return sendFakeQuoted(denn, m, 
            `✅ *Anti SW Grup V2* berhasil di-*${action.toUpperCase()}*-kan untuk grup ini.`,
            { title: "Anti SW Tegas", body: "Pengaturan berhasil disimpan" }
        )
    }
}