const fs = require('fs');

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const BASE = [
  ['der Apfel', 'apple'], ['das Haus', 'house'], ['das Wasser', 'water'], ['der Baum', 'tree'],
  ['die Schule', 'school'], ['die Stadt', 'city'], ['die Reise', 'travel'], ['das Angebot', 'offer'],
  ['die Entscheidung', 'decision'], ['die Erfahrung', 'experience']
];

const target = Number(process.argv[2] || 3600);
const docs = [];
for (let i = 0; i < target; i += 1) {
  const [german, en] = BASE[i % BASE.length];
  const level = LEVELS[i % LEVELS.length];
  docs.push({
    german: `${german} ${Math.floor(i / BASE.length) + 1}`,
    level,
    translation: {
      English: `${en} ${Math.floor(i / BASE.length) + 1}`,
      Russian: `перевод ${i + 1}`
    }
  });
}

fs.writeFileSync('words_seed_3600.json', JSON.stringify(docs, null, 2), 'utf8');
console.log(`Generated ${docs.length} words in words_seed_3600.json`);
