const data = require('./.lighthouseci/lhr-1765026725194.json');

const linkTextAudit = data.audits['link-text'];

console.log('Link Text Audit Details:\n');
console.log(`Score: ${linkTextAudit.score}`);
console.log(`Description: ${linkTextAudit.description}\n`);

if (linkTextAudit.details && linkTextAudit.details.items) {
  console.log('Problematic Links:');
  linkTextAudit.details.items.forEach((item, index) => {
    console.log(`\n${index + 1}. Href: ${item.href || 'N/A'}`);
    console.log(`   Text: "${item.text || 'N/A'}"`);
    console.log(`   Selector: ${item.selector || 'N/A'}`);
  });
}
