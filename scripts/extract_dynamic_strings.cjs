/* Run with Node.js + acorn when dynamic page UI changes. */
const fs = require('fs'), path = require('path'), acorn = require('acorn');
const root = path.resolve(__dirname, '..');
const strings = new Set();
const bilingual = [];
function pair(a,b) {
  if (a?.type === 'Literal' && b?.type === 'Literal' && typeof a.value === 'string' && typeof b.value === 'string' && /[\u3400-\u9fff]/.test(a.value) && /[a-zA-Z]/.test(b.value)) bilingual.push([a.value,b.value]);
}
function parse(source, file) {
  let ast;
  try { ast = acorn.parse(source, {ecmaVersion:'latest', sourceType:'module'}); }
  catch (e) { throw new Error(file + ': ' + e.message); }
  function visit(n) {
    if (!n || typeof n !== 'object') return;
    if (n.type === 'Literal' && typeof n.value === 'string') strings.add(n.value);
    if (n.type === 'TemplateLiteral' && n.expressions.length === 0) strings.add(n.quasis[0].value.cooked);
    if (n.type === 'ArrayExpression' && n.elements.length === 2) pair(n.elements[0],n.elements[1]);
    if (n.type === 'CallExpression' && (n.callee?.name === 'L' || n.callee?.property?.name === 'L')) pair(n.arguments[0],n.arguments[1]);
    if (n.type === 'ObjectExpression') {
      const fields = Object.fromEntries(n.properties.filter(p=>p.type==='Property').map(p=>[p.key.name||p.key.value,p.value]));
      pair(fields.zh,fields.en);
    }
    Object.values(n).forEach(x => { if (Array.isArray(x)) x.forEach(visit); else if (x && typeof x === 'object') visit(x); });
  }
  visit(ast);
}
function walk(dir) {
  for (const e of fs.readdirSync(dir, {withFileTypes:true})) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'tests') continue;
    const p = path.join(dir,e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.html')) {
      const html=fs.readFileSync(p,'utf8');
      for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
        if (/type=["'](?:application\/|importmap)/.test(m[1]) || !m[2].trim()) continue;
        parse(m[2],p);
      }
    }
  }
}
walk(root);
for (const file of ['fp-search.js','fp-tags.js','lecture-video.js','lecture10.js']) parse(fs.readFileSync(path.join(root,'js',file),'utf8'),file);
for (const file of fs.readdirSync(path.join(root,'campus/odyssey/js'))) {
  if (file.endsWith('.js')) parse(fs.readFileSync(path.join(root,'campus/odyssey/js',file),'utf8'),file);
}
fs.writeFileSync(path.join(root,'assets/i18n/dynamic-source.json'),JSON.stringify([...strings],null,1)+'\n');
fs.writeFileSync(path.join(root,'assets/i18n/bilingual-source.json'),JSON.stringify(bilingual,null,1)+'\n');
console.log(strings.size + ' dynamic string literals extracted.');
console.log(bilingual.length + ' authored bilingual pairs extracted.');
