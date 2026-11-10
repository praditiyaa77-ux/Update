import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DB_DIR = path.join(ROOT_DIR, 'database');

// Pastikan folder database ada
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const dbPath = path.join(DB_DIR, 'rpg_db.json');
const tempPath = `${dbPath}.tmp`;
let rpgData = {};

const defaultUser = () => ({
  name: '', level: 1, xp: 0, money: 1000, limit: 20, health: 100,
  bank: 0, dailyStreak: 0, inventory: {},
  lastAbsen: 0, lastAdventure: 0, lastDungeon: 0, lastExplore: 0, 
  lastFarm: 0, lastGajian: 0, lastHunt: 0, lastKerja: 0, 
  lastMancing: 0, lastMining: 0, lastDaily: 0
});

const toNumber = (value, fallback, min = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.floor(number)) : fallback;
};

const normalizeUser = (data = {}) => {
  const user = { ...defaultUser(), ...data };
  user.level = toNumber(user.level, 1, 1);
  user.xp = toNumber(user.xp, 0);
  user.money = toNumber(user.money, 1000);
  user.bank = toNumber(user.bank, 0);
  user.limit = toNumber(user.limit, 20);
  user.health = Math.min(100, toNumber(user.health, 100));
  
  const timeKeys = [
    'lastAbsen', 'lastAdventure', 'lastDungeon', 'lastExplore', 
    'lastFarm', 'lastGajian', 'lastHunt', 'lastKerja', 
    'lastMancing', 'lastMining', 'lastDaily', 'dailyStreak'
  ];
  
  for (const key of timeKeys) user[key] = toNumber(user[key], 0);
  
  user.inventory = user.inventory && typeof user.inventory === 'object' && !Array.isArray(user.inventory)
    ? user.inventory : {};
    
  for (const [id, qty] of Object.entries(user.inventory)) {
    const safeQty = toNumber(qty, 0);
    if (safeQty > 0) user.inventory[id] = safeQty;
    else delete user.inventory[id];
  }
  return user;
};

try {
  if (fs.existsSync(dbPath)) {
    const parsed = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      for (const [jid, data] of Object.entries(parsed)) rpgData[jid] = normalizeUser(data);
    }
  }
} catch (error) {
  console.error('[RPG] Database gagal dibaca:', error.message);
}

const save = () => {
  try {
    fs.writeFileSync(tempPath, JSON.stringify(rpgData, null, 2));
    fs.renameSync(tempPath, dbPath);
  } catch (error) {
    console.error('[RPG] Database gagal disimpan:', error.message);
    try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch {}
  }
};

export const getUser = (jid) => {
  if (!rpgData[jid]) {
    rpgData[jid] = defaultUser();
    save();
  } else {
    rpgData[jid] = normalizeUser(rpgData[jid]);
  }
  return rpgData[jid];
};

export const saveUser = (jid, data) => {
  rpgData[jid] = normalizeUser(data);
  save();
  return rpgData[jid];
};

export const getAllUsers = () => rpgData;

export const addXP = (jid, amount) => {
  const user = getUser(jid);
  const gained = toNumber(amount, 0);
  user.xp += gained;
  let levelsGained = 0;

  while (user.xp >= user.level * 100) {
    user.xp -= user.level * 100;
    user.level += 1;
    levelsGained += 1;
    user.money += user.level * 500;
    user.limit += 5;
    user.health = 100;
  }

  saveUser(jid, user);
  return { ...user, levelsGained, gainedXP: gained };
};

export const formatMoney = (amount) => `$${toNumber(amount, 0).toLocaleString('id-ID')}`;

export const parseAmount = (value, max = 1000000) => {
  if (!/^\d+$/.test(String(value || ''))) return null;
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount > 0 && amount <= max ? amount : null;
};