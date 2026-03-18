import { execSync } from 'child_process';

function run(cmd) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { stdio: 'inherit' });
}

try {
  // 1) apply migrations / recreate DB
  run('npm run db:recreate');

  // 2) seed development data
  run('node scripts/seed-database.js');

  // 3) start dev server
  run('npm run dev');
} catch (err) {
  console.error('dev-setup falhou:', err);
  process.exit(1);
}
