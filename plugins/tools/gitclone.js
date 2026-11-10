import { exec } from 'child_process'
import AdmZip from 'adm-zip'
import fs from 'fs'

export default {
    command: ['gitclone'],
    category: 'tools',
    execute: async (denn, m, { prefix, text }) => {
        if (!text) return m.reply(`Contoh: ${prefix}gitclone https://github.com/user/repo`)
        await m.reply(global.msg.wait)
        try {
          const repoName = text.split('/').pop().replace('.git', '')
          const folder = `./tmp_${repoName}_${Date.now()}`
          
          await new Promise((resolve, reject) => {
            exec(`git clone ${text} ${folder}`, (err) => err ? reject(err) : resolve())
          })
          
          const zip = new AdmZip()
          zip.addLocalFolder(folder)
          const zipBuffer = zip.toBuffer()
          
          fs.rmSync(folder, { recursive: true, force: true })
          
          await denn.sendMessage(m.chat, { 
            document: zipBuffer, 
            mimetype: 'application/zip', 
            fileName: `${repoName}.zip`,
            caption: `✅ Berhasil clone repository *${repoName}*`
          }, { quoted: m })
        } catch (e) { m.reply(`❌ Gagal clone: ${e.message}`) }
    }
};