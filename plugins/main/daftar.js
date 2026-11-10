import crypto from 'crypto';
import { getUser, saveUser } from '../../lib/userdb.js';
import { sendFakeQuoted } from '../../lib/fakequoted.js'; // Import helper FakeQuoted

export default {
    command: ['daftar', 'register'],
    category: 'main',
    execute: async (denn, m, { prefix, text }) => {
        const jid = m.sender;

        // Cek jika sudah terdaftar
        if (getUser(jid)) {
            return sendFakeQuoted(denn, m, '✅ Kamu sudah terdaftar di database bot.', {
                title: 'Pendaftaran Gagal',
                body: 'Akun kamu sudah terdaftar'
            });
        }

        if (!text) {
            return sendFakeQuoted(denn, m, 
                `📝 *PENDAFTARAN USER*\n\n` +
                `Silakan daftar dengan format:\n` +
                `\`${prefix}daftar <nama> <umur>\`\n\n` +
                `📌 *Contoh:*\n` +
                `\`${prefix}daftar Budi Santoso 20\``, 
                {
                    title: 'Formulir Pendaftaran',
                    body: 'Silakan isi nama dan umur kamu'
                }
            );
        }

        // Pisahkan nama dan umur (umur diambil dari kata terakhir)
        const parts = text.trim().split(' ');
        if (parts.length < 2) {
            return sendFakeQuoted(denn, m, `❌ Format salah!\nGunakan: \`${prefix}daftar <nama> <umur>\``, {
                title: 'Format Salah',
                body: 'Nama dan umur wajib diisi'
            });
        }

        const ageString = parts.pop(); // Ambil umur
        const name = parts.join(' '); // Gabung sisa kata sebagai nama
        
        const age = parseInt(ageString);

        // Validasi Umur
        if (isNaN(age)) {
            return sendFakeQuoted(denn, m, '❌ Umur harus berupa angka!', {
                title: 'Validasi Gagal',
                body: 'Umur harus berupa angka'
            });
        }
        if (age < 7) {
            return sendFakeQuoted(denn, m, '👶 Anak kecil gaboleh main HP!', {
                title: 'Validasi Gagal',
                body: 'Umur terlalu muda'
            });
        }
        if (age >= 70) {
            return sendFakeQuoted(denn, m, '👴 Gunakan Umur Anda dengan benar!', {
                title: 'Validasi Gagal',
                body: 'Umur tidak wajar'
            });
        }

        // Generate Serial Number (Format: USER-XXX-YYY)
        const serial = 'USER-' + crypto.randomBytes(3).toString('hex').toUpperCase() + '-' + crypto.randomBytes(2).toString('hex').toUpperCase();

        // Waktu pendaftaran
        const date = new Date();
        const waktu = date.toLocaleDateString('id-ID', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });

        // Simpan ke database
        const userData = {
            name,
            age,
            serial,
            registeredAt: date.toISOString()
        };

        if (saveUser(jid, userData)) {
            await sendFakeQuoted(denn, m, 
                `✅ *PENDAFTARAN BERHASIL*\n\n` +
                `👤 *Nama:* ${name}\n` +
                `🎂 *Umur:* ${age} Tahun\n` +
                `📅 *Waktu:* ${waktu}\n` +
                `🆔 *Serial Number:* \`${serial}\`\n\n` +
                `_Identitas Serial Number ini akan muncul di profil Anda. Sekarang kamu bisa menggunakan semua fitur bot!_`,
                {
                    title: 'Pendaftaran Berhasil',
                    body: 'Selamat datang di Patrick MD!'
                }
            );
        } else {
            sendFakeQuoted(denn, m, '❌ Gagal menyimpan data pendaftaran. Coba lagi.', {
                title: 'Pendaftaran Gagal',
                body: 'Terjadi kesalahan pada database'
            });
        }
    }
};