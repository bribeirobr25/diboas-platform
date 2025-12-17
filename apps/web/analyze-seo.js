const fs = require('fs');
const path = require('path');

// Find the latest Lighthouse report
const lhciDir = './.lighthouseci';
const files = fs.readdirSync(lhciDir)
  .filter(f => f.startsWith('lhr-') && f.endsWith('.json'))
  .map(f => ({
    name: f,
    time: fs.statSync(path.join(lhciDir, f)).mtime.getTime()
  }))
  .sort((a, b) => b.time - a.time);

if (files.length === 0) {
  console.error('No Lighthouse reports found');
  process.exit(1);
}

const latestReport = files[0].name;
console.log(`Analyzing: ${latestReport}\n`);
const data = require(path.resolve(lhciDir, latestReport));

console.log('SEO Score:', data.categories.seo.score);
console.log('\nFailing/Warning SEO Audits:\n');

const audits = data.categories.seo.auditRefs;
audits.forEach(a => {
  const audit = data.audits[a.id];
  if (audit.score !== null && audit.score < 1) {
    console.log(`❌ ${audit.title}`);
    console.log(`   Score: ${audit.score}`);
    console.log(`   ${audit.description}`);
    if (audit.details && audit.details.items) {
      console.log(`   Items:`, audit.details.items.length);
    }
    console.log('');
  }
});
