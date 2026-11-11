const { promises: fs } = require('fs');
const path = require('path');
const VARIANT = 4;
const IGNORE_LARGE = VARIANT >= 1 && VARIANT <= 5;      
const IGNORE_DIRS = VARIANT >= 6 && VARIANT <= 10;      
const ONLY_EXTS = VARIANT >= 11 && VARIANT <= 15;       
const SEARCH_VARIANT = VARIANT >= 16 && VARIANT <= 20;  
const ALLOWED_EXTS = ['.js', '.json', '.txt', '.md'];
const IGNORED_DIR_NAMES = ['node_modules', '.git'];
const MAX_SIZE = 10 * 1024 * 1024; 
async function scan(dir, stats) {
  let items;
  try {
    items = await fs.readdir(dir, { withFileTypes: true });
  } catch (e) {
    return; 
  }
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (IGNORE_DIRS && IGNORED_DIR_NAMES.includes(item.name)) continue;
      stats.dirs++;
      await scan(full, stats);
    } else {
      const ext = path.extname(item.name).toLowerCase();
      if (ONLY_EXTS && !ALLOWED_EXTS.includes(ext)) continue;

      if (SEARCH_VARIANT && !item.name.includes(String(VARIANT))) continue;
      let st;
      try {
        st = await fs.stat(full);
      } catch (e) {
        continue;
      }
      if (IGNORE_LARGE && st.size > MAX_SIZE) continue;
      stats.files.push({ name: item.name, path: full, size: st.size, ext: ext || '(без расширения)' });
      stats.totalSize += st.size;
    }
  }
}
async function task3() {
  const target = process.argv[2] ? path.resolve(process.argv[2]) : __dirname;
  const stats = { dirs: 0, files: [], totalSize: 0 };
  try {
    await scan(target, stats);
    const byExt = {};
    for (const f of stats.files) {
      byExt[f.ext] = byExt[f.ext] || { count: 0, size: 0 };
      byExt[f.ext].count++;
      byExt[f.ext].size += f.size;
    }
    const sorted = [...stats.files].sort((a, b) => b.size - a.size);
    const top5Big = sorted.slice(0, 5);
    const top5Small = [...stats.files].sort((a, b) => a.size - b.size).slice(0, 5);
    console.log(`Анализ директории: ${target}\n`);
    console.log(`Общее количество папок: ${stats.dirs}`);
    console.log(`Общее количество файлов: ${stats.files.length}`);
    console.log(`Общий размер: ${(stats.totalSize / 1024 / 1024).toFixed(2)} МБ (${stats.totalSize} байт)\n`);
    console.log('Расширения файлов:');
    for (const [ext, v] of Object.entries(byExt)) {
      console.log(`${ext}: ${v.count} файл(ов) (${(v.size / 1024).toFixed(1)} КБ)`);
    }
    console.log('\nТоп-5 самых больших файлов:');
    top5Big.forEach((f, i) =>
      console.log(`${i + 1}. ${f.name} (${(f.size / 1024).toFixed(1)} КБ) - ${f.path}`)
    );
    console.log('\nТоп-5 самых маленьких файлов:');
    top5Small.forEach((f, i) =>
      console.log(`${i + 1}. ${f.name} (${f.size} байт) - ${f.path}`)
    );

    const report = {
      variant: VARIANT,
      target,
      directories: stats.dirs,
      filesCount: stats.files.length,
      totalSizeBytes: stats.totalSize,
      totalSizeMB: +(stats.totalSize / 1024 / 1024).toFixed(2),
      byExtension: byExt,
      top5Big: top5Big.map(f => ({ name: f.name, size: f.size, path: f.path })),
      top5Small: top5Small.map(f => ({ name: f.name, size: f.size, path: f.path })),
    };
    const reportPath = path.join(__dirname, `report_${VARIANT}.json`);
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\nОтчёт сохранён: report_${VARIANT}.json`);
  } catch (error) {
    console.error('Ошибка:', error.message);
  }
}
task3();