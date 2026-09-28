const archiver = require('archiver');

function streamJobAsZip(job, res) {
  const archive = archiver('zip', { zlib: { level: 0 } });

  res.attachment('foco-total-videos.zip');
  archive.on('error', (err) => {
    res.status(500).end(`Erro ao gerar ZIP: ${err.message}`);
  });

  archive.pipe(res);

  job.items
    .filter((item) => item.status === 'done' && item.outputPath)
    .forEach((item) => {
      archive.file(item.outputPath, { name: item.outputName });
    });

  archive.finalize();
}

module.exports = { streamJobAsZip };
