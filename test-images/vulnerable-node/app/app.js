const express = require('express');
const app = express();
const exec = require('child_process').exec;

app.get('/health', (req, res) => res.send('OK'));

app.get('/ping', (req, res) => {
  exec(`ping -c 1 ${req.query.host}`, (err, stdout) => {
    if (err) return res.status(500).send(err.message);
    res.send(`<pre>${stdout}</pre>`);
  });
});

app.get('/debug', (req, res) => {
  res.json({
    env: process.env,
    cwd: process.cwd(),
    versions: process.versions,
    pid: process.pid,
  });
});

app.listen(3000, '0.0.0.0', () => console.log('Server running on port 3000'));
