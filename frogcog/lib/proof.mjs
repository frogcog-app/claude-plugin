/* FrogCog binder: taking an answer from FrogCog lookups that the AI tool passed on.
 *
 * The binder never goes online. The AI tool asks FrogCog lookups about a product (a brand, a kind of device, a
 * country) and passes the answer on. This file decides whether to believe it.
 *
 * The rule is one rule, with no way round it: a maker's warranty or an upkeep interval is taken only from an answer
 * signed by FrogCog lookups, checked against the public key below, and the figures used are the ones inside the
 * signed part. A figure the AI tool miscopied, or one typed beside the proof, is never used. An answer with no
 * signature, a changed one, or the answer to a different question is refused, and the binder then saves no date
 * at all instead of a wrong one.
 *
 * There is no setting, no environment variable and no tool input that changes the key or lets an unsigned answer
 * through. The key is the constant below and nothing else.
 *
 * An answer is only ever product facts. Nothing in this file sends anything anywhere.
 */
import crypto from 'node:crypto';
import { told } from './folder.mjs';

// The public half of FrogCog lookups' signing key: Ed25519, 32 bytes, base64url. Not a secret. Set 2026-11-19; the
// live service was signing first, and a live answer was checked against this value the same day. Changing the pair
// means a new plugin for everyone who has one.
export const LOOKUPS_PUBLIC_KEY = 'oZgNiJO40FWjVrLtXJHx5rikVKHWSZlh0Se6nyzBrHI';
const PREFIX = 'fc1', SPKI_HEAD = Buffer.from('302a300506032b6570032100', 'hex');

const link = v => (typeof v === 'string' && /^https:\/\/[^\s"<>]+$/.test(v) && v.length <= 400) ? v : null;
const words = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');

/* Is this proof signed with that key? Returns what was signed, or null. Pure: a key is always given by name. */
export function verifyProof(proof, publicKey){
  const parts = String(proof || '').split('.');
  if (parts.length !== 3 || parts[0] !== PREFIX || !publicKey) return null;
  try {
    const raw = Buffer.from(publicKey, 'base64url');
    if (raw.length !== 32) return null;
    const key = crypto.createPublicKey({ key: Buffer.concat([SPKI_HEAD, raw]), format: 'der', type: 'spki' });
    if (!crypto.verify(null, Buffer.from(parts[0] + '.' + parts[1]), key, Buffer.from(parts[2], 'base64url'))) return null;
    return JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch (e) { return null; }
}

/* The proof inside whatever the AI tool passed: the answer's text, the answer as an object, or the proof alone. */
function proofIn(given){
  let a = given;
  if (typeof a === 'string') {
    const s = a.trim();
    if (s.startsWith(PREFIX + '.')) return s;
    try { a = JSON.parse(s); } catch (e) { return null; }
  }
  return (a && typeof a === 'object' && typeof a.proof === 'string') ? a.proof.trim() : null;
}

/* What FrogCog lookups signed for this question. Throws a plain message when there is nothing it can stand on. */
function signedAnswer(given, toolName){
  const proof = proofIn(given), signed = proof ? verifyProof(proof, LOOKUPS_PUBLIC_KEY) : null;
  if (!signed) throw told('That answer is not signed by FrogCog lookups, or it was changed on the way. Ask FrogCog lookups again and pass its "proof" on exactly as it came: the long text that starts fc1. Nothing was saved.');
  if (signed.tool !== toolName) throw told('That is the answer to a different question (' + words(signed.tool, 40) + '). Nothing was saved.');
  return { a: signed, proof };
}

/* A maker's warranty: what the binder keeps with the item. `proof` is kept too, so the answer can be checked again
   when a backup moves it to another binder. */
export function makerTerm(given){
  const { a, proof } = signedAnswer(given, 'warranty_terms');
  const years = (typeof a.years === 'number' && a.years > 0 && a.years <= 25 && Number.isInteger(a.years * 12)) ? a.years : null;
  const r = (a.registration && typeof a.registration === 'object') ? a.registration : {};
  const days = (Number.isInteger(r.deadline_days) && r.deadline_days > 0 && r.deadline_days <= 3650) ? r.deadline_days : null;
  return {
    brand: words(a.brand, 80), country: a.country === 'GB' ? 'GB' : 'US', category: words(a.category, 60) || '',
    known: !!(a.known && years), years, note: words(a.note, 400), source: link(a.source),
    reg: { link: link(r.link), days, from: r.counted_from === 'install' ? 'install' : 'purchase', gives: words(r.registering_gives, 200),
      notIn: Array.isArray(r.not_needed_in_states) ? r.not_needed_in_states.filter(x => typeof x === 'string').slice(0, 60).map(x => x.slice(0, 30)) : [] },
    service: link(a.service_link), trust: 'signed', at: /^\d{4}-\d{2}-\d{2}$/.test(a.at || '') ? a.at : null, proof,
  };
}

/* An upkeep job. The interval is null when lookups had no sourced one. */
export function upkeepJob(given){
  const { a, proof } = signedAnswer(given, 'upkeep_job');
  const every = (Number.isInteger(a.every_months) && a.every_months > 0 && a.every_months <= 240) ? a.every_months : null;
  return {
    appliance: words(a.appliance, 40), country: a.country === 'GB' ? 'GB' : 'US', known: !!(a.known && every),
    label: words(a.label, 80), job: words(a.job, 120), every_months: every, buy: words(a.what_to_buy, 120), byModel: a.part_depends_on_model === true, detail: words(a.detail, 200),
    source: link(a.source), trust: 'signed', proof,
  };
}

/* The season's list of jobs. FrogCog lookups does not sign it and the binder does not need it signed: it holds no
   figure the binder turns into a date. The binder only remembers which jobs the person ticked. */
export function seasonList(given){
  let a = given;
  if (typeof a === 'string') { try { a = JSON.parse(a.trim()); } catch (e) { a = null; } }
  if (!a || typeof a !== 'object' || Array.isArray(a)) throw told('The season\'s list from FrogCog lookups could not be read. Ask lookups again and pass its answer on unchanged.');
  return a;
}
