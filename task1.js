const { promises: fs } = require('fs');
const path = require('path');

const VARIANT = 4;

async function task1() {
  const fileName = `student_${VARIANT}.txt`;
  const filePath = path.join(__dirname, fileName);

  try {
    const now = new Date().toLocaleString('ru-RU');
    const lines = [
      'Студент: Голубович Алиса',   
      'Группа: 478',             
      `Вариант: ${VARIANT}`,
      `Дата: ${now}`,
      '',
      'Любимые книги:',
      '1. "Восхождение Ганнибала" - Т. Харрис',
      '2. "Молчание Ягнят" - Т. Харрис',
      '3. "Скорбь Сатаны" - М. Корелли',
      '4. "Гроб из Гонконга" - Дж. Хэдли Чейз',
      '5. "Белый Джаз" - Дж. Эллрой',
    ];
    await fs.writeFile(filePath, lines.join('\n'), 'utf8');
    console.log(`Создан файл: ${fileName}`);
    const content = await fs.readFile(filePath, 'utf8');
    const lineCount = content.split('\n').length;
    await fs.appendFile(filePath, `\nКоличество записей: ${lineCount}`, 'utf8');
    const finalContent = await fs.readFile(filePath, 'utf8');
    console.log('\nСодержимое файла:\n');
    console.log(finalContent);
  } catch (error) {
    if (error.code === 'EACCES') {
      console.error(`Нет прав доступа к файлу ${fileName}`);
    } else if (error.code === 'ENOENT') {
      console.error('Директория или файл не найдены');
    } else {
      console.error('Ошибка:', error.message);
    }
  }
}

task1();