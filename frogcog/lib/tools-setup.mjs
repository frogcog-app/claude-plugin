/* FrogCog binder: set-up and status. The set-up step is where the person picks the folder and the country and
   reads who sees what. Until it is done, every other tool answers "set up first" and saves nothing. */
import fs from 'node:fs';
import path from 'node:path';
import { obj, text, pick } from './schema.mjs';
import { COUNTRIES, readSettings, writeSettings, defaultFolder, settingsPath, load, told } from './folder.mjs';

export const NOTICE = [
  'Three things to know before you start.',
  '1. Your records are stored on this computer, in the folder you pick. FrogCog has no account for you and keeps no copy.',
  '2. You are talking to an AI tool. What you type, the photos you give it and what the binder tells it are handled by the company that runs that AI tool, under its own terms. FrogCog does not see them.',
  '3. To learn about a product (a maker\'s warranty, an upkeep job) the AI tool asks FrogCog lookups with a brand, a kind of device and a country. Nothing about you or your records is sent to FrogCog.',
  'The AI tool may add its own view. FrogCog\'s part is records, dates and sources. It is not legal, financial or safety advice.',
].join('\n');

const COUNTRY_NAME = { US: 'United States', GB: 'United Kingdom' };

export const setupTools = [
  {
    name: 'set_up', title: 'Set up the FrogCog binder on this computer',
    description: 'Picks the folder on this computer where the binder is kept, and the country. Call it with nothing first: it answers with the folder it proposes and a notice the person must read. Then call it again with the country, the folder if they want another, and notice_read true once they have agreed.',
    input: obj({
      folder: text(400, 'The full path of the folder to keep the binder in. Leave out to use the proposed one.'),
      country: pick(COUNTRIES, 'US for the United States, GB for the United Kingdom. Ask the person; never assume.'),
      notice_read: { type: 'boolean', description: 'True only after the person has been shown the notice and agreed.' },
    }),
    async run(a){
      const s = readSettings();
      // Where Claude has its own settings screen for the binder (the desktop extension), the folder is picked there.
      const picked = (process.env.FROGCOG_BINDER_DIR || '').trim();
      if (picked && !picked.includes('${') && a.folder && path.resolve(a.folder) !== path.resolve(picked)) throw told('The binder\'s folder is chosen in Claude\'s own settings for the FrogCog extension, where it is set to ' + picked + '. Change it there. Nothing was saved.');
      const proposed = a.folder || s.folder || defaultFolder();
      if (!a.notice_read) {
        return { text: 'Not set up yet. Show the person this notice, ask which country (United States or United Kingdom), and ask whether this folder suits them:\n\n' + proposed + '\n\n' + NOTICE,
          data: { set_up: !!(s.folder && s.noticeRead), proposed_folder: proposed, country: s.country || null, notice: NOTICE } };
      }
      const country = a.country || s.country;
      if (!COUNTRIES.includes(country)) throw told('Which country: the United States (US) or the United Kingdom (GB)? Ask the person, then set up again. Nothing was saved.');
      if (!path.isAbsolute(proposed)) throw told('The folder has to be a full path, such as ' + defaultFolder() + '. Nothing was saved.');
      const dir = path.resolve(proposed);
      for (const d of ['files', 'inbox']) fs.mkdirSync(path.join(dir, d), { recursive: true });
      const existing = fs.existsSync(path.join(dir, 'binder.json')) ? load(dir, country).warranties.length : null;
      writeSettings({ folder: dir, country, noticeRead: new Date().toISOString().slice(0, 10) });
      return { text: 'The binder is set up.\nFolder: ' + dir + '\nCountry: ' + COUNTRY_NAME[country] + '\n'
          + (existing === null ? 'The folder is new: the binder is empty.' : 'This folder already holds a binder with ' + existing + (existing === 1 ? ' item.' : ' items.'))
          + '\nTo keep a photo, receipt or manual, save the file into the "inbox" folder inside it and say so.',
        data: { set_up: true, folder: dir, country, items: existing || 0 } };
    },
  },
  {
    name: 'binder_status', title: 'Where the binder is and what it holds', readOnly: true,
    description: 'Says whether the binder is set up, which folder holds it, the country, and how many of each kind of record it holds. Changes nothing. Call it first when unsure whether the binder is there.',
    input: obj({}),
    async run(){
      const s = readSettings();
      if (!s.folder || !s.noticeRead) return { text: 'The FrogCog binder is not set up on this computer yet. Run the set-up (/frogcog:set-up).', data: { set_up: false, proposed_folder: s.folder || defaultFolder() } };
      const dir = path.resolve(s.folder), country = COUNTRIES.includes(s.country) ? s.country : 'US';
      const b = load(dir, country);
      const counts = { items: b.warranties.length, upkeep_jobs: b.maintenance.length, contacts: b.contacts.length, receipts: b.receipts.length, removed: b.binder.removed.length };
      return { text: 'Folder: ' + dir + '\nCountry: ' + COUNTRY_NAME[country] + '\nItems: ' + counts.items + ', upkeep jobs: ' + counts.upkeep_jobs + ', contacts: ' + counts.contacts + ', receipts: ' + counts.receipts + '.',
        data: { set_up: true, folder: dir, country, ...counts, lookups_answers: 'signed only', settings_file: settingsPath() } };
    },
  },
];
