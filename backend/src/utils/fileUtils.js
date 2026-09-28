const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const DIRS = {
  backgrounds: path.join(ROOT, 'uploads', 'backgrounds'),
  videos: path.join(ROOT, 'uploads', 'videos'),
  outputs: path.join(ROOT, 'outputs'),
  temp: path.join(ROOT, 'temp'),
};

function ensureDirs() {
  Object.values(DIRS).forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

function sanitizeBaseName(originalName) {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  const cleanBase = base.normalize('NFKD').replace(/[^\w\-\s.]/g, '').trim() || 'video';
  return { base: cleanBase, ext: ext || '.mp4' };
}

function buildOutputName(originalName, existingNames) {
  const { base } = sanitizeBaseName(originalName);
  let candidate = `${base}-editado.mp4`;
  let counter = 2;
  while (existingNames.has(candidate)) {
    candidate = `${base}-editado-${counter}.mp4`;
    counter += 1;
  }
  existingNames.add(candidate);
  return candidate;
}

function safeUnlink(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.warn('Falha ao remover arquivo temporário:', filePath, err.message);
  }
}

module.exports = { DIRS, ensureDirs, sanitizeBaseName, buildOutputName, safeUnlink };
