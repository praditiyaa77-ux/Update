import { getUser, saveUser, parseAmount, formatMoney } from '../../lib/rpg.js';
import { items } from '../../lib/items.js';
import { sendFakeQuoted } from '../../lib/fakequoted.js';

export default {
  command: ['buy', 'beli'],
  category: 'rpg',
  execute: async (denn, m, { prefix, text }) => {
    const [itemIdRaw, amountRaw = '1', ...extra] = (text || '').trim().split(/\s+/);
    if (!itemIdRaw || extra.length) return sendFakeQuoted(denn, m, `Format: ${prefix}buy <id_barang> <jumlah>\nContoh: ${prefix}buy ramuan 2`, { title: 'Format Salah', body: 'Cek format pembelian' });
    
    const itemId = itemIdRaw.toLowerCase();
    const item = items[itemId];
    if (!item) return sendFakeQuoted(denn, m, `Barang *${itemId}* tidak tersedia. Cek ${prefix}shop.`, { title: 'Gagal', body: 'Item tidak ada' });
    
    const amount = parseAmount(amountRaw, 100);
    if (!amount) return sendFakeQuoted(denn, m, 'Jumlah harus angka bulat antara 1–100.', { title: 'Gagal', body: 'Nominal salah' });
    
    const total = item.price * amount;
    if (!Number.isSafeInteger(total)) return sendFakeQuoted(denn, m, 'Total pembelian terlalu besar.', { title: 'Gagal', body: 'Limit reached' });
    
    const user = getUser(m.sender);
    if (user.money < total) return sendFakeQuoted(denn, m, `Uang tidak cukup.\nButuh: ${formatMoney(total)}\nDompet: ${formatMoney(user.money)}`, { title: 'Gagal', body: 'Uang kurang' });
    
    user.money -= total;
    user.inventory[itemId] = (user.inventory[itemId] || 0) + amount;
    saveUser(m.sender, user);
    
    return sendFakeQuoted(denn, m, `✅ Pembelian berhasil\n${amount}x ${item.name}\nTotal: ${formatMoney(total)}\nSisa dompet: ${formatMoney(user.money)}`, { title: 'Toko', body: 'Pembelian Sukses' });
  }
};