const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

if (process.env.FFMPEG_PATH) ffmpeg.setFfmpegPath(process.env.FFMPEG_PATH);
if (process.env.FFPROBE_PATH) ffmpeg.setFfprobePath(process.env.FFPROBE_PATH);

const TARGET_W = 1080;
const TARGET_H = 1920;
const DEFAULT_FPS = 30;

function probeFile(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err);

      const videoStream = (data.streams || []).find((s) => s.codec_type === 'video');
      const audioStream = (data.streams || []).find((s) => s.codec_type === 'audio');
      const duration = parseFloat(data.format?.duration) || parseFloat(videoStream?.duration) || 0;

      let fps = DEFAULT_FPS;
      if (videoStream?.avg_frame_rate) {
        const [num, den] = videoStream.avg_frame_rate.split('/').map(Number);
        if (den && !Number.isNaN(num) && !Number.isNaN(den) && den !== 0) {
          const computed = num / den;
          if (computed > 0 && computed < 240) fps = Math.round(computed * 100) / 100;
        }
      }

      return resolve({
        duration,
        fps,
        width: videoStream?.width || null,
        height: videoStream?.height || null,
        hasVideo: !!videoStream,
        hasAudio: !!audioStream,
        raw: data,
      });
    });
  });
}

function isImageFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ['.png', '.jpg', '.jpeg', '.webp'].includes(ext);
}

function buildFilterComplex() {
  return [
    `[0:v]scale=${TARGET_W}:${TARGET_H}:force_original_aspect_ratio=increase,` +
      `crop=${TARGET_W}:${TARGET_H},setsar=1,fps=${DEFAULT_FPS}[bg]`,
    `[1:v]scale=${TARGET_W}:${TARGET_H}:force_original_aspect_ratio=decrease,setsar=1[fg]`,
    `[bg][fg]overlay=(W-w)/2:(H-h)/2:shortest=1[outv]`,
  ].join(';');
}

function processVideo({ backgroundPath, backgroundType, videoPath, outputPath, videoInfo, onProgress }) {
  return new Promise((resolve, reject) => {
    const command = ffmpeg();

    if (backgroundType === 'image') {
      command.input(backgroundPath).inputOptions(['-loop 1']);
    } else {
      command.input(backgroundPath).inputOptions(['-stream_loop -1']);
    }

    command.input(videoPath);

    const fps = videoInfo.fps && videoInfo.fps > 0 ? videoInfo.fps : DEFAULT_FPS;

    command
      .complexFilter(buildFilterComplex())
      .outputOptions([
        '-map [outv]',
        ...(videoInfo.hasAudio ? ['-map 1:a?'] : []),
        '-c:v libx264',
        '-preset veryfast',
        '-crf 20',
        '-pix_fmt yuv420p',
        `-r ${fps}`,
        ...(videoInfo.hasAudio ? ['-c:a aac', '-b:a 192k'] : []),
        '-movflags +faststart',
        '-shortest',
      ])
      .duration(videoInfo.duration > 0 ? videoInfo.duration + 0.5 : undefined)
      .on('progress', (progress) => {
        if (onProgress && videoInfo.duration > 0 && progress.timemark) {
          const parts = progress.timemark.split(':').map(Number);
          const seconds = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : 0;
          const percent = Math.min(99, Math.round((seconds / videoInfo.duration) * 100));
          onProgress(percent);
        }
      })
      .on('error', (err, stdout, stderr) => {
        reject(new Error(`FFmpeg falhou: ${err.message}\n${stderr || ''}`));
      })
      .on('end', () => {
        if (onProgress) onProgress(100);
        resolve(outputPath);
      })
      .save(outputPath);
  });
}

module.exports = { probeFile, processVideo, isImageFile, TARGET_W, TARGET_H };
