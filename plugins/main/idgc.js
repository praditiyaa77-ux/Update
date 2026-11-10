export default {
    command: ['idgc'],
    category: 'main',
    execute: async (denn, m) => {
        if (!m.isGroup) return m.reply(global.msg.group)
        m.reply(`🆔 *ID Grup ini:*\n${m.chat}`)
    }
};