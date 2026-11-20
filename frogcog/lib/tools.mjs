/* FrogCog binder: every tool, and what the AI tool is told when it connects. */
import { setupTools } from './tools-setup.mjs';
import { itemTools } from './tools-items.mjs';
import { backupTools } from './tools-backup.mjs';
import { fileTools } from './tools-files.mjs';
import { receiptTools } from './tools-receipts.mjs';
import { careTools } from './tools-care.mjs';
import { recallTools } from './tools-recalls.mjs';
import { roomTools } from './tools-rooms.mjs';

export const TOOLS = [...setupTools, ...itemTools, ...backupTools, ...fileTools, ...receiptTools, ...careTools, ...recallTools, ...roomTools];

/* Facts about these tools only. Nothing here steers what the AI tool does elsewhere. */
export const INSTRUCTIONS = [
  'FrogCog binder keeps a household\'s records of appliances and devices in a folder on this computer: items, warranties, receipts, upkeep, registration, protection plans, contacts and a contents list.',
  'It does every date sum itself. Pass dates as the person gave them, written yyyy-mm-dd, and read back the dates and counts of days it returns. Do not work out an end date, a deadline or a number of days yourself.',
  'Where an answer says how long is left in words (time_left, due, or the sentence in message), use those words as given. Do not turn a number of days into months or years.',
  'It does not go online. To learn a maker\'s warranty or an upkeep interval, ask FrogCog lookups (warranty_terms, upkeep_job) with a brand or a kind of device and a country. FrogCog lookups is never sent a date, a model, a serial number or a name.',
  'A warranty or upkeep answer from FrogCog lookups has a field called proof: one long text that starts fc1. and holds the same figures, signed. Pass the proof on as the tool\'s lookup input, exactly as it came, every character. That is all the binder needs: the rest of the answer need not be copied (the whole answer is taken too). The binder uses only the signed figures, and refuses a missing or changed proof; if it refuses, ask FrogCog lookups again and pass the new proof on.',
  'The season\'s list (seasonal_checklist) is not signed and has no proof: pass that whole answer on.',
  'If there are no FrogCog lookups tools, lookups is not connected: the person connects it once on the plugin\'s page in Claude (Finish setup, then Connect beside FrogCog-lookups).',
  'When lookups has no sourced figure, save the record without one: the binder shows the date as unknown. Never fill in a typical figure.',
  'Every tool that saves answers with exactly what it saved. Show that to the person, so a misheard value is seen.',
  'Start with binder_status. If the binder is not set up, run set_up first.',
].join(' ');
