import axios from 'axios';

export default {
    command: ['owner'],
    category: 'main',
    execute: async (denn, m) => {
        // 1. Format vCard Kontak
        const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${global.namaowner}\nTEL;type=CELL;type=VOICE;waid=${global.owner}:+${global.owner}\nEND:VCARD`;

        // 2. Ambil gambar dari URL dan ubah ke Buffer
        let jpegThumbnail = Buffer.from([]);
        try {
            const res = await axios.get('https://img3.pixhost.to/images/7061/802508584_denncode.jpg', { 
                responseType: 'arraybuffer',
                timeout: 10000 
            });
            jpegThumbnail = Buffer.from(res.data || []);
        } catch (e) {
            console.error('[Owner Contact] Gagal download thumbnail:', e.message);
        }

        // 3. Trik Fake Product (qtoko) dengan Thumbnail
        const qtoko = {
            key: {
                fromMe: false,
                participant: `0@s.whatsapp.net`,
                ...(m.chat ? { remoteJid: "status@broadcast" } : {})
            },
            message: {
                "productMessage": {
                    "product": {
                        "productImage": {
                            "mimetype": "image/jpeg",
                            "jpegThumbnail": jpegThumbnail // Buffer gambar dimasukkan ke sini
                        },
                        "title": `WhatsApp Bot By ${global.namaowner}`,
                        "description": null,
                        "currencyCode": "IDR",
                        "priceAmount1000": "99999999999999999",
                        "retailerId": `P`,
                        "productImageCount": 1
                    },
                    "businessOwnerJid": `0@s.whatsapp.net`
                }
            }
        };

        // 4. Kirim pesan Kontak dengan Quote Toko
        await denn.sendMessage(m.chat, { 
            contacts: { 
                displayName: global.namaowner, 
                contacts: [{ vcard }] 
            } 
        }, { quoted: qtoko });
    }
};