const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { DIRS } = require('../utils/fileUtils');

const BACKGROUND_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm']);
const VIDEO_MIME = new Set(['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-matroska']);
const VIDEO_EXT = new Set(['.mp4', '.mov', '.webm', '.avi', '.mkv']);
const BACKGROUND_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.mp4', '.mov', '.webm']);

function makeStorage(destDir) {
  return multer.diskStorage({
    destination: (req, file, cb) => cb(null, destDir),
    filename: (req, file, cb) => {
      const unique = crypto.randomBytes(8).toString('hex');
      const ext = path.extname(file.originalname) || '';
      cb(null, `${Date.now()}-${unique}${ext}`);
    },
  });
}

const backgroundUpload = multer({
  storage: makeStorage(DIRS.backgrounds),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!BACKGROUND_MIME.has(file.mimetype) && !BACKGROUND_EXT.has(ext)) {
      return cb(new Error('Formato de plano de fundo não suportado. Use PNG, JPG, JPEG, WEBP, MP4, MOV ou WEBM.'));
    }
    return cb(null, true);
  },
});

const videosUpload = multer({
  storage: makeStorage(DIRS.videos),
  limits: { fileSize: 2 * 1024 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!VIDEO_MIME.has(file.mimetype) && !VIDEO_EXT.has(ext)) {
      return cb(new Error(`Formato de vídeo não suportado: ${file.originalname}`));
    }
    return cb(null, true);
  },
});

module.exports = { backgroundUpload, videosUpload };
