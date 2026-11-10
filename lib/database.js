import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DB_DIR = path.join(ROOT_DIR, 'database');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const dbPath = path.join(DB_DIR, 'main_db.json');
const tempPath = `${dbPath}.tmp`;

let database = {
    banned: [],
    public: true,
    chats: {} // Untuk settingan grup (antilink, welcome, dll)
};

export const initDatabase = () => {
    try {
        if (fs.existsSync(dbPath)) {
            const parsed = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
            database = { ...database, ...parsed };
        } else {
            saveDatabase();
        }
    } catch (error) {
        console.error('[Database] Gagal memuat main_db.json:', error.message);
    }
    global.db = database;
};

export const saveDatabase = () => {
    try {
        fs.writeFileSync(tempPath, JSON.stringify(database, null, 2));
        fs.renameSync(tempPath, dbPath);
    } catch (error) {
        console.error('[Database] Gagal menyimpan main_db.json:', error.message);
        try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch {}
    }
};

export const getDatabase = () => database;