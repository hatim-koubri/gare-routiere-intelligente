const fs = require('fs');
const path = require('path');
const file = 'app/[locale]/responsable/chauffeurs/page.tsx';
let content = fs.readFileSync(file, 'utf8');
let count = 0;
content.replace(/(<(?:input|select|textarea)\b)([\s\S]*?)(\/?>)/g, (match, t1, t2, t3) => {
  count++;
  console.log('--- FOUND TAG ---');
  console.log(match);
  if (t2.includes('className="')) console.log('Has className');
});
console.log('Total tags:', count);
