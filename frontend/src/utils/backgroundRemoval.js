/**
 * Client-Side AI Background Removal Service
 *
 * Uses RMBG-1.4 (State-of-the-art background removal model by Bria AI)
 * executed entirely in-browser via Transformers.js (WebAssembly / WebGPU).
 *
 * 100% Free • No API Key • Zero Server Cost • Completely Private
 */

let segmenterInstance = null;

/**
 * Remove background from an image source (URL, DataURL, or Blob).
 *
 * @param {string|Blob} imageSrc - The image source URL or Blob
 * @param {Object} options
 * @param {Function} [options.onProgress] - Callback: ({ phase, percent, text }) => void
 * @param {'studio'|'transparent'} [options.background='studio'] - Output background type
 * @returns {Promise<{ blob: Blob, dataUrl: string }>}
 */
export async function removeImageBackground(imageSrc, { onProgress, background = 'studio' } = {}) {
  try {
    const { pipeline, env, RawImage } = await import('@xenova/transformers');
    env.allowLocalModels = false;
    env.useBrowserCache = true;

    if (onProgress) {
      onProgress({ phase: 'init', percent: 5, text: 'Initializing AI Studio...' });
    }

    // Reuse cached pipeline instance if already loaded in this session
    if (!segmenterInstance) {
      segmenterInstance = await pipeline('image-segmentation', 'briaai/RMBG-1.4', {
        progress_callback: (p) => {
          if (onProgress && p.status === 'progress') {
            const pct = Math.round(p.progress || 0);
            onProgress({
              phase: 'downloading',
              percent: Math.min(85, Math.round(pct * 0.8)),
              text: `Loading AI model (${pct}%)...`,
            });
          }
        },
      });
    }

    if (onProgress) {
      onProgress({ phase: 'processing', percent: 88, text: 'Extracting craft from background...' });
    }

    // Convert input to URL if it is a Blob
    let sourceUrl = imageSrc;
    let createdUrl = null;
    if (imageSrc instanceof Blob) {
      createdUrl = URL.createObjectURL(imageSrc);
      sourceUrl = createdUrl;
    }

    // 1. Process image through segmentation model
    const rawImage = await RawImage.fromURL(sourceUrl);
    const output = await segmenterInstance(rawImage);

    if (createdUrl) {
      URL.revokeObjectURL(createdUrl);
    }

    const mask = output?.[0]?.mask;
    if (!mask) {
      throw new Error('AI was unable to generate background mask');
    }

    // 2. Load original image into DOM Image to extract pixel data at exact dimensions
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('Failed to load image for canvas composition'));
      img.src = sourceUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = rawImage.width;
    canvas.height = rawImage.height;
    const ctx = canvas.getContext('2d');

    // Draw source image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Apply alpha mask pixel-by-pixel (mask.data has grayscale 0=bg, 255=fg)
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const maskData = mask.data;
    for (let i = 0; i < maskData.length; i++) {
      imgData.data[i * 4 + 3] = maskData[i];
    }
    ctx.putImageData(imgData, 0, 0);

    // 3. Composite onto Studio Background if requested
    let finalCanvas = canvas;
    if (background === 'studio') {
      const studioCanvas = document.createElement('canvas');
      studioCanvas.width = canvas.width;
      studioCanvas.height = canvas.height;
      const sctx = studioCanvas.getContext('2d');

      // Crisp e-commerce studio white with very soft vignette
      sctx.fillStyle = '#FFFFFF';
      sctx.fillRect(0, 0, studioCanvas.width, studioCanvas.height);
      const grad = sctx.createRadialGradient(
        studioCanvas.width / 2,
        studioCanvas.height / 2,
        studioCanvas.width * 0.1,
        studioCanvas.width / 2,
        studioCanvas.height / 2,
        studioCanvas.width * 0.7
      );
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(1, '#F8F8F9');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, studioCanvas.width, studioCanvas.height);

      // Realistic soft contact shadow under the product
      sctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
      sctx.shadowBlur = Math.round(studioCanvas.width * 0.015);
      sctx.shadowOffsetY = Math.round(studioCanvas.height * 0.008);
      sctx.drawImage(canvas, 0, 0);

      finalCanvas = studioCanvas;
    }

    if (onProgress) {
      onProgress({ phase: 'done', percent: 100, text: 'Enhancement complete!' });
    }

    return new Promise((resolve, reject) => {
      finalCanvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error('Canvas blob generation failed'));
          }
          resolve({
            blob,
            dataUrl: finalCanvas.toDataURL('image/png'),
          });
        },
        'image/png',
        0.95
      );
    });
  } catch (err) {
    console.error('Client-side background removal failed:', err);
    throw err;
  }
}
