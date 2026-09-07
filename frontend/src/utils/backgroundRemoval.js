import { BACKEND_ORIGIN } from '../config';

/**
 * Client-Side AI Background Removal Engine
 *
 * Uses RMBG-1.4 (Bria AI) running locally inside the user's browser via
 * @huggingface/transformers (WebAssembly / WebGPU).
 *
 * - 42MB Quantized Model (cached in browser CacheStorage)
 * - 100% Private & Instantaneous
 * - Zero Server OOM Crashes • Zero Network Timeouts • Zero 502 Bad Gateways
 */

let modelPromise = null;
let processorPromise = null;

/**
 * Lazy-load the RMBG-1.4 model and processor once in the browser session.
 */
async function getBrowserModelAndProcessor(onProgress) {
  const { AutoModel, AutoProcessor, env } = await import('@huggingface/transformers');
  env.allowLocalModels = false;
  env.useBrowserCache = true;

  if (!modelPromise) {
    if (onProgress) {
      onProgress({ phase: 'init', percent: 15, text: 'Preparing AI Studio (one-time setup)...' });
    }
    modelPromise = AutoModel.from_pretrained('briaai/RMBG-1.4', {
      quantized: true,
      progress_callback: (p) => {
        if (onProgress && p.status === 'progress') {
          const pct = Math.min(85, Math.max(15, Math.round(p.progress || 0)));
          onProgress({
            phase: 'downloading',
            percent: pct,
            text: `Loading AI model (${pct}%)...`,
          });
        }
      },
    });
  }

  if (!processorPromise) {
    processorPromise = AutoProcessor.from_pretrained('briaai/RMBG-1.4');
  }

  return Promise.all([modelPromise, processorPromise]);
}

/**
 * Robustly load any image format (Blob, File, relative URL, external URL, or data URL) into RawImage.
 */
async function loadRawImage(imageSrc, RawImage) {
  if (imageSrc instanceof Blob) {
    try {
      return await RawImage.fromBlob(imageSrc);
    } catch {
      // Fallback via ObjectURL
      const url = URL.createObjectURL(imageSrc);
      try {
        return await RawImage.fromURL(url);
      } finally {
        URL.revokeObjectURL(url);
      }
    }
  }

  if (typeof imageSrc === 'string') {
    let targetUrl = imageSrc;
    if (targetUrl.startsWith('/uploads')) {
      targetUrl = `${BACKEND_ORIGIN}${targetUrl}`;
    }

    if (targetUrl.startsWith('data:') || targetUrl.startsWith('blob:')) {
      return await RawImage.fromURL(targetUrl);
    }

    // Load via standard HTML Image to handle cross-origin reliably
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(RawImage.fromCanvas(canvas));
      };
      img.onerror = () => {
        // Direct fromURL attempt as fallback
        RawImage.fromURL(targetUrl).then(resolve).catch(reject);
      };
      img.src = targetUrl;
    });
  }

  return await RawImage.read(imageSrc);
}

/**
 * Remove background from an image using browser-side RMBG-1.4 AI.
 *
 * @param {string|Blob|File} imageSrc - The image source (Blob, File, or URL)
 * @param {Object} [options]
 * @param {Function} [options.onProgress] - Progress callback
 * @param {'studio'|'transparent'} [options.background='studio'] - Output mode
 * @returns {Promise<{ blob: Blob, dataUrl: string }>}
 */
export async function removeImageBackground(imageSrc, { onProgress, background = 'studio' } = {}) {
  const { RawImage } = await import('@huggingface/transformers');
  const [model, processor] = await getBrowserModelAndProcessor(onProgress);

  if (onProgress) {
    onProgress({ phase: 'processing', percent: 88, text: 'Isolating craft with AI Studio...' });
  }

  let img = await loadRawImage(imageSrc, RawImage);

  // Constrain resolution to max 1024px for lightning-fast inference and minimal memory
  const maxDim = 1024;
  if (Math.max(img.width, img.height) > maxDim) {
    const scale = maxDim / Math.max(img.width, img.height);
    const newW = Math.round(img.width * scale);
    const newH = Math.round(img.height * scale);
    img = await img.resize(newW, newH);
  }

  const { pixel_values } = await processor(img);
  const { output } = await model({ input: pixel_values });

  // Generate accurate alpha mask and apply to image
  const mask = await RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(img.width, img.height);
  const transparent = img.putAlpha(mask);

  let finalCanvas;

  if (background === 'studio') {
    // Studio mode: composite isolated craft onto crisp white background with soft ambient lighting
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');

    // 1. Crisp clean white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Subtle radial ambient studio lighting
    const grad = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height * 0.45,
      canvas.width * 0.1,
      canvas.width / 2,
      canvas.height * 0.5,
      canvas.width * 0.7
    );
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(1, '#F8F9FA');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Draw isolated craft
    const tCanvas = transparent.toCanvas();
    ctx.drawImage(tCanvas, 0, 0);

    finalCanvas = canvas;
  } else {
    // Transparent cutout mode
    finalCanvas = transparent.toCanvas();
  }

  if (onProgress) {
    onProgress({ phase: 'done', percent: 100, text: 'Enhancement complete!' });
  }

  return new Promise((resolve, reject) => {
    finalCanvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Canvas blob export failed'));
        resolve({
          blob,
          dataUrl: finalCanvas.toDataURL('image/png'),
        });
      },
      'image/png',
      0.95
    );
  });
}
