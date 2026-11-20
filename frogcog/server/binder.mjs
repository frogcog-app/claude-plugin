#!/usr/bin/env node
/* FrogCog binder: the program the AI tool starts on the person's own computer.
 *
 * It keeps the binder in a folder the person picks and does every date sum. It is spoken to down a pipe (MCP over
 * stdin and stdout). It needs Node and nothing else: there is nothing to install and nothing is fetched.
 *
 * It does not use the network. The one exception is the check for possible safety recalls, which the person
 * switches on themselves: it asks the public recall list for a brand name (lib/recall-fetch.mjs is the only file
 * that can reach the internet).
 */
import readline from 'node:readline';
import { handle } from '../lib/protocol.mjs';
import { TOOLS, INSTRUCTIONS } from '../lib/tools.mjs';

const send = msg => process.stdout.write(JSON.stringify(msg) + '\n');
let queue = Promise.resolve();                              // one at a time, so two saves never interleave
readline.createInterface({ input: process.stdin }).on('line', line => {
  if (!line.trim()) return;
  let msg;
  try { msg = JSON.parse(line); } catch (e) { return send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); }
  queue = queue.then(() => handle(msg, TOOLS, INSTRUCTIONS)).then(out => { if (out) send(out); })
    .catch(e => process.stderr.write('frogcog binder: ' + ((e && e.stack) || e) + '\n'));
});
