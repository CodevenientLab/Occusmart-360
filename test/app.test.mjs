import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';

const script = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');

function startDemo(saved) {
  const elements = new Map();
  const handlers = new Map();
  const downloads = [];
  const select = selector => {
    if (!elements.has(selector)) {
      elements.set(selector, {
        addEventListener: (event, fn) => handlers.set(selector + event, fn),
        showModal() {},
        close() {},
      });
    }
    return elements.get(selector);
  };
  const document = {
    querySelector: select,
    querySelectorAll: () => [],
    addEventListener: (event, fn) => handlers.set(event, fn),
    createElement: () => ({ click() {} }),
  };
  runInNewContext(script, {
    document,
    localStorage: {
      getItem: () => saved,
      setItem: (_key, value) => { saved = value; },
    },
    Blob,
    URL: {
      createObjectURL: blob => { downloads.push(blob); return 'blob:demo'; },
      revokeObjectURL() {},
    },
    FormData: class {
      constructor(values) { this.values = values; }
      entries() { return Object.entries(this.values); }
    },
    confirm: () => true,
    setTimeout() {},
    clearTimeout() {},
  });
  return {
    select,
    downloads,
    click: dataset => handlers.get('click')({ target: { closest: () => ({ dataset }) } }),
    search: value => handlers.get('#appinput')({ target: { id: 'filter', value } }),
    submit: values => handlers.get('#record-formsubmit')({ preventDefault() {}, currentTarget: values }),
    saved: () => saved,
  };
}

test('creates an employer, searches the list and restores the saved record', () => {
  const demo = startDemo();
  demo.click({ view: 'clients' });
  demo.click({ add: 'clients' });
  demo.submit({ name: 'Training & Safety', contact: 'Bookings', email: 'demo@example.invalid', status: 'Active' });
  demo.search('training');
  assert.equal(demo.select('#record-count').textContent, '1 records');
  assert.match(demo.select('#record-results').innerHTML, /Training &amp; Safety/);
  const reopened = startDemo(demo.saved());
  reopened.click({ view: 'clients' });
  assert.match(reopened.select('#app').innerHTML, /Training &amp; Safety/);
});

test('protects linked employers and updates the overview when an invoice is paid', () => {
  const demo = startDemo();
  assert.match(demo.select('#app').innerHTML, /1<\/strong> overdue invoice/);
  demo.click({ remove: 'clients:C102' });
  assert.match(demo.select('#feedback').innerHTML, /Remove linked appointments and invoices first/);
  demo.click({ edit: 'invoices:INV-102' });
  demo.submit({ client: 'C102', amount: '4200', due: '2026-11-05', status: 'Paid' });
  assert.match(demo.select('#app').innerHTML, /0<\/strong> overdue invoice/);
});

test('exports record IDs in CSV and all collections in JSON', async () => {
  const demo = startDemo();
  demo.click({ export: 'invoices' });
  demo.click({ export: 'all' });
  assert.match(await demo.downloads[0].text(), /^"id","client","amount","due","status"\r\n"INV-101"/);
  const records = JSON.parse(await demo.downloads[1].text());
  assert.deepEqual(Object.keys(records), ['clients', 'appointments', 'invoices', 'tasks']);
});
