const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink);
const readdir = promisify(fs.readdir);
const mkdir = promisify(fs.mkdir);
const exists = promisify(fs.exists);
class FileManagerMixed {
  constructor(baseDir = './data-mixed') {
    this.baseDir = baseDir;
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
      console.log(`Создана директория: ${this.baseDir}`);
    }
  }
  async createFilePromise(filename, content) {
    const filePath = path.join(this.baseDir, filename);
    await writeFile(filePath, content, 'utf8');
    return filePath;
  }
  createFile(filename, content, callback) {
    const promise = this.createFilePromise(filename, content);
    if (typeof callback === 'function') {
      promise
        .then(filePath => callback(null, filePath))
        .catch(err => callback(err, null));
    }
    return promise;
  }
  async readFilePromise(filename) {
    const filePath = path.join(this.baseDir, filename);
    return await readFile(filePath, 'utf8');
  }

  readFile(filename, callback) {
    const promise = this.readFilePromise(filename);
    if (typeof callback === 'function') {
      promise
        .then(content => callback(null, content))
        .catch(err => callback(err, null));
    }
    return promise;
  }
  async getFileStats(filename) {
    const filePath = path.join(this.baseDir, filename);
    const stats = await stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile()
    };
  }
  async deleteFile(filename) {
    const filePath = path.join(this.baseDir, filename);
    await unlink(filePath);
  }
  async listFiles() {
    const files = await readdir(this.baseDir);
    const fileStats = await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(this.baseDir, file);
        const stats = await stat(filePath);
        return { name: file, isFile: stats.isFile() };
      })
    );
    return fileStats.filter(f => f.isFile).map(f => f.name);
  }
}
module.exports = FileManagerMixed;