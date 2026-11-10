import { saveDatabase } from '../../lib/database.js'
import { sendFakeQuoted } from '../../lib/fakequoted.js'

export default {
    command: ['antitagsw'],
    category: 'group',
    execute: async (denn, m, { prefix, command, args, checkAdmin }) => {
        if (!m.isGroup) return m.reply(global.msg.group)
        
        const { isAdmin, isBotAdmin } = await checkAdmin()
        if (!isAdmin) return m.reply(global.msg.admin)
        if (!isBotAdmin) return m.reply(global.msg.botadmin)

        const action = args[0]?.toLowerCase()
        if (!['on', 'off'].includes(action)) {
            return sendFakeQuoted(denn, m, 
                `🛡️ *ANTI TAG SW*\n\n` +
                `Fitur ini akan menghapus status (SW) yang men-tag grup ini.\n\n` +
                `📌 *Format:*\n` +
                `\`${prefix}${command} on\` — Aktifkan\n` +
                `\`${prefix}${command} off\` — Matikan`,
                { title: "Anti Tag SW", body: "Sistem Keamanan Grup" }
            )
        }

        const gid = m.chat
        if (!global.db.chats[gid]) global.db.chats[gid] = {}

        global.db.chats[gid].antitagsw = (action === 'on')
        saveDatabase()

        return sendFakeQuoted(denn, m, 
            `✅ *Anti Tag SW* berhasil di-*${action.toUpperCase()}*-kan untuk grup ini.`,
            { title: "Anti Tag SW", body: "Pengaturan berhasil disimpan" }
        )
    }
}