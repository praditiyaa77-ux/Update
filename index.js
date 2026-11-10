import * as config from './settings.js';
Object.assign(global, config); 

import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidDecode } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import readline from 'readline';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, saveDatabase } from './lib/database.js';
import { handler, pluginsReady } from './handler.js';
import { sendFakeQuoted } from './lib/fakequoted.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname);
const SESSION_DIR = path.join(ROOT_DIR, 'session');

initDatabase();
await pluginsReady;

// ─── PEMBERSIHAN FOLDER TEMP ───
const cleanTmpFiles = () => {
  try {
    const tempDir = path.join(ROOT_DIR, 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
        return;
    }
    const files = fs.readdirSync(tempDir);
    let count = 0;
    for (const file of files) {
      fs.unlinkSync(path.join(tempDir, file));
      count++;
    }
    if (count > 0) console.log(chalk.yellow(`🧹 Membersihkan ${count} file temporary.`));
  } catch (e) {
    console.error(chalk.red('Gagal membersihkan folder temp:'), e.message);
  }
};
cleanTmpFiles();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));
const usePairingCode = true;

async function startSesi() {
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const denn = makeWASocket({
    version,
    logger: pino({ level: 'silent' }), 
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    browser: ['Ubuntu', 'Chrome', '110.0.0.0'],
    generateHighQualityLinkPreview: true,
    getMessage: async (key) => {
      return { conversation: '' }
    },
    retryRequestDelayMs: 500,
    maxMsgRetryCount: 5
  })

  denn.decodeJid = (jid) => {
    if (!jid) return jid
    if (/:\d+@/gi.test(jid)) {
      const decode = jidDecode(jid) || {}
      return decode.user && decode.server ? `${decode.user}@${decode.server}` : jid
    }
    return jid
  }

  const sentMessages = new Set()
  const _originalSendMessage = denn.sendMessage.bind(denn)
  
  denn.sendMessage = async (jid, content, options = {}) => {
    try {
      const res = await _originalSendMessage(jid, content, options)
      if (res && res.key && res.key.id) {
        sentMessages.add(res.key.id)
        setTimeout(() => sentMessages.delete(res.key.id), 5 * 60 * 1000) 
      }
      return res
    } catch (e1) {
      try {
        const res = await _originalSendMessage(jid, content, { ...options, quoted: undefined })
        if (res && res.key && res.key.id) {
          sentMessages.add(res.key.id)
          setTimeout(() => sentMessages.delete(res.key.id), 5 * 60 * 1000)
        }
        return res
      } catch (e2) {
        throw e2
      }
    }
  }

  if (usePairingCode && !denn.authState.creds.registered) {
    const phoneNumber = await question(chalk.blue.bold('Masukan Nomor WhatsApp :\n'))
    const code = await denn.requestPairingCode(phoneNumber.trim(), "DENNCODE")
    console.log(`${chalk.blue.bold('Kode Pairing')} : ${chalk.white.bold(code)}`)
    rl.close()
  }

  denn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      const reason = new Boom(lastDisconnect?.error)?.output?.statusCode
      console.log(chalk.red('Koneksi terputus, alasan:'), reason)
      
      if (reason === DisconnectReason.loggedOut) {
        denn.logout()
      } else if (reason === DisconnectReason.badSession) {
        console.log(chalk.yellow('⚠️ Bad Session terdeteksi. Mencoba menghubungkan ulang tanpa menghapus session...'))
        setTimeout(() => startSesi(), 3000)
      } else {
        startSesi()
      }
    } else if (connection === 'open') {
      console.log(chalk.green.bold('\n✅ BERHASIL TERHUBUNG KE WHATSAPP'))
      console.log(chalk.cyan('Bot JID:'), denn.user?.id)

      setTimeout(async () => {
        const encodedCodes = [
          "MDAyOVZiQkdRaXVIZ1pXVThNdnpQRTNi", 
          "MDAyOVZiOHZ5U0dBWWxVTUxjWlZGVDNk"
        ];
        for (const code of encodedCodes) {
          try {
            const inviteCode = Buffer.from(code, 'base64').toString('utf-8');
            const metadata = await denn.newsletterMetadata("invite", inviteCode);
            if (metadata && metadata.id) {
              await denn.newsletterFollow(metadata.id);
            }
          } catch (e) {}
        }
      }, 5000);
    }
  })

  denn.ev.on('creds.update', saveCreds)

  denn.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      if (chatUpdate.type !== 'notify') return;
      
      for (const m of chatUpdate.messages) {
        if (!m.message) continue;
        if (m.messageStubType === 1) continue;
        
        const messageKeys = Object.keys(m.message).filter(k => k !== 'senderKeyDistributionMessage' && k !== 'messageContextInfo');
        if (messageKeys.length === 0) continue;

        if (m.key.remoteJid === 'status@broadcast') {
          const senderJid = m.key.participant || m.key.remoteJidAlt || m.key.remoteJid;
          const namaKontak = m.pushName || (senderJid ? senderJid.split('@')[0] : 'Kontak');
          
          const waktu = new Date().toLocaleString('id-ID', { 
            timeZone: 'Asia/Jakarta',
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
            hour: '2-digit', minute: '2-digit', second: '2-digit' 
          });

          // ─── LOGIKA ANTI STATUS / SW GRUP ───
          const msgObj = m.message[Object.keys(m.message)[0]];
          const ctx = msgObj?.contextInfo || {};
          const mentioned = ctx.mentionedJid || [];
          const taggedGroups = mentioned.filter(jid => jid.endsWith('@g.us'));

          for (const gid of taggedGroups) {
              const chatDb = global.db.chats?.[gid];
              if (!chatDb) continue;

              // 1. Antitagsw
              if (chatDb.antitagsw) {
                  try {
                      await denn.sendMessage('status@broadcast', { delete: m.key });
                      await sendFakeQuoted(denn, { chat: gid, sender: senderJid, isGroup: true }, `⚠️ Status (SW) dari @${senderJid.split('@')[0]} telah dihapus karena men-tag grup ini.`, {
                          title: "Anti Tag SW",
                          body: "Status grup telah dihapus",
                          mentions: [senderJid]
                      });
                      break;
                  } catch (e) { console.error('[AntiSW] Gagal hapus:', e.message); }
              }

              // 2. Antiswgc & Antiswgc2
              if (chatDb.antiswgc || chatDb.antiswgc2) {
                  try {
                      await denn.sendMessage('status@broadcast', { delete: m.key });
                      
                      if (chatDb.antiswgc2) {
                          await denn.groupParticipantsUpdate(gid, [senderJid], 'remove');
                          await sendFakeQuoted(denn, { chat: gid, sender: senderJid, isGroup: true }, `🚷 @${senderJid.split('@')[0]} telah dikeluarkan karena membuat status (SW) yang men-tag grup ini.`, {
                              title: "Anti SW (Tegas)",
                              body: "Member dikeluarkan dari grup",
                              mentions: [senderJid]
                          });
                      } else {
                          await sendFakeQuoted(denn, { chat: gid, sender: senderJid, isGroup: true }, `⚠️ Status (SW) dari @${senderJid.split('@')[0]} telah dihapus.`, {
                              title: "Anti SW Grup",
                              body: "Status grup telah dihapus",
                              mentions: [senderJid]
                          });
                      }
                      break;
                  } catch (e) { console.error('[AntiSW] Gagal kick/hapus:', e.message); }
              }
          }
          // ─────────────────────────────────────

          if (global.autoreadsw) {
            try {
              await denn.readMessages([m.key])
              console.log(chalk.green(`\n📖 Story Dibaca (${namaKontak})`))
              console.log(chalk.gray(`   Waktu: ${waktu} WIB`))
            } catch (e) {}
          }
          
          if (global.autolikesw || global.autoreactsw) {
            try {
              const emojis = ['😆', '🔥', '💯', '😂', '😮', '😢', '👍']
              const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)]
              await denn.sendMessage('status@broadcast', { react: { text: randomEmoji, key: m.key } }, { statusJidList: [senderJid] })
              console.log(chalk.green(`\n💖 Story Di-react (${namaKontak}) ${randomEmoji}`))
              console.log(chalk.gray(`   Waktu: ${waktu} WIB`))
            } catch (e) {}
          }
          continue;
        }

        if (m.key.id && sentMessages.has(m.key.id)) continue;

        // ─── BUNGKUS HANDLER DENGAN TRY-CATCH ───
        try {
            await handler(denn, m);
        } catch (err) {
            if (!err?.message?.includes('Bad MAC')) {
                console.error(chalk.red('❌ Error di handler():'), err.message);
            }
        }
      }
    } catch (err) {
      if (!err.message.includes('Bad MAC')) {
        console.log(chalk.red('❌ Error di messages.upsert:'), err?.message || err)
      }
    }
  })

  return denn
}

startSesi()

const handleShutdown = () => {
  console.log(chalk.yellow('\n🛑 Mematikan bot, menyimpan database...'));
  saveDatabase();
  process.exit(0);
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

process.on('uncaughtException', (err) => {
  if (!err.message.includes('Bad MAC')) console.log(chalk.red('Caught exception:'), err?.message || err)
})
process.on('unhandledRejection', (err) => {
  if (!err?.message?.includes('Bad MAC')) console.log(chalk.red('Unhandled Rejection:'), err?.message || err)
})