const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

const TEST_DIR = './perf-test';
const FILE_COUNT = 100;
const FILE_CONTENT = 'x'.repeat(1024); // 1 KB

async function setup() {
  if (!fs.existsSync(TEST_DIR)) {
    fs.mkdirSync(TEST_DIR, { recursive: true });
  }
}
function syncWrite() {
  const start = Date.now();
  for (let i = 0; i < FILE_COUNT; i++) {
    const filePath = path.join(TEST_DIR, `sync_${i}.txt`);
    fs.writeFileSync(filePath, FILE_CONTENT, 'utf8');
  }
  return Date.now() - start;
}
function callbackWrite() {
  return new Promise((resolve) => {
    const start = Date.now();
    let completed = 0;
    for (let i = 0; i < FILE_COUNT; i++) {
      const filePath = path.join(TEST_DIR, `cb_${i}.txt`);
      fs.writeFile(filePath, FILE_CONTENT, 'utf8', (err) => {
        if (err) throw err;
        completed++;
        if (completed === FILE_COUNT) {
          resolve(Date.now() - start);
        }
      });
    }
  });
}
async function promiseWrite() {
  const start = Date.now();
  const promises = [];
  for (let i = 0; i < FILE_COUNT; i++) {
    const filePath = path.join(TEST_DIR, `prom_${i}.txt`);
    promises.push(writeFile(filePath, FILE_CONTENT, 'utf8'));
  }
  await Promise.all(promises);
  return Date.now() - start;
}
async function cleanup() {
  const files = await fs.promises.readdir(TEST_DIR);
  await Promise.all(files.map(f => unlink(path.join(TEST_DIR, f))));
}
async function run() {
  await setup();
  console.log('=== ТЕСТ ПРОИЗВОДИТЕЛЬНОСТИ ===');
  console.log(`Создаём ${FILE_COUNT} файлов по 1 КБ\n`);
  let time = syncWrite();
  console.log(`Синхронная запись: ${time} мс`);
  time = await callbackWrite();
  console.log(`Асинхронная (колбэки): ${time} мс`);
  time = await promiseWrite();
  console.log(`Асинхронная (промисы): ${time} мс`);
  await cleanup();
  console.log('\nОчистка завершена.');
}
run().catch(console.error);