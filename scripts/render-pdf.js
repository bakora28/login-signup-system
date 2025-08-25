#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

async function main() {
  const inPath = path.resolve(__dirname, '..', 'docs', 'project-overview.html');
  const outPath = path.resolve(__dirname, '..', 'docs', 'project-overview.pdf');

  if (!fs.existsSync(inPath)) {
    console.error('Input HTML not found:', inPath);
    process.exit(1);
  }

  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.goto('file://' + inPath.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
  await page.pdf({ path: outPath, format: 'A4', printBackground: true, margin: { top: '14mm', right: '12mm', bottom: '16mm', left: '12mm' } });
  await browser.close();

  console.log('PDF generated at:', outPath);
}

main().catch((err) => {
  console.error('Failed to render PDF:', err);
  process.exit(1);
});
