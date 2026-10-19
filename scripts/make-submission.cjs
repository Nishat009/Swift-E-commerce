// Builds submission.zip from the files tracked in git, so node_modules, .next, build output,
// .git and real .env files never end up in the archive.
const { execFileSync } = require('child_process');
const path = require('path');

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

const tracked = git('ls-files').split('\n');
const secrets = tracked.filter((file) => /(^|\/)\.env(\.[^/]*)?$/.test(file) && !file.endsWith('.env.example'));
if (secrets.length) {
  console.error('Refusing to build: these env files are tracked in git and would be zipped:');
  secrets.forEach((file) => console.error(`  ${file}`));
  console.error('Run "git rm --cached <file>" and commit, then try again.');
  process.exit(1);
}

if (git('status', '--porcelain')) {
  console.warn('Warning: you have uncommitted changes. The ZIP only contains the last commit (HEAD).');
}

const out = path.resolve(process.argv[2] || 'submission.zip');
git('archive', '--format=zip', '--prefix=Swift-E-commerce/', '-o', out, 'HEAD');
console.log(`Created ${out}`);
