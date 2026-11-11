const { promises: fs } = require('fs');
const path = require('path');

const VARIANT = 4;
const isEven = VARIANT % 2 === 0; 

async function task2() {
  const projectDir = path.join(__dirname, `project_${VARIANT}`);

  const folders = {
    'src': 'Исходный код проекта',
    'src/modules': 'Модули приложения',
    'src/components': 'Переиспользуемые компоненты',
    'src/utils': 'Вспомогательные утилиты',
    'data': 'Данные проекта',
    'data/input': 'Входные данные',
    'data/output': 'Выходные данные',
    'data/temp': 'Временные файлы',
  };

  try {
    for (const [rel, description] of Object.entries(folders)) {
      const dirPath = path.join(projectDir, rel);
      await fs.mkdir(dirPath, { recursive: true }); // recursive: true — создаёт вложенные
      await fs.writeFile(path.join(dirPath, 'info.txt'), description, 'utf8');
      if (isEven) {
        await fs.writeFile(path.join(dirPath, 'README.md'), new Date().toISOString(), 'utf8');
      }
    }
    if (!isEven) {
      for (const num of [1, 2, 3]) {
        const sub = path.join(projectDir, 'src', 'components', String(num));
        await fs.mkdir(sub, { recursive: true });
        await fs.writeFile(path.join(sub, 'info.txt'), `Компонент №${num}`, 'utf8');
      }
    }

    console.log('Исходное дерево:');
    await printTree(projectDir);
    const outputDir = path.join(projectDir, 'data', 'output');
    const resultsDir = path.join(projectDir, 'data', 'results');
    await fs.rename(outputDir, resultsDir);
    console.log('\nПереименовано: data/output -> data/results');
    const tempDir = path.join(projectDir, 'data', 'temp');
    await fs.rm(tempDir, { recursive: true, force: true });
    console.log('Удалена папка: data/temp');
    console.log('\nОбновлённое дерево:');
    await printTree(projectDir);
  } catch (error) {
    if (error.code === 'EEXIST') {
      console.error('Файл/папка уже существует:', error.path);
    } else if (error.code === 'ENOENT') {
      console.error('Путь не найден:', error.path);
    } else {
      console.error('Ошибка:', error.message);
    }
  }
}

async function printTree(dir, depth = 0) {
  const indent = '  '.repeat(depth);
  const items = await fs.readdir(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      console.log(`${indent}${item.name}/`);
      await printTree(full, depth + 1);
    } else {
      console.log(`${indent}${item.name}`);
    }
  }
}

task2();