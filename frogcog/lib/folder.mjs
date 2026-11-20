/* FrogCog binder: the folder on the person's computer.
 *
 * Everything the person records lives in one folder they pick:
 *   binder.json        the records, in the shape of the app's backup (pictures are files, not text inside it)
 *   binder.prev.json   the file as it was before the last save
 *   files/             photos, receipts and manuals
 *   inbox/             where the person drops a file for the binder to pick up
 *   backups/, exports/ files the binder makes when asked
 *
 * Which folder that is, and the country, are remembered in one small settings file outside it (so the binder can
 * find the folder again). Nothing here uses the network.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const COUNTRIES = ['US', 'GB'];
export const APP_NAME = 'FrogCog';
const FILE = 'binder.json', PREV = 'binder.prev.json', LOCK = 'binder.lock', LOCK_STALE_MS = 30_000;

export class Told extends Error {}                         // a message meant for the person, not a fault
export const told = msg => new Told(msg);

function settingsDir(){
  if (process.env.FROGCOG_SETTINGS_DIR) return process.env.FROGCOG_SETTINGS_DIR;
  if (process.platform === 'win32') return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'FrogCog');
  if (process.platform === 'darwin') return path.join(os.homedir(), 'Library', 'Application Support', 'FrogCog');
  return path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), 'frogcog');
}
export const settingsPath = () => path.join(settingsDir(), 'binder-settings.json');
export const defaultFolder = () => path.join(os.homedir(), 'Documents', 'FrogCog');

export function readSettings(){
  let s = {};
  try { s = JSON.parse(fs.readFileSync(settingsPath(), 'utf8')) || {}; } catch (e) {}
  // A folder or country chosen in the AI tool's own settings screen (where it has one) wins.
  const envFolder = (process.env.FROGCOG_BINDER_DIR || '').trim(), envCountry = (process.env.FROGCOG_COUNTRY || '').trim();
  if (envFolder && !envFolder.includes('${')) s.folder = envFolder;
  if (COUNTRIES.includes(envCountry)) s.country = envCountry;
  return s;
}
export function writeSettings(s){
  fs.mkdirSync(settingsDir(), { recursive: true });
  fs.writeFileSync(settingsPath(), JSON.stringify({ folder: s.folder, country: s.country, noticeRead: s.noticeRead || null }, null, 1));
}

/* The folder, ready to use, or a plain "set up first". */
export function folder(){
  const s = readSettings();
  if (!s.folder || !s.noticeRead) throw told('The FrogCog binder is not set up on this computer yet. Run the set-up first (the skill is /frogcog:set-up). Nothing was saved.');
  const dir = path.resolve(s.folder);
  for (const d of ['files', 'inbox']) fs.mkdirSync(path.join(dir, d), { recursive: true });
  return { dir, country: COUNTRIES.includes(s.country) ? s.country : 'US' };
}

export function emptyBinder(country){
  return {
    app: APP_NAME, schemaVersion: 1, exported: new Date().toISOString(),
    warranties: [], maintenance: [], contacts: [], profile: {}, homePlan: null, seasonal: {}, receipts: [], roomPhotos: {},
    photos: {}, manuals: {},
    // The binder's own corner. The app's importer neither reads it nor minds it.
    binder: { country, lookups: { terms: {}, upkeep: {} }, removed: [], files: {}, recalls: { on: false }, made: new Date().toISOString() },
  };
}

export function load(dir, country){
  const p = path.join(dir, FILE);
  if (!fs.existsSync(p)) return emptyBinder(country);
  let d;
  try { d = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { throw told('binder.json in ' + dir + ' could not be read. Nothing was changed. The file as it was before the last save is binder.prev.json, beside it.'); }
  if (!d || typeof d !== 'object' || !Array.isArray(d.warranties)) throw told('binder.json in ' + dir + ' is not a FrogCog binder. Nothing was changed.');
  const fresh = emptyBinder(country);
  for (const k of ['maintenance', 'contacts', 'receipts']) if (!Array.isArray(d[k])) d[k] = [];
  for (const k of ['profile', 'seasonal', 'roomPhotos']) if (!d[k] || typeof d[k] !== 'object' || Array.isArray(d[k])) d[k] = {};
  d.photos = {}; d.manuals = {};
  d.binder = Object.assign(fresh.binder, d.binder || {});
  for (const k of ['lookups', 'files', 'recalls']) if (!d.binder[k] || typeof d.binder[k] !== 'object') d.binder[k] = fresh.binder[k];
  if (!Array.isArray(d.binder.removed)) d.binder.removed = [];
  for (const k of ['terms', 'upkeep']) if (!d.binder.lookups[k] || typeof d.binder.lookups[k] !== 'object') d.binder.lookups[k] = {};
  d.binder.country = country;
  return d;
}

export function save(dir, binder){
  const p = path.join(dir, FILE), tmp = p + '.' + process.pid + '.tmp';
  binder.exported = new Date().toISOString();
  fs.writeFileSync(tmp, JSON.stringify(binder, null, 1));
  JSON.parse(fs.readFileSync(tmp, 'utf8'));                 // read it back before trusting it
  if (fs.existsSync(p)) fs.copyFileSync(p, path.join(dir, PREV));
  fs.renameSync(tmp, p);
}

/* Read the binder, let `work` change it, save it. One writer at a time: a second AI tool is told to wait.
   `work` returns what to tell the person; returning { unchanged: true, ... } skips the save. */
export async function change(work){
  const { dir, country } = folder();
  const lock = path.join(dir, LOCK);
  try {
    if (fs.existsSync(lock) && Date.now() - fs.statSync(lock).mtimeMs > LOCK_STALE_MS) fs.rmSync(lock);
    fs.writeFileSync(lock, String(process.pid), { flag: 'wx' });
  } catch (e) { throw told('Another program is writing this binder right now. Wait a moment and try again. Nothing was saved.'); }
  try {
    const b = load(dir, country);
    const out = await work(b, { dir, country });
    if (!(out && out.unchanged)) save(dir, b);
    return out;
  } finally { try { fs.rmSync(lock); } catch (e) {} }
}

/* Read only. */
export function read(){
  const { dir, country } = folder();
  return { b: load(dir, country), dir, country };
}

/* A path given by the person or the AI tool, kept inside the binder folder. */
export function inside(dir, rel){
  const p = path.resolve(dir, rel);
  if (p !== dir && !p.startsWith(dir + path.sep)) throw told('That path is outside the FrogCog folder. Nothing was done.');
  return p;
}
