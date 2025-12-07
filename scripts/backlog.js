#!/usr/bin/env node

/**
 * Lightweight backlog helper.
 * Data source: backlog/backlog.json
 * Output: regenerates BACKLOG.md
 *
 * Commands:
 *   node scripts/backlog.js list
 *   node scripts/backlog.js move <id> <todo|in_progress|done>
 *   node scripts/backlog.js add "Title" --category cat --notes "note"
 */

const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '..', 'backlog', 'backlog.json');
const MD_PATH = path.join(__dirname, '..', 'BACKLOG.md');
const STATUSES = ['todo', 'in_progress', 'done'];

function load() {
  const raw = fs.readFileSync(JSON_PATH, 'utf8');
  return JSON.parse(raw);
}

function save(data) {
  data.meta.updatedAt = new Date().toISOString();
  fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2) + '\n');
  fs.writeFileSync(MD_PATH, renderMd(data));
}

function renderMd(data) {
  const byStatus = STATUS => data.items.filter(i => i.status === STATUS);
  const lines = [];
  lines.push('# Backlog', '', 'Managed via `backlog/backlog.json` + `node scripts/backlog.js`.', '');

  lines.push('## In Progress');
  const inProgress = byStatus('in_progress');
  lines.push(...(inProgress.length ? inProgress.map(renderItem) : ['- _None_']), '');

  lines.push('## Todo');
  const todo = byStatus('todo');
  lines.push(...(todo.length ? todo.map(renderItem) : ['- _None_']), '');

  lines.push('## Done');
  const done = byStatus('done');
  lines.push(...(done.length ? done.map(renderItem) : ['- _None_']), '');

  lines.push('', '## How to use', '- List: `node scripts/backlog.js list`', '- Move status: `node scripts/backlog.js move BL-1 in_progress` (statuses: `todo`, `in_progress`, `done`)', '- Add item: `node scripts/backlog.js add "Title here" --category product --notes "short note"`', '- Regenerate this file is automatic after any command', '');

  return lines.join('\n');
}

function renderItem(item) {
  const note = item.notes ? ` — ${item.notes}` : '';
  return `- **${item.id}** ${item.title}${note}`;
}

function list() {
  const data = load();
  console.log(renderMd(data));
}

function move(id, status) {
  if (!STATUSES.includes(status)) {
    throw new Error(`Status must be one of ${STATUSES.join(', ')}`);
  }
  const data = load();
  const item = data.items.find(i => i.id === id);
  if (!item) throw new Error(`Item not found: ${id}`);
  item.status = status;
  save(data);
  console.log(`Moved ${id} -> ${status}`);
}

function add(title, options) {
  const data = load();
  const nextNumber = data.items
    .map(i => Number((i.id || '').replace('BL-', '')))
    .filter(n => !Number.isNaN(n))
    .reduce((max, n) => Math.max(max, n), 0) + 1;
  const id = `BL-${nextNumber}`;
  data.items.push({
    id,
    title,
    status: 'todo',
    category: options.category || 'misc',
    notes: options.notes || '',
  });
  save(data);
  console.log(`Added ${id}: ${title}`);
}

function parseArgs(argv) {
  const [_node, _script, cmd, ...rest] = argv;
  return { cmd, rest };
}

function parseOptions(args) {
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--category') {
      opts.category = args[i + 1];
      i++;
    } else if (a === '--notes') {
      opts.notes = args[i + 1];
      i++;
    }
  }
  return opts;
}

function main() {
  const { cmd, rest } = parseArgs(process.argv);
  try {
    switch (cmd) {
      case 'list':
        list();
        break;
      case 'move':
        move(rest[0], rest[1]);
        break;
      case 'add': {
        const title = rest[0];
        if (!title) throw new Error('Title required: backlog.js add "Title"');
        const opts = parseOptions(rest.slice(1));
        add(title, opts);
        break;
      }
      default:
        console.log('Usage:');
        console.log('  node scripts/backlog.js list');
        console.log('  node scripts/backlog.js move <id> <todo|in_progress|done>');
        console.log('  node scripts/backlog.js add "Title" --category <cat> --notes "note"');
        process.exit(1);
    }
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

main();

