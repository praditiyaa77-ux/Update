import { getUser, saveUser, parseAmount, formatMoney } from '../../lib/rpg.js';
import { sendFakeQuoted } from '../../lib/fakequoted.js';

export default {
  // Ditambahkan 'withdraw' dan 'wd' di sini
  command: ['bank', 'atm', 'nabung', 'tarik', 'withdraw', 'wd'],
  category: 'rpg',
  execute: async (denn, m, { prefix, command, text }) => {
    const user = getUser(m.sender);
    
    // Cek jika hanya buka menu bank
    if (command === 'bank' || command === 'atm') {
      return sendFakeQuoted(denn, m, 
        `🏦 *BANK CENTRAL*\n\n` +
        `👤 Pemilik: *${user.name || m.pushName || 'Pemain'}*\n` +
        `💵 Dompet: *${formatMoney(user.money)}*\n` +
        `🏦 Tabungan: *${formatMoney(user.bank)}*\n\n` +
        `Gunakan ${prefix}nabung <jumlah> atau ${prefix}tarik <jumlah>.`, 
        {
          title: 'Bank Central', 
          body: 'Cek saldo & tabunganmu'
        }
      );
    }

    // Validasi nominal
    const amount = parseAmount((text || '').trim(), 1000000000);
    if (!amount) {
      return sendFakeQuoted(denn, m, 
        `Masukkan jumlah bulat yang valid.\nContoh: ${prefix}${command} 5000`, 
        { title: 'Format Salah', body: 'Masukkan nominal angka' }
      );
    }
    
    if (amount < 100) {
      return sendFakeQuoted(denn, m, 'Minimal transaksi adalah $100.', { 
        title: 'Transaksi Gagal', 
        body: 'Minimal $100' 
      });
    }
    
    // Logika Nabung / Tarik (Withdraw)
    if (command === 'nabung') {
      if (user.money < amount) {
        return sendFakeQuoted(denn, m, 'Uang di dompet tidak cukup.', { title: 'Gagal Nabung', body: 'Dompet kurang' });
      }
      user.money -= amount;
      user.bank += amount;
    } else {
      // Ini menangani .tarik, .withdraw, dan .wd
      if (user.bank < amount) {
        return sendFakeQuoted(denn, m, 'Saldo bank tidak cukup.', { title: 'Gagal Tarik', body: 'Saldo bank kurang' });
      }
      user.bank -= amount;
      user.money += amount;
    }
    
    saveUser(m.sender, user);
    
    return sendFakeQuoted(denn, m, 
      `✅ Transaksi berhasil\n💵 Dompet: ${formatMoney(user.money)}\n🏦 Bank: ${formatMoney(user.bank)}`, 
      { 
        title: 'Transaksi Berhasil', 
        body: command === 'nabung' ? 'Uang disimpan ke bank' : 'Uang ditarik dari bank' 
      }
    );
  }
};