const fs = require('node:fs');
const path = require('node:path');

const clientId = (process.argv[2] || '').trim();
if (!/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(clientId)) {
  console.error('Usage: npm run setup:google -- YOUR_WEB_CLIENT_ID.apps.googleusercontent.com');
  console.error('Create a Web application client in Google Auth Platform with JavaScript origin http://localhost:3001.');
  process.exitCode = 1;
} else {
  const envPath = path.resolve(__dirname, '../backend/.env');
  let contents = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const newline = contents.includes('\r\n') ? '\r\n' : '\n';
  const lines = contents.split(/\r?\n/).filter(line => !/^\s*GOOGLE_CLIENT_ID\s*=/.test(line));
  while (lines.length && lines.at(-1) === '') lines.pop();
  lines.push(`GOOGLE_CLIENT_ID=${clientId}`);
  if (!lines.some(line => /^\s*FRONTEND_URL\s*=\s*\S/.test(line))) {
    lines.push('FRONTEND_URL=http://localhost:3001');
  }
  fs.writeFileSync(envPath, lines.join(newline) + newline);
  console.log('Google Client ID saved in backend/.env. Restart npm run dev, then open http://localhost:3001/auth/login.');
}
