export default {
    command: ['idch'],
    category: 'main',
    execute: async (denn, m) => {
        if (m.chat.endsWith('@newsletter')) {
          m.reply(`🆔 *ID Channel ini:*\n${m.chat}`)
        } else if (global.idch) {
          m.reply(`🆔 *ID Channel yang terdaftar di bot:*\n${global.idch}`)
        } else {
          m.reply('❌ ID Channel belum diatur di settings.js')
        }
    }
};