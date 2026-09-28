require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { ensureDirs, DIRS } = require('./utils/fileUtils');
const apiRoutes = require('./routes/api');

ensureDirs();

const app = express();
const PORT = process.env.PORT || 4000;
const APP_PASSWORD = process.env.APP_PASSWORD || '';

app.use(cors());
app.use(express.json());

if (APP_PASSWORD) {
  app.use((req, res, next) => {
    const header = req.headers.authorization || '';
    const [scheme, encoded] = header.split(' ');
    if (scheme === 'Basic' && encoded) {
      const [, pass] = Buffer.from(encoded, 'base64').toString().split(':');
      if (pass === APP_PASSWORD) return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="FOCO TOTAL"');
    return res.status(401).send('Senha necessária.');
  });
}

app.use('/api', apiRoutes);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'foco-total-backend' });
});

const FRONTEND_DIST = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    return res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: err.message || 'Erro inesperado no servidor.' });
});

const OUTPUT_TTL_MS = parseInt(process.env.OUTPUT_TTL_MS || '3600000', 10);
setInterval(() => {
  const now = Date.now();
  [DIRS.outputs, DIRS.backgrounds, DIRS.videos, DIRS.temp].forEach((dir) => {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach((entry) => {
      const entryPath = path.join(dir, entry);
      try {
        const stat = fs.statSync(entryPath);
        if (now - stat.mtimeMs > OUTPUT_TTL_MS) {
          fs.rmSync(entryPath, { recursive: true, force: true });
        }
      } catch (_) {}
    });
  });
}, 15 * 60 * 1000).unref();

app.listen(PORT, () => {
  console.log(`FOCO TOTAL backend rodando em http://localhost:${PORT}`);
});
