const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, 'logs.txt');
function setupLogger(app) {
  app.on('server:started', (port) => {
    writeLog('server:started', `порт ${port}`);
  });
  app.on('server:stopped', () => {
    writeLog('server:stopped', '');
  });
  app.on('request:received', (reqInfo) => {
    writeLog('request:received', `${reqInfo.method} ${reqInfo.url}`);
  });
}
function writeLog(eventName, data) {
  const time = new Date().toISOString();
  const line = `[${time}] ${eventName}: ${data}\n`;

  fs.appendFile(logFile, line, (err) => {
    if (err) console.error('Ошибка записи в logs.txt:', err);
  });
}
module.exports = { setupLogger };