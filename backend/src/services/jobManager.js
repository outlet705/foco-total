const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { probeFile, processVideo, isImageFile } = require('./ffmpegService');
const { DIRS, buildOutputName, safeUnlink } = require('../utils/fileUtils');

const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT_JOBS || '2', 10);

const jobs = new Map();

function createJob({ backgroundPath, backgroundType, videoFiles }) {
  const jobId = uuidv4();
  const outputDir = path.join(DIRS.outputs, jobId);
  require('fs').mkdirSync(outputDir, { recursive: true });

  const usedNames = new Set();
  const items = videoFiles.map((file) => ({
    id: uuidv4(),
    originalName: file.originalname,
    storedPath: file.path,
    size: file.size,
    status: 'waiting',
    progress: 0,
    outputPath: null,
    outputName: buildOutputName(file.originalname, usedNames),
    error: null,
    duration: null,
  }));

  const job = {
    id: jobId,
    status: 'idle',
    background: { path: backgroundPath, type: backgroundType },
    items,
    outputDir,
    createdAt: Date.now(),
  };

  jobs.set(jobId, job);
  return job;
}

function getJob(jobId) {
  return jobs.get(jobId);
}

function publicJobView(job) {
  const total = job.items.length;
  const done = job.items.filter((i) => i.status === 'done').length;
  const errors = job.items.filter((i) => i.status === 'error').length;
  return {
    id: job.id,
    status: job.status,
    total,
    done,
    errors,
    overallPercent: total ? Math.round(((done + errors) / total) * 100) : 0,
    items: job.items.map((i) => ({
      id: i.id,
      originalName: i.originalName,
      outputName: i.outputName,
      status: i.status,
      progress: i.progress,
      error: i.error,
      size: i.size,
      duration: i.duration,
    })),
  };
}

async function processItem(job, item) {
  item.status = 'processing';
  item.progress = 0;
  item.error = null;
  try {
    const videoInfo = await probeFile(item.storedPath);
    if (!videoInfo.hasVideo) {
      throw new Error('Arquivo não contém trilha de vídeo válida.');
    }
    item.duration = videoInfo.duration;

    const outputPath = path.join(job.outputDir, item.outputName);
    await processVideo({
      backgroundPath: job.background.path,
      backgroundType: job.background.type,
      videoPath: item.storedPath,
      outputPath,
      videoInfo,
      onProgress: (pct) => {
        item.progress = pct;
      },
    });

    item.outputPath = outputPath;
    item.status = 'done';
    item.progress = 100;
  } catch (err) {
    item.status = 'error';
    item.error = err.message;
  }
}

async function runQueue(job) {
  job.status = 'running';
  let cursor = 0;

  async function worker() {
    while (cursor < job.items.length) {
      const idx = cursor;
      cursor += 1;
      const item = job.items[idx];
      await processItem(job, item);
      if (item.status === 'done') {
        safeUnlink(item.storedPath);
      }
    }
  }

  const workers = Array.from({ length: Math.min(MAX_CONCURRENT, job.items.length) }, () => worker());
  await Promise.all(workers);
  job.status = 'completed';
}

async function retryItem(job, itemId) {
  const item = job.items.find((i) => i.id === itemId);
  if (!item) throw new Error('Item não encontrado.');
  if (!require('fs').existsSync(item.storedPath)) {
    throw new Error('Arquivo original não está mais disponível para reprocessar. Faça upload novamente.');
  }
  await processItem(job, item);
  return item;
}

module.exports = { createJob, getJob, publicJobView, runQueue, retryItem, isImageFile };
