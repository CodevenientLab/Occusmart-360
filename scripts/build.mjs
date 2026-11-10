import { cp, mkdir } from 'node:fs/promises';

const source = new URL('../src/', import.meta.url);
const output = new URL('../dist/', import.meta.url);
await mkdir(output, { recursive: true });
for (const name of ['index.html', 'styles.css', 'app.js']) {
  await cp(new URL(name, source), new URL(name, output));
}
console.log('Built Occusmart 360 in dist/');
