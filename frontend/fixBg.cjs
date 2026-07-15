const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx')) {
      results.push(file);
    }
  });
  return results;
}
const files = walk(path.join(__dirname, 'src'));
let changedCount = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const orig = content;
  content = content.replace(/\bbg-white(?=[\s\"'\`])/g, 'bg-bg-color');
  if (orig !== content) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
  }
});
console.log('Modified ' + changedCount + ' files.');
