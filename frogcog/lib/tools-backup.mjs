/* FrogCog binder, stage 1: backups, in the app's own format, so a binder can move between the app, the web app and
 * this plugin. Opening a backup only ever adds: nothing already in the binder is changed or deleted, and every
 * record gets a new id on the way in (the app's own importer does the work).
 *
 * A passphrase is never typed into the chat, where the AI company would see it. The person saves it as one line in
 * a file called passphrase.txt in the binder's inbox folder; the binder reads it, uses it and deletes the file.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { obj, text } from './schema.mjs';
import { change, read, told, inside, APP_NAME } from './folder.mjs';
import { filePath } from './tools-files.mjs';
import { app, today, plural, sameMaker, upkeepPreset } from './common.mjs';
import { makerTerm, upkeepJob } from './proof.mjs';

const IMAGE = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' };
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
const subtle = crypto.webcrypto.subtle;

/* The app's own lock (app/index.html): PBKDF2-SHA256, 250,000 rounds, then AES-GCM with a 256-bit key. */
async function keyFrom(passphrase, salt, usage){
  const material = await subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, [usage]);
}
export async function lockBackup(out, passphrase){
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
  const cipher = await subtle.encrypt({ name: 'AES-GCM', iv }, await keyFrom(passphrase, salt, 'encrypt'), new TextEncoder().encode(JSON.stringify(out)));
  return { app: APP_NAME, encrypted: true, kdf: 'PBKDF2-SHA256-250000', salt: salt.toString('base64'), iv: iv.toString('base64'), ciphertext: Buffer.from(cipher).toString('base64') };
}
export async function unlockBackup(wrapper, passphrase){
  const b = s => Buffer.from(String(s || ''), 'base64');
  const plain = await subtle.decrypt({ name: 'AES-GCM', iv: b(wrapper.iv) }, await keyFrom(passphrase, b(wrapper.salt), 'decrypt'), b(wrapper.ciphertext));
  return JSON.parse(new TextDecoder().decode(plain));
}

function takePassphrase(dir){
  const p = path.join(dir, 'inbox', 'passphrase.txt');
  if (!fs.existsSync(p)) throw told('To use a passphrase without the AI company seeing it: save it as one line in a file called passphrase.txt in the inbox folder (' + path.join(dir, 'inbox') + '), then ask again. The binder reads it and deletes the file. Nothing was done.');
  const pass = fs.readFileSync(p, 'utf8').replace(/^﻿/, '').split(/\r?\n/)[0].trim();
  fs.rmSync(p);
  if (!pass) throw told('passphrase.txt was empty. It has been deleted. Nothing was done.');
  return pass;
}

/* Every picture key a record points at. */
function docKeys(b){
  const keys = [];
  for (const w of b.warranties) for (const d of w.docs || []) keys.push({ k: d.k, of: w.name });
  for (const m of b.maintenance) for (const d of m.docs || []) keys.push({ k: d.k, of: m.title });
  for (const r of b.receipts) for (const d of r.docs || []) keys.push({ k: d.k, of: r.title });
  for (const room of Object.keys(b.roomPhotos || {})) for (const d of b.roomPhotos[room] || []) keys.push({ k: d.k, of: room });
  return keys;
}

/* The binder as the app's backup: the records, with the pictures inside as text and the saved manuals that fit. */
export function collectBackup(b, dir){
  const out = { app: APP_NAME, schemaVersion: app.SCHEMA_VERSION, exported: new Date().toISOString(),
    warranties: b.warranties, maintenance: b.maintenance, contacts: b.contacts, profile: b.profile, homePlan: b.homePlan || null,
    seasonal: b.seasonal, receipts: b.receipts, roomPhotos: b.roomPhotos, photos: {}, manuals: {},
    binder: { country: b.binder.country, lookups: b.binder.lookups } };
  const leftOut = []; let attempted = 0, written = 0;
  for (const { k, of } of docKeys(b)) {
    attempted++;
    const f = b.binder.files[k], p = f && filePath(b, dir, k), type = f && IMAGE[path.extname(f.path).toLowerCase()];
    if (!f || !fs.existsSync(p)) { leftOut.push((f ? f.name : 'a file') + ' (' + of + '): the file is missing from the folder'); continue; }
    if (!type) { leftOut.push(f.name + ' (' + of + '): the app\'s backup carries pictures, not ' + (path.extname(f.path) || 'this kind of') + ' files'); continue; }
    out.photos[k] = 'data:' + type + ';base64,' + fs.readFileSync(p).toString('base64'); written++;
  }
  out.photoCounts = { attempted, written };
  const plan = app.backupManualPlan(b.warranties), manualsOut = plan.leftOut.map(m => m.name + ' (' + m.item + '): too large to fit');
  let included = 0, bytes = 0;
  for (const m of plan.include) {
    const f = b.binder.files[m.k], p = f && filePath(b, dir, m.k);
    const buf = (f && fs.existsSync(p)) ? fs.readFileSync(p) : null;
    if (!buf || !app.isPdfBytes(buf) || bytes + buf.length > plan.limit) { manualsOut.push(m.name + ' (' + m.item + '): ' + (buf ? 'not a PDF, or too large to fit' : 'the file is missing from the folder')); continue; }
    out.manuals[m.k] = buf.toString('base64'); bytes += buf.length; included++;
  }
  out.manualCounts = { saved: plan.include.length + plan.leftOut.length, included, leftOut: manualsOut.length, unread: 0 };
  return { out, leftOut: leftOut.concat(manualsOut), photos: written, manuals: included };
}

function writeFileFor(b, dir, k, bytes, ext, name){
  // The key is one this program made and the name is a plain file name: neither can point outside files/.
  if (!/^[A-Za-z0-9]{1,40}$/.test(String(k))) return;
  const rel = 'files/' + k + ext;
  fs.writeFileSync(inside(dir, rel), bytes);
  b.binder.files[k] = { path: rel, name: app.safeFileName(name || k + ext, k + ext), size: bytes.length };
}
function putPhotos(b, dir, photos){
  let n = 0;
  for (const [k, url] of Object.entries(photos || {})) {
    const m = /^data:(image\/(?:png|jpe?g|webp|gif));base64,(.*)$/is.exec(url || '');
    if (!m) continue;
    writeFileFor(b, dir, k, Buffer.from(m[2], 'base64'), EXT[m[1].toLowerCase().replace('jpg', 'jpeg')] || '.jpg'); n++;
  }
  return n;
}

function findBackup(dir, file){
  const tries = path.isAbsolute(file) ? [file] : [path.join(dir, 'inbox', file), path.join(dir, 'backups', file), path.join(dir, file)];
  const hit = tries.find(p => fs.existsSync(p) && fs.statSync(p).isFile());
  if (!hit) throw told('No backup file was found at "' + file + '". Save it into the inbox folder (' + path.join(dir, 'inbox') + ') and give its name, or give its full path. Nothing was changed.');
  return hit;
}

export const backupTools = [
  {
    name: 'backup_make', title: 'Make a backup the app can open',
    description: 'Writes one backup file into the binder folder\'s "backups" folder, in the FrogCog app\'s own format: every record, the pictures and the saved manuals that fit. The app and the web app open it (Account, Data management, Back up and restore). To lock it with a passphrase, set with_passphrase true after the person has saved the passphrase in passphrase.txt in the inbox folder; never ask them to type a passphrase into the chat.',
    input: obj({ with_passphrase: { type: 'boolean', description: 'True to lock the backup with the passphrase in inbox/passphrase.txt.' } }),
    async run(a){
      const { b, dir } = read();
      const pass = a.with_passphrase ? takePassphrase(dir) : null;
      const c = collectBackup(b, dir);
      fs.mkdirSync(path.join(dir, 'backups'), { recursive: true });
      const file = path.join(dir, 'backups', app.exportFilename(pass ? 'backup-encrypted' : 'backup', today()));
      fs.writeFileSync(file, JSON.stringify(pass ? await lockBackup(c.out, pass) : c.out));
      const counts = plural(b.warranties.length, 'item') + ', ' + plural(b.maintenance.length, 'upkeep job') + ', ' + plural(b.contacts.length, 'contact') + ', ' + plural(b.receipts.length, 'receipt') + ', ' + plural(c.photos, 'picture') + ', ' + plural(c.manuals, 'manual');
      return { text: 'Backup written: ' + file + '\nIt holds ' + counts + '.' + (pass ? ' It is locked with the passphrase; passphrase.txt has been deleted. Without the passphrase the backup cannot be read by anyone.' : ' It is not locked: anyone who has the file can read it.')
          + (c.leftOut.length ? '\nNot in this backup (still in the binder folder):\n' + c.leftOut.map(x => '- ' + x).join('\n') : '')
          + '\nOpen it into an empty binder: opening a backup adds to what is there.',
        data: { file, locked: !!pass, items: b.warranties.length, pictures: c.photos, manuals: c.manuals, left_out: c.leftOut } };
    },
  },
  {
    name: 'backup_open', title: 'Open a backup into the binder',
    description: 'Adds everything in a FrogCog backup file to the binder: one made by the app, the web app or this plugin. It only adds; nothing already here is changed or deleted, so opening the same backup twice adds everything twice. For a backup locked with a passphrase, the person first saves the passphrase in passphrase.txt in the inbox folder; never ask them to type it into the chat. Ask the person to confirm before opening.',
    input: obj({ file: text(400, 'The backup\'s file name if it is in the inbox or backups folder, or its full path.') }, ['file']),
    async run(a){
      const { dir } = read();
      const src = findBackup(dir, a.file);
      let d;
      try { d = JSON.parse(fs.readFileSync(src, 'utf8')); } catch (e) { throw told('That file could not be read: it is not a FrogCog backup. Nothing was changed.'); }
      if (d && d.encrypted === true) {
        const pass = takePassphrase(dir);
        try { d = await unlockBackup(d, pass); } catch (e) { throw told('That passphrase did not open the backup. passphrase.txt has been deleted; save the right one and try again. Nothing was changed.'); }
      }
      const v = app.validateImport(d);
      if (!v.ok) throw told(v.error + ' Nothing was changed.');
      return change(b => {
        const s = app.sanitizeImportedRecords(v.warranties, v.maintenance, v.photos, v.contacts, v.manuals);
        let pictures = putPhotos(b, dir, s.photos), manuals = 0;
        for (const w of s.warranties) { if (!w.manual) continue; const bytes = s.manuals[w.manual.k]; if (bytes) { writeFileFor(b, dir, w.manual.k, Buffer.from(bytes), '.pdf', w.manual.name); manuals++; } else delete w.manual; }
        b.warranties.push(...s.warranties); b.maintenance.push(...s.maintenance); b.contacts.push(...s.contacts);
        const rc = app.sanitizeImportedReceipts(d.receipts, v.photos, s.idMap);
        pictures += putPhotos(b, dir, rc.photos); b.receipts.push(...rc.receipts);
        const rp = app.sanitizeImportedRoomPhotos(d.roomPhotos, v.photos);
        pictures += putPhotos(b, dir, rp.photos);
        for (const room of Object.keys(rp.rooms)) b.roomPhotos[room] = (b.roomPhotos[room] || []).concat(rp.rooms[room]);
        let profile = false;
        if (v.profile && !(b.profile && b.profile.name)) { b.profile = v.profile; profile = true; }
        if (v.homePlan && !b.homePlan) b.homePlan = app.cleanImportedValue(v.homePlan, 0) || null;   // plain values only, as for records
        if (d.seasonal) b.seasonal = app.mergeSeasonal(b.seasonal, d.seasonal);
        // Answers from FrogCog lookups that another binder saved come along (the app's own backups have none). A
        // backup is a file anyone can edit, so each answer is taken only from its signature, checked again here,
        // and only for the maker or the kind of device it is filed under. One that does not check out is left out.
        const L = d.binder && d.binder.lookups;
        let unchecked = 0;
        if (L && typeof L === 'object') {
          for (const [k, t] of Object.entries(L.terms || {})) {
            if (k in b.binder.lookups.terms) continue;
            try { const term = makerTerm(t && t.proof); if (term.country !== b.binder.country || !sameMaker(term.brand, k.split('|')[0])) throw new Error('not for this'); b.binder.lookups.terms[k] = term; } catch (e) { unchecked++; }
          }
          for (const [k, p] of Object.entries(L.upkeep || {})) {
            if (k in b.binder.lookups.upkeep) continue;
            try { const u = upkeepJob(p && p.proof); if (u.country !== b.binder.country || u.appliance !== k || !u.known) throw new Error('not for this'); b.binder.lookups.upkeep[k] = upkeepPreset(u, typeof p.spec === 'string' && p.spec !== u.detail ? p.spec.slice(0, 200) : ''); } catch (e) { unchecked++; }
          }
        }
        const other = ['homes', 'checklists', 'records', 'bills', 'problems', 'turnovers', 'visits'].filter(k => Array.isArray(d[k]) && d[k].length > (k === 'homes' ? 1 : 0));
        const added = plural(s.warranties.length, 'item') + ', ' + plural(s.maintenance.length, 'upkeep job') + ', ' + plural(s.contacts.length, 'contact') + ', ' + plural(rc.receipts.length, 'receipt') + ', ' + plural(pictures, 'picture') + ', ' + plural(manuals, 'manual');
        return { text: 'Added from the backup' + (v.exported ? ' (made ' + v.exported.slice(0, 10) + ')' : '') + ': ' + added + '.' + (profile ? ' The owner\'s details came with it.' : '')
            + (s.manualsMissing.length ? '\nSaved manuals that were not in the backup: ' + s.manualsMissing.map(m => m.name + ' (' + m.item + ')').join('; ') + '.' : '')
            + (other.length ? '\nNot added, because this binder does not keep them: ' + other.join(', ') + '.' : '')
            + (unchecked ? '\n' + plural(unchecked, 'saved answer') + ' from FrogCog lookups in the backup could not be checked and ' + (unchecked === 1 ? 'was' : 'were') + ' left out. The items and their dates came in as they were; ask FrogCog lookups again for those makers to explain the dates.' : '')
            + '\nThe binder now holds ' + plural(b.warranties.length, 'item') + '.',
          data: { added: { items: s.warranties.length, upkeep_jobs: s.maintenance.length, contacts: s.contacts.length, receipts: rc.receipts.length, pictures, manuals }, not_added: other, items: b.warranties.length } };
      });
    },
  },
];
