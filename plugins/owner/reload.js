import { sendFakeQuoted } from '../../lib/fakequoted.js';

export default {
    command: ['reload', 'r'],
    category: 'owner',
    execute: async (denn, m, { isOwner }) => {
        if (!isOwner) {
            return sendFakeQuoted(denn, m, global.msg?.owner || '❌ Lu bukan Owner!', {
                title: 'Akses Ditolak',
                body: 'Fitur ini khusus Owner'
            });
        }
        
        await sendFakeQuoted(denn, m, '🔄 Sedang memuat ulang semua plugin...', {
            title: 'Reload Plugin',
            body: 'Mohon tunggu sebentar'
        });
        
        try {
            // Memanggil fungsi dari global (tanpa import handler.js)
            const total = await global.reloadPlugins();
            
            await sendFakeQuoted(denn, m, 
                `✅ *BERHASIL RELOAD!*\n\n` +
                `Sebanyak *${total}* alias command/plugin telah dimuat ulang tanpa restart.`, 
                {
                    title: 'Reload Berhasil',
                    body: `${total} command dimuat ulang`
                }
            );
            console.log(`[Reload] Berhasil me-reload ${total} plugin.`);
        } catch (e) {
            console.error('[Reload Error]', e.message);
            await sendFakeQuoted(denn, m, `❌ Gagal me-reload plugin:\n\n${e.message}`, {
                title: 'Reload Gagal',
                body: 'Terjadi kesalahan'
            });
        }
    }
};