/* FrogCog binder, stage 2: photos, receipts and manuals kept with a record, as ordinary files in the folder.
 *
 * A picture given to a chat does not reach this program. So the person saves the file into the binder's inbox
 * folder (or gives the full path of a file on this computer) and the binder files it under files/. Taking a file
 * off a record puts it back in the inbox; nothing is deleted.
 */
import fs from 'node:fs';
import path from 'node:path';
import { obj, text, pick } from './schema.mjs';
import { change, read, told, inside } from './folder.mjs';
import { app, today, one, clip, plural } from './common.mjs';

const PICTURE = ['.jpg', '.jpeg', '.png', '.webp', '.gif'], MAX_FILE = 50 * 1024 * 1024;
/* A file's name as kept in the binder: a plain name, never a path. A name can come from a backup, which is someone
   else's file, so it is made plain every time it is used, not only when it is first stored. */
const safeName = n => app.safeFileName(String(n == null ? '' : n).replace(/[^\w.\- ]+/g, '_').slice(0, 80), 'file');
/* Is this really a picture? The first bytes say so, whatever the file is called. */
function isPictureBytes(p){
  const fd = fs.openSync(p, 'r'), h = Buffer.alloc(12);
  try { fs.readSync(fd, h, 0, 12, 0); } finally { fs.closeSync(fd); }
  return (h[0] === 0xFF && h[1] === 0xD8 && h[2] === 0xFF)                                   // jpg
    || h.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))  // png
    || h.subarray(0, 4).toString('latin1') === 'GIF8'                                        // gif
    || (h.subarray(0, 4).toString('latin1') === 'RIFF' && h.subarray(8, 12).toString('latin1') === 'WEBP');
}

export function inboxFiles(dir){
  const inbox = path.join(dir, 'inbox');
  return fs.readdirSync(inbox, { withFileTypes: true }).filter(e => e.isFile() && e.name.toLowerCase() !== 'passphrase.txt')
    .map(e => ({ name: e.name, bytes: fs.statSync(path.join(inbox, e.name)).size }));
}
function source(dir, file){
  const inInbox = path.join(dir, 'inbox', path.basename(file));
  if (!path.isAbsolute(file)) { if (fs.existsSync(inInbox)) return { p: inInbox, fromInbox: true }; throw told('"' + file + '" is not in the inbox folder (' + path.join(dir, 'inbox') + '). Save the file there, or give its full path. Nothing was changed.'); }
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) throw told('No file was found at "' + file + '". Nothing was changed.');
  return { p: file, fromInbox: path.resolve(file) === path.resolve(inInbox) };
}
/* Copy (or, from the inbox, move) a file into files/ under a new key, and note it in the binder. */
export function fileIn(b, dir, file, mustBe){
  const { p, fromInbox } = source(dir, file), ext = path.extname(p).toLowerCase(), size = fs.statSync(p).size;
  if (size > MAX_FILE) throw told('That file is larger than 50 MB. Nothing was changed.');
  const isPdf = ext === '.pdf' && app.isPdfBytes(fs.readFileSync(p).subarray(0, 8)), isPic = PICTURE.includes(ext) && isPictureBytes(p);
  if (mustBe === 'pdf' && !isPdf) throw told('A manual is kept as a PDF, and that file is not one. Nothing was changed.');
  if (mustBe === 'picture' && !isPic) throw told('That has to be a picture (jpg, png, webp or gif). Nothing was changed.');
  if (!isPdf && !isPic) throw told('The binder keeps pictures (jpg, png, webp, gif) and PDFs, and that file is neither. Nothing was changed.');
  const k = app.uid(), rel = 'files/' + k + ext;
  if (fromInbox) fs.renameSync(p, path.join(dir, rel)); else fs.copyFileSync(p, path.join(dir, rel));
  b.binder.files[k] = { path: rel, name: safeName(path.basename(p)), size };
  return { k, name: b.binder.files[k].name, size, isPdf };
}
/* Take a kept file off its record and put it back in the inbox. */
export function fileOut(b, dir, k){
  const f = b.binder.files[k];
  // Both ends are held inside the binder folder (inside() refuses anything else): the kept file under files/, and the
  // inbox, under a plain name. Found 2026-11-20: a backup's manual name with "../" in it put a file outside the folder.
  const from = f ? keptPath(dir, f) : null;
  if (from && fs.existsSync(from)) {
    const name = safeName(f.name), inbox = path.join(dir, 'inbox');
    let dest = inside(inbox, name), i = 2;
    while (fs.existsSync(dest)) dest = inside(inbox, path.parse(name).name + ' (' + i++ + ')' + path.extname(name));
    fs.renameSync(from, dest);
  }
  delete b.binder.files[k];
}
/* Where a kept file is: always under the binder's files/ folder, or nowhere. */
function keptPath(dir, f){
  try { return inside(path.join(dir, 'files'), path.basename(String(f.path || ''))); } catch (e) { return null; }
}
export const filePath = (b, dir, k) => { const f = b.binder.files[k]; return f ? keptPath(dir, f) : null; };

export const fileTools = [
  {
    name: 'list_files', title: 'List files waiting and files kept', readOnly: true,
    description: 'Lists the files waiting in the binder\'s inbox folder, and, for one item, the files kept with it and where each is on this computer. Use it before attaching a file.',
    input: obj({ item: text(120, 'An item\'s id or exact name, to list its files too.') }),
    async run(a){
      const { b, dir } = read();
      const inbox = inboxFiles(dir);
      let kept = [];
      if (a.item) { const w = one(b.warranties, a.item, 'item'); kept = (w.docs || []).map(d => ({ label: d.label, file: filePath(b, dir, d.k) })).concat(w.manual ? [{ label: 'Manual: ' + w.manual.name, file: filePath(b, dir, w.manual.k) }] : []); }
      return { text: 'Inbox (' + path.join(dir, 'inbox') + '): ' + (inbox.length ? inbox.map(f => f.name).join(', ') : 'empty') + '.' + (a.item ? '\nKept with the item: ' + (kept.length ? kept.map(f => f.label + ' at ' + f.file).join('; ') : 'nothing') + '.' : ''),
        data: { inbox_folder: path.join(dir, 'inbox'), inbox, kept } };
    },
  },
  {
    name: 'attach_file', title: 'Keep a photo, receipt or manual with a record',
    description: 'Files one picture or PDF with a record: a photo or a receipt with an item, a receipt with a receipt record, a manual (PDF) with an item, or a photo of a room. The file is named as it is in the inbox folder, or by its full path on this computer. From the inbox it is moved; from elsewhere it is copied.',
    input: obj({
      file: text(400, 'The file\'s name in the inbox folder, or its full path.'),
      as: pick(['photo', 'receipt', 'manual', 'room photo'], 'What the file is.'),
      item: text(120, 'The item\'s id or exact name (for a photo, a receipt or a manual).'),
      receipt: text(120, 'A receipt record\'s id or exact title, to keep the file with that receipt instead.'),
      room: text(60, 'The room, for a room photo.'),
      label: text(80, 'A short label, for example "Data plate" or "Delivery note". Optional.'),
    }, ['file', 'as']),
    async run(a){
      return change((b, { dir }) => {
        if (a.as === 'room photo') {
          const room = clip(a.room, 60); if (!room) throw told('Which room is the photo of? Nothing was changed.');
          const f = fileIn(b, dir, a.file, 'picture');
          (b.roomPhotos[room] = b.roomPhotos[room] || []).push({ k: f.k, label: 'Room photo' });
          return { text: 'Kept a photo of the ' + room + ' (' + f.name + ').', data: { room, file: filePath(b, dir, f.k) } };
        }
        if (a.receipt) {
          const r = one(b.receipts, a.receipt, 'receipt', x => x.title);
          const f = fileIn(b, dir, a.file);
          (r.docs = r.docs || []).push({ k: f.k, label: clip(a.label, 80) || 'Receipt' });
          return { text: 'Kept ' + f.name + ' with the receipt "' + r.title + '".', data: { receipt: r.id, file: filePath(b, dir, f.k) } };
        }
        const w = one(b.warranties, a.item, 'item');
        if (a.as === 'manual') {
          const f = fileIn(b, dir, a.file, 'pdf');
          if (f.size > app.MANUAL_MAX_BYTES) { fileOut(b, dir, f.k); throw told('That manual is larger than the binder keeps. It is back in the inbox. Nothing was changed.'); }
          if (w.manual) fileOut(b, dir, w.manual.k);
          w.manual = { k: f.k, name: f.name, size: f.size, savedAt: today() };
          return { text: 'Kept the manual ' + f.name + ' with "' + w.name + '". It is at ' + filePath(b, dir, f.k) + '.', data: { item: w.id, file: filePath(b, dir, f.k) } };
        }
        const f = fileIn(b, dir, a.file);
        (w.docs = w.docs || []).push({ k: f.k, label: clip(a.label, 80) || (a.as === 'receipt' ? 'Receipt' : 'Photo') });
        return { text: 'Kept ' + f.name + ' with "' + w.name + '" as ' + (a.as === 'receipt' ? 'its receipt' : 'a photo') + '. ' + plural(w.docs.length, 'file') + ' kept with it now.', data: { item: w.id, file: filePath(b, dir, f.k), files: w.docs.length } };
      });
    },
  },
  {
    name: 'detach_file', title: 'Take a file off a record',
    description: 'Takes one kept file off an item (a photo or receipt by its label, or the manual) and puts the file back in the inbox folder. Nothing is deleted.',
    input: obj({ item: text(120, 'The item\'s id or exact name.'), which: text(80, 'The file\'s label as list_files shows it, or "manual".') }, ['item', 'which']),
    async run(a){
      return change((b, { dir }) => {
        const w = one(b.warranties, a.item, 'item'), which = a.which.trim().toLowerCase();
        if (which === 'manual') { if (!w.manual) throw told('"' + w.name + '" has no saved manual. Nothing was changed.'); const n = w.manual.name; fileOut(b, dir, w.manual.k); delete w.manual; return { text: 'The manual ' + n + ' is off "' + w.name + '" and back in the inbox.', data: { item: w.id } }; }
        const hits = (w.docs || []).filter(d => String(d.label || '').toLowerCase() === which);
        if (hits.length !== 1) throw told(hits.length ? 'More than one file on "' + w.name + '" has that label. Nothing was changed.' : 'No file on "' + w.name + '" has the label "' + a.which + '". Nothing was changed.');
        fileOut(b, dir, hits[0].k); w.docs = w.docs.filter(d => d !== hits[0]);
        return { text: 'That file is off "' + w.name + '" and back in the inbox.', data: { item: w.id, files: w.docs.length } };
      });
    },
  },
  {
    name: 'manual_help', title: 'Find or open an item\'s manual', readOnly: true,
    description: 'For one item: where its saved manual is on this computer (so it can be read), and a web search link for the manual, or for one topic in it such as an error code or a reset. FrogCog hosts no manuals; the link is a plain search.',
    input: obj({ item: text(120, 'The item\'s id or exact name.'), topic: text(80, 'A topic to narrow the search, for example "error E21" or "descale". Optional.') }, ['item']),
    async run(a){
      const { b, dir } = read();
      const w = one(b.warranties, a.item, 'item');
      const search = app.manualSearchUrl(w.manufacturer, w.model, w.name, a.topic), saved = w.manual ? filePath(b, dir, w.manual.k) : null;
      return { text: (saved ? 'Saved manual: ' + saved + ' (' + w.manual.name + ').' : 'No manual is saved with "' + w.name + '" yet. Download the PDF, save it into the inbox folder and attach it as a manual.')
          + (search ? '\nSearch the web for ' + (a.topic ? 'that topic' : 'the manual') + ': ' + search : '\nAdd the brand or model to search for the manual.'),
        data: { saved_manual: saved, search_link: search || null } };
    },
  },
];
