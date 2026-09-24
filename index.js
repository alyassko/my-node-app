const http = require('http');
function calculatePi(digits) {
  const precision = 1 / Math.pow(10, digits + 10);
  function arctan(x) {
    let sum = 0;
    let term = x;
    let n = 0;
    while (Math.abs(term) > precision) {
      sum += (n % 2 === 0 ? 1 : -1) * term / (2 * n + 1);
      term *= x * x;
      n++;
    }
    return sum;
  }
  const pi = 16 * arctan(1 / 5) - 4 * arctan(1 / 239);
  return pi.toFixed(digits);
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  const fio = 'Golubovich Alisa Sergeevna';
  const group = '478';
  const journalNumber = 4;
  const piValue = calculatePi(journalNumber);
  res.end(`<pre>${fio}\n${group}\n${piValue}</pre>`);
});
server.listen(3000, () => {
  console.log('Сервер запущен на порту 3000');
});