const express = require('express');
const path = require('path');
const fs = require('fs');
const { backgroundUpload, videosUpload } = require('../middleware/uploadMiddleware');
const { probeFile, isImageFile } = require('../services/ffmpegService');
const jobManager = require('../services/jobManager');
const { streamJobAsZip } = require('../services/zipService');
const { safeUnlink } = require('../utils/fileUtils');

const router = express.Router();

router.post('/background', backgroundUpload.single('background'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo de plano de fundo enviado.' });

    const type = isImageFile(req.file.path) ? 'image' : 'video';

    if (type === 'video') {
      const info = await probeFile(req.file.path);
      if (!info.hasVideo) {
        safeUnlink(req.file.path);
        return res.status(400).json({ error: 'O vídeo de plano de fundo é inválido ou está corrompido.' });
      }
    }

    return res.json({
      path: req.file.path,
      type,
      previewUrl: `/api/preview/background/${path.basename(req.file.path)}`,
      originalName: req.file.originalname,
    });
  } catch (err) {
    return res.status(400).json({ error: `Falha ao processar plano de fundo: ${err.message}` });
  }
});

router.get('/preview/background/:filename', (req, res) => {
  const { DIRS } = require('../utils/fileUtils');
  const filePath = path.join(DIRS.backgrounds, path.basename(req.params.filename));
  if (!fs.existsSync(filePath)) return res.status(404).end();
  return res.sendFile(filePath);
});

router.post('/videos', videosUpload.array('videos', 500), async (req, res) => {
  try {
    const { backgroundPath, backgroundType } = req.body;
    if (!backgroundPath || !fs.existsSync(backgroundPath)) {
      return res.status(400).json({ error: 'Plano de fundo não encontrado. Envie o plano de fundo novamente.' });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Nenhum vídeo foi enviado.' });
    }

    const validFiles = [];
    const rejected = [];
    for (const file of req.files) {
      try {
        const info = await probeFile(file.path);
        if (!info.hasVideo || !(info.duration > 0)) {
          rejected.push({ name: file.originalname, reason: 'Arquivo corrompido ou sem duração válida.' });
          safeUnlink(file.path);
          continue;
        }
        validFiles.push(file);
      } catch (err) {
        rejected.push({ name: file.originalname, reason: 'Formato incompatível ou arquivo corrompido.' });
        safeUnlink(file.path);
      }
    }

    if (validFiles.length === 0) {
      return res.status(400).json({ error: 'Nenhum dos vídeos enviados é válido.', rejected });
    }

    const job = jobManager.createJob({ backgroundPath, backgroundType, videoFiles: validFiles });

    return res.json({ job: jobManager.publicJobView(job), rejected });
  } catch (err) {
    return res.status(500).json({ error: `Falha ao registrar vídeos: ${err.message}` });
  }
});

router.post('/jobs/:jobId/process', (req, res) => {
  const job = jobManager.getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job não encontrado.' });
  if (job.status === 'running') return res.status(409).json({ error: 'Este job já está em processamento.' });

  jobManager.runQueue(job).catch((err) => {
    console.error('Erro inesperado na fila:', err);
  });

  return res.json({ job: jobManager.publicJobView(job) });
});

router.get('/jobs/:jobId/status', (req, res) => {
  const job = jobManager.getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job não encontrado.' });
  return res.json({ job: jobManager.publicJobView(job) });
});

router.post('/jobs/:jobId/items/:itemId/retry', async (req, res) => {
  const job = jobManager.getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job não encontrado.' });
  try {
    await jobManager.retryItem(job, req.params.itemId);
    return res.json({ job: jobManager.publicJobView(job) });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.get('/jobs/:jobId/items/:itemId/download', (req, res) => {
  const job = jobManager.getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job não encontrado.' });
  const item = job.items.find((i) => i.id === req.params.itemId);
  if (!item || item.status !== 'done' || !item.outputPath || !fs.existsSync(item.outputPath)) {
    return res.status(404).json({ error: 'Vídeo processado não encontrado.' });
  }
  return res.download(item.outputPath, item.outputName);
});

router.get('/jobs/:jobId/items/:itemId/preview', (req, res) => {
  const job = jobManager.getJob(req.params.jobId);
  if (!job) return res.status(404).end();
  const item = job.items.find((i) => i.id === req.params.itemId);
  if (!item || item.status !== 'done' || !item.outputPath || !fs.existsSync(item.outputPath)) {
    return res.status(404).end();
  }
  return res.sendFile(item.outputPath);
});

router.get('/jobs/:jobId/download-all', (req, res) => {
  const job = jobManager.getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job não encontrado.' });
  const hasDone = job.items.some((i) => i.status === 'done');
  if (!hasDone) return res.status(400).json({ error: 'Nenhum vídeo pronto para baixar ainda.' });
  return streamJobAsZip(job, res);
});

module.exports = router;
