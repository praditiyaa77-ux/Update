import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'

export default {
    command: ['bratvid'],
    category: 'sticker',
    execute: async (denn, m, { prefix, text }) => {
        if (!text) return m.reply(`Format salah\nContoh:\n${prefix}bratvid halo dunia`)
        await m.reply(global.msg.wait)

        const tmpIn = path.join(process.cwd(), `tmp_bratvid_in_${Date.now()}.mp4`)
        const tmpOut = path.join(process.cwd(), `tmp_bratvid_out_${Date.now()}.webp`)

        try {
            const res = await axios.get(`${global.jereBaseUrl}/api/maker/brat`, {
                params: {
                    apikey: global.jereApiKey,
                    text: text,
                    type: 'video'
                },
                responseType: 'arraybuffer',
                timeout: 30000
            })

            const buffer = Buffer.from(res.data || [])
            if (buffer.length < 100) throw new Error('Gagal mendownload video dari server')
            fs.writeFileSync(tmpIn, buffer)

            await new Promise((resolve, reject) => {
                const ff = spawn('ffmpeg', [
                    '-y', '-i', tmpIn,
                    '-vcodec', 'libwebp',
                    '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000',
                    '-loop', '0',
                    '-ss', '00:00:00.0',
                    '-t', '00:00:10.0',
                    '-preset', 'default',
                    '-an', '-vsync', '0',
                    '-s', '512:512',
                    tmpOut
                ])

                ff.on('close', (code) => {
                    if (code === 0) resolve()
                    else reject(new Error('FFmpeg gagal convert video ke stiker'))
                })
                ff.on('error', reject)
            })

            const stickerBuffer = fs.readFileSync(tmpOut)
            await denn.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m })

        } catch (e) {
            console.error('[BratVid Error]', e.message)
            m.reply(`❌ Gagal generate bratvid: ${e.message}`)
        } finally {
            if (fs.existsSync(tmpIn)) fs.unlinkSync(tmpIn)
            if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut)
        }
    }
};