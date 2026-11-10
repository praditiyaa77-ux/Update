import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DB_DIR = path.join(ROOT_DIR, 'database');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const dbPath = path.join(DB_DIR, 'users.json');
const tempPath = `${dbPath}.tmp`;

let users = {};

try {
    if (fs.existsSync(dbPath)) {
        users = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }
} catch (error) {
    console.error('[UserDB] Gagal memuat users.json:', error.message);
}

const save = () => {
    try {
        fs.writeFileSync(tempPath, JSON.stringify(users, null, 2));
        fs.renameSync(tempPath, dbPath);
    } catch (error) {
        console.error('[UserDB] Gagal menyimpan users.json:', error.message);
        try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch {}
    }
};

export const getUser = (jid) => {
    return users[jid] || null;
};

export const saveUser = (jid, data) => {
    try {
        users[jid] = data;
        save();
        return true;
    } catch (error) {
        return false;
    }
};

export const getAllUsers = () => users;