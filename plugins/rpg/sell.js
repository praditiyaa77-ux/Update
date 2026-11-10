import { getUser, saveUser, parseAmount, formatMoney } from '../../lib/rpg.js';
import { items } from '../../lib/items.js';
import { sendFakeQuoted } from '../../lib/fakequoted.js';

export default {
  command: ['sell', 'jual'],
  category: 'rpg',
  execute: async (denn, m, { prefix, text }) => {
    const [itemIdRaw, amountRaw = '1', ...extra] = (text || '').trim().split(/\s+/);
    if (!itemIdRaw || extra.length) return sendFakeQuoted(denn, m, `Format: ${prefix}sell <id_barang> <jumlah>\nContoh: ${prefix}sell ikan_lele 2`, { title: 'Format Salah', body: 'Cek format jual' });
    
    const itemId = itemIdRaw.toLowerCase();
    const item = items[itemId];
    if (!item) return sendFakeQuoted(denn, m, 'ID barang tidak ditemukan.', { title: 'Gagal', body: 'Item tidak ada' });
    
    const amount = parseAmount(amountRaw, 100);
    if (!amount) return sendFakeQuoted(denn, m, 'Jumlah harus angka bulat antara 1–100.', { title: 'Gagal', body: 'Nominal salah' });
    
    const user = getUser(m.sender);
    if ((user.inventory[itemId] || 0) < amount) return sendFakeQuoted(denn, m, `Jumlah ${item.name} di tas tidak cukup.`, { title: 'Gagal', body: 'Item kurang' });
    
    const total = Math.floor(item.price * 0.5) * amount;
    user.inventory[itemId] -= amount;
    if (!user.inventory[itemId]) delete user.inventory[itemId];
    user.money = (user.money || 0) + total;
    saveUser(m.sender, user);
    
    return sendFakeQuoted(denn, m, `✅ Berhasil menjual ${amount}x ${item.name}\nDiterima: ${formatMoney(total)}\nDompet: ${formatMoney(user.money)}`, { title: 'Toko', body: 'Penjualan Sukses' });
  }
};