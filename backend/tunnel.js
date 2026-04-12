const { spawn } = require('child_process');

console.log('Starting reliable tunnel using localhost.run (localtunnel is currently experiencing outages)...');

const tunnel = spawn('ssh', [
  '-o', 'StrictHostKeyChecking=accept-new',
  '-R', '80:localhost:5000',
  'nokey@localhost.run'
]);

let urlPrinted = false;

function handleOutput(data) {
  const output = data.toString();
  // We look for the URL in the output
  if (!urlPrinted && output.includes('https://')) {
    const match = output.match(/https:\/\/[a-zA-Z0-9.-]+\.lhr\.life/);
    if (match) {
        console.log('\n=======================================');
        console.log('🔗 YOUR PUBLIC SHAREABLE LINK:');
        console.log(match[0]);
        console.log('=======================================\n');
        urlPrinted = true;
    }
  }
}

tunnel.stdout.on('data', handleOutput);
tunnel.stderr.on('data', handleOutput);

tunnel.on('close', (code) => {
  console.log(`Tunnel closed with code ${code}`);
});
