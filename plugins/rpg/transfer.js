import { getUser, saveUser, formatMoney, parseAmount } from '../../lib/rpg.js';
import { sendFakeQuoted } from '../../lib/fakequoted.js';

export default {
  command: ['tf', 'transfer'],
  category: 'rpg',
  execute: async (denn, m, { prefix, getTarget, args }) => {
    const target = getTarget();
    // Mengambil nominal dengan aman (hanya angka)
    const amountStr = args.find(a => /^\d+$/.test(a));
    const amount = parseAmount(amountStr);
    
    if (!target || !amount) {
      return sendFakeQuoted(denn, m, `Contoh: ${prefix}tf @user 1000`, { title: 'Format Salah', body: 'Transfer gagal' });
    }
    
    const user = getUser(m.sender);
    const targetUser = getUser(target);
    
    if ((user.money || 0) < amount) {
      return sendFakeQuoted(denn, m, 'Saldo tidak cukup', { title: 'Transfer Gagal', body: 'Uang kamu kurang' });
    }
    
    user.money -= amount;
    targetUser.money = (targetUser.money || 0) + amount;
    
    saveUser(m.sender, user);
    saveUser(target, targetUser);
    
    await sendFakeQuoted(denn, m, `💸 *TRANSFER BERHASIL*\n\nBerhasil transfer *${formatMoney(amount)}* ke @${target.split('@')[0]}\nSisa saldo: ${formatMoney(user.money)}`, { 
      title: 'Transfer Berhasil', 
      body: `Mengirim uang ke ${target.split('@')[0]}`, 
      mentions: [target] 
    });
  }
};