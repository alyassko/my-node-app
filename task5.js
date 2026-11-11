const { promises: fs, createReadStream, createWriteStream } = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const VARIANT = 4;
const sourceDir = path.join(__dirname, `source_${VARIANT}`);
const backupDir = path.join(__dirname, `backup_${VARIANT}`);
const STREAM_EXTS = ['.txt', '.js', '.json'];       
const IMAGE_EXTS = ['.jpg', '.png', '.gif'];        
const LARGE_SIZE = 1024 * 1024;                    
const CHUNK_SIZE = 512 * 1024;                 
async function createTestStructure() {
  try { await fs.access(sourceDir); return; } catch {}
  await fs.mkdir(sourceDir, { recursive: true });
  await fs.mkdir(path.join(sourceDir, 'sub1'), { recursive: true });
  await fs.mkdir(path.join(sourceDir, 'sub2'), { recursive: true });
  await fs.mkdir(path.join(sourceDir, 'sub3'), { recursive: true });
  const exts = ['.txt', '.js', '.json', '.jpg', '.png', '.gif', '.md', '.css'];
  const manifest = [];
  for (let i = 1; i <= 20; i++) {
    const ext = exts[i % exts.length];
    const name = `file_${i}${ext}`;
    const size = (i % 5 === 0) ? 2 * 1024 * 1024 : i * 500;
    const content = 'x'.repeat(size);
    const full = path.join(sourceDir, name);
    await fs.writeFile(full, content);
    manifest.push({ name, size, ext });
  }
  for (const sub of ['sub1', 'sub2', 'sub3']) {
    for (let i = 1; i <= 3; i++) {
      const name = `${sub}_file_${i}.txt`;
      await fs.writeFile(path.join(sourceDir, sub, name), `content ${sub} ${i}`);
      manifest.push({ name: path.join(sub, name), size: `content ${sub} ${i}`.length, ext: '.txt' });
    }
  }
  await fs.writeFile(
    path.join(sourceDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );
  console.log(`Тестовая структура создана: source_${VARIANT}`);
}
async function copyFile(src, dest, stats) {
  const ext = path.extname(src).toLowerCase();
  const st = await fs.stat(src);
  await fs.mkdir(path.dirname(dest), { recursive: true });

  if (STREAM_EXTS.includes(ext)) {
    await pipeline(createReadStream(src), createWriteStream(dest));
    stats.stream++;
  } else {
    await fs.copyFile(src, dest);
    stats.regular++;
  }
  stats.totalSize += st.size;
}
async function copyDir(src, dest, stats) {
  const items = await fs.readdir(src, { withFileTypes: true });
  for (const item of items) {
    const s = path.join(src, item.name);
    const d = path.join(dest, item.name);
    if (item.isDirectory()) {
      await fs.mkdir(d, { recursive: true });
      await copyDir(s, d, stats);
    } else {
      await copyFile(s, d, stats);
      stats.done++;
      console.log(`Прогресс копирования: ${stats.done}/${stats.total} файлов`);
    }
  }
}
async function countFiles(dir) {
  let n = 0;
  const items = await fs.readdir(dir, { withFileTypes: true });
  for (const item of items) {
    if (item.isDirectory()) n += await countFiles(path.join(dir, item.name));
    else n++;
  }
  return n;
}
async function backup() {
  const start = Date.now();
  await fs.mkdir(backupDir, { recursive: true });
  const stats = { stream: 0, regular: 0, done: 0, total: await countFiles(sourceDir), totalSize: 0 };
  await copyDir(sourceDir, backupDir, stats);
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  console.log('\nКопирование завершено!');
  console.log(`Скопировано файлов: ${stats.total}`);
  console.log(`Потоковое копирование: ${stats.stream}`);
  console.log(`Обычное копирование: ${stats.regular}`);
  console.log(`Общий размер: ${(stats.totalSize / 1024 / 1024).toFixed(2)} МБ`);
  console.log(`Время выполнения: ${elapsed} сек`);
}
async function collectFiles(dir, base = dir, map = new Map()) {
  const items = await fs.readdir(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      await collectFiles(full, base, map);
    } else {
      const st = await fs.stat(full);
      map.set(path.relative(base, full), { size: st.size, mtime: st.mtimeMs });
    }
  }
  return map;
}
async function syncCompare() {
  const src = await collectFiles(sourceDir);
  const bak = await collectFiles(backupDir);
  const same = [], changed = [], added = [], removed = [];
  for (const [rel, s] of src) {
    if (!bak.has(rel)) {
      added.push(rel); // есть в source, нет в backup
    } else {
      const b = bak.get(rel);
      if (s.size === b.size && s.mtime === b.mtime) same.push(rel);
      else changed.push(rel);
    }
  }
  for (const rel of bak.keys()) {
    if (!src.has(rel)) removed.push(rel); 
  }
  const report = [
    `Сравнение директорий: source_${VARIANT} ↔ backup_${VARIANT}`,
    '',
    `Совпадают: ${same.length} файлов`,
    `Изменены: ${changed.length} файлов`,
    ...changed.map(f => `  - ${f}`),
    `Добавлены: ${added.length} файлов`,
    ...added.map(f => `  - ${f}`),
    `Удалены: ${removed.length} файлов`,
    ...removed.map(f => `  - ${f}`),
  ].join('\n');
  const reportPath = path.join(__dirname, `sync_report_${VARIANT}.txt`);
  await fs.writeFile(reportPath, report, 'utf8');
  console.log('\nСравнение директорий:');
  console.log(`- Совпадают: ${same.length} файлов`);
  console.log(`- Изменены: ${changed.length} файлов`);
  console.log(`- Добавлены: ${added.length} файлов`);
  console.log(`- Удалены: ${removed.length} файлов`);
  console.log(`\nОтчёт сохранён: sync_report_${VARIANT}.txt`);
}
(async () => {
  try {
    await createTestStructure();
    await backup();
    await syncCompare();
  } catch (error) {
    if (error.code === 'EACCES') console.error('Нет прав доступа:', error.path);
    else if (error.code === 'ENOENT') console.error('Путь не найден:', error.path);
    else console.error('Ошибка:', error.message);
  }
})();