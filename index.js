const http = require('http');
const EventEmitter = require('events');
const logger = require('./logger');

class OrderHandler extends EventEmitter {
  processOrder(orderId) {
    this.emit('order:start', orderId);

    setTimeout(() => {
      this.emit('order:processing', orderId, 'Идёт обработка...');

      setTimeout(() => {
        const sum = Math.floor(Math.random() * 901) + 100;
        this.emit('order:complete', orderId, sum);
      }, 2000);
    }, 2000);
  }
}

function calculatePi(digits = 7) {
  const terms = 10000;

  function atan(x) {
    let sum = 0;
    for (let n = 0; n < terms; n++) {
      const term = Math.pow(x, 2 * n + 1) / (2 * n + 1);
      sum += n % 2 === 0 ? term : -term;
    }
    return sum;
  }

  const pi = 16 * atan(1 / 5) - 4 * atan(1 / 239);
  const factor = 10 ** digits;
  return (Math.floor(pi * factor) / factor).toFixed(digits);
}

class AppServer extends EventEmitter {
  constructor() {
    super();
    this.server = null;
    this.orderHandler = new OrderHandler();

    this.orderHandler.on('order:start', (orderId) => {
      console.log(`[order:start] Заказ #${orderId} начат`);
    });

    this.orderHandler.on('order:processing', (orderId, message) => {
      console.log(`[order:processing] Заказ #${orderId}: ${message}`);
    });

    this.orderHandler.on('order:complete', (orderId, sum) => {
      const pi = calculatePi(7);
      console.log(
        `[order:complete] Заказ #${orderId} завершён на сумму ${sum} руб. PI = ${pi}`
      );
    });
  }

  start(port) {
    this.server = http.createServer((req, res) => {
      this.emit('request:received', {
        url: req.url,
        method: req.method
      });

      const orderMatch = req.url.match(/^\/order\/(\d+)$/);

      if (req.method === 'GET' && orderMatch) {
        const orderId = orderMatch[1];
        this.orderHandler.processOrder(orderId);

        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(`Заказ #${orderId} принят в обработку`);
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Hello from Event-Driven Server!');
    });

    this.server.listen(port, () => {
      this.emit('server:started', port);
    });
  }

  stop() {
    if (!this.server) return;

    this.server.close(() => {
      this.emit('server:stopped');
    });
  }
}

const app = new AppServer();

logger.setupLogger(app);

app.on('server:started', (port) => {
  console.log(`Сервер запущен на порту ${port}`);
});

app.on('request:received', ({ method, url }) => {
  console.log(`Получен запрос: ${method} ${url}`);
});

app.on('server:stopped', () => {
  console.log('Сервер остановлен');
});

app.start(3000);

// Эмуляция остановки через 10 секунд
setTimeout(() => {
  app.stop();
}, 10000);