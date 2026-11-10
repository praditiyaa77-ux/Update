import { getUser, saveUser, formatMoney, parseAmount } from '../../lib/rpg.js';
import { sendFakeQuoted } from '../../lib/fakequoted.js';

export default {
  command: ['taruhan','bet'],
  category: 'rpg',
  execute: async (denn, m, { text, prefix }) => {
    const amount = parseAmount(text);
    if (!amount) return sendFakeQuoted(denn, m, `Contoh: ${prefix}taruhan 1000`, { title: 'Format Salah', body: 'Masukkan nominal' });
    
    const user = getUser(m.sender);
    if ((user.money || 0) < amount) return sendFakeQuoted(denn, m, 'Saldo kurang', { title: 'Gagal', body: 'Uang tidak cukup' });
    
    const win = Math.random() > 0.5;
    if (win) {
      user.money += amount;
      saveUser(m.sender, user);
      await sendFakeQuoted(denn, m, `🟢 Menang! +${formatMoney(amount)}\nSaldo: ${formatMoney(user.money)}`, { title: 'Taruhan', body: 'Hoki Hari Ini' });
    } else {
      user.money -= amount;
      saveUser(m.sender, user);
      await sendFakeQuoted(denn, m, `🔴 Kalah! -${formatMoney(amount)}\nSaldo: ${formatMoney(user.money)}`, { title: 'Taruhan', body: 'Coba Lagi' });
    }
  }
};