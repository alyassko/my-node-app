const { promises: fs, createReadStream, createWriteStream } = require('fs');
const path = require('path');
const readline = require('readline');
const VARIANT = 4; 
const TOTAL_LINES = 100_000; 
const dataFile = path.join(__dirname, `data_${VARIANT}.txt`);
const processedFile = path.join(__dirname, `processed_${VARIANT}.txt`);
async function generateFile() {
  try {
    await fs.access(dataFile);
    console.log(`Файл уже существует: data_${VARIANT}.txt`);
  } catch {
    console.log('Генерация файла...');
        const ws = createWriteStream(dataFile, { encoding: 'utf8' });
    for (let i = 1; i <= TOTAL_LINES; i++) {
      const num = Math.floor(Math.random() * 1000) + 1; // 1..1000
      if (!ws.write(`${i}, ${num}, Вариант ${VARIANT}\n`)) {
        await new Promise(r => ws.once('drain', r)); // backpressure
      }
    }
    await new Promise((resolve, reject) => {
      ws.end(() => resolve());
      ws.on('error', reject);
    });
    console.log('Генерация завершена.');
  }
}
async function processFile() {
  const stat = await fs.stat(dataFile);
  const sizeMB = (stat.size / 1024 / 1024).toFixed(2);
  console.log(`\nОбработка файла: data_${VARIANT}.txt`);
  console.log(`Размер файла: ${sizeMB} МБ\n`);
  const start = Date.now();
  let count = 0, sum = 0, min = Infinity, max = -Infinity;
  let even = 0, odd = 0; 
  const stream = createReadStream(dataFile, {
    encoding: 'utf8',
    highWaterMark: 64 * 1024,
  });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let lastPercent = 0;
  const progressStep = 10;
  for await (const line of rl) {
    const parts = line.split(',');
    if (parts.length < 2) continue;
    const num = Number(parts[1].trim());
    if (Number.isNaN(num)) continue;
    count++;
    sum += num;
    if (num < min) min = num;
    if (num > max) max = num;
    if (num % 2 === 0) even++; else odd++;
    const percent = Math.floor((count / TOTAL_LINES) * 100);
    if (percent >= lastPercent + progressStep) {
      lastPercent = percent - (percent % progressStep);
      console.log(`Прогресс: ${lastPercent}% (${count.toLocaleString('ru-RU')} строк обработано)`);
    }
  }
  const elapsed = ((Date.now() - start) / 1000).toFixed(2);
  const avg = sum / count;
  const results = [
    `Всего строк: ${count}`,
    `Сумма чисел: ${sum}`,
    `Среднее значение: ${avg.toFixed(2)}`,
    `Максимальное число: ${max}`,
    `Минимальное число: ${min}`,
    `Четных чисел: ${even}`,
    `Нечетных чисел: ${odd}`,
    `Время выполнения: ${elapsed} сек`,
  ].join('\n');
  await fs.writeFile(processedFile, results, 'utf8');
  console.log('\nОбработка завершена!\nРезультаты:');
  console.log(results);
  console.log(`\nРезультаты сохранены в: processed_${VARIANT}.txt`);
}
(async () => {
  try {
    await generateFile();
    await processFile();
  } catch (error) {
    console.error('Ошибка:', error.message);
  }
})();