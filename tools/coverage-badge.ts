//Rewrites the coverage badge in README.md from the last `npm run test:coverage` run (coverage/coverage-summary.json).
//Usage: npm run test:coverage && npm run coverage:badge
//The badge is a static shields.io image, so run this and commit README.md when the number moves.
import fs from 'fs';

const summary = JSON.parse(fs.readFileSync('coverage/coverage-summary.json', 'utf-8'));
const lines: number = summary.total.lines.pct;
const colour = lines >= 90 ? 'brightgreen' : lines >= 75 ? 'green' : lines >= 60 ? 'yellow' : 'red';
const badge = `<!-- coverage-badge -->[![Coverage](https://img.shields.io/badge/coverage-${lines.toFixed(0)}%25-${colour}?style=flat)](CONTRIBUTING.md#running-the-tests)<!-- /coverage-badge -->`;

const readme = fs.readFileSync('README.md', 'utf-8');
const pattern = /<!-- coverage-badge -->.*?<!-- \/coverage-badge -->/s;
if (!pattern.test(readme)) throw new Error('README.md has no <!-- coverage-badge --> markers.');
fs.writeFileSync('README.md', readme.replace(pattern, badge));
console.log(`README coverage badge set to ${lines.toFixed(1)}% (lines)`);
