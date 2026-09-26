const FileManagerMixed = require('./fileOperationsMixed');
const fm = new FileManagerMixed('./test-data-mixed');
async function testMixed() {
  console.log('== СМЕШАННЫЙ ПОДХОД ===\n');
  console.log('1. Создание через колбэк...');
  fm.createFile('mixed1.txt', 'Создан через колбэк', (err, filePath) => {
    if (err) {
      console.error('Ошибка:', err.message);
      return;
    }
    console.log(`  Файл создан: ${filePath}`);
    console.log('\n2. Создание через промис...');
    fm.createFile('mixed2.txt', 'Создан через промис')
      .then(path => {
        console.log(`  Файл создан: ${path}`);
        console.log('\n3. Чтение через колбэк...');
        fm.readFile('mixed1.txt', (err, content) => {
          if (err) {
            console.error('Ошибка:', err.message);
            return;
          }
          console.log(`  Содержимое: "${content}"`);
          console.log('\n4. Чтение через промис...');
          fm.readFile('mixed2.txt')
            .then(content2 => {
              console.log(`  Содержимое: "${content2}"`);
            })
            .catch(err => console.error('Ошибка:', err.message));
        });
      })
      .catch(err => console.error('Ошибка:', err.message));
  });
}

testMixed();