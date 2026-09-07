/**
 * Client-Side AI Background Removal Service
 *
 * Provides ultra-fast, in-browser background removal using:
 * 1. @imgly/background-removal (WebAssembly - high performance, resilient)
 * 2. @xenova/transformers RMBG-1.4 (fallback)
 *
 * 100% Client-Side • No Server OOM Crashes • Zero API Cost • Instant Results
 */

let segmenterInstance = null;

/**
 * Composite a transparent image onto studio white background with soft realistic shadow.
 *
 * @param {Blob|HTMLImageElement} imageInput - Transparent PNG input
 * @param {'studio'|'transparent'} backgroundMode
 * @returns {Promise<{ blob: Blob, dataUrl: string }>}
 */
export async function applyStudioBackground(imageInput, backgroundMode = 'studio') {
  let img;
  let tempUrl = null;

  if (imageInput instanceof HTMLImageElement) {
    img = imageInput;
  } else if (imageInput instanceof Blob) {
    tempUrl = URL.createObjectURL(imageInput);
    img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('Failed to load image for studio background composition'));
      img.src = tempUrl;
    });
  } else {
    throw new Error('Invalid image input for composition');
  }

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (backgroundMode === 'studio') {
    // 1. Crisp white e-commerce studio background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // 2. Very subtle radial light gradient
    const grad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.1,
      width / 2,
      height / 2,
      width * 0.7
    );
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(1, '#F8F9FA');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // 3. Subtle grounded contact shadow
    ctx.shadowColor = 'rgba(15, 23, 42, 0.08)';
    ctx.shadowBlur = Math.max(8, Math.round(width * 0.015));
    ctx.shadowOffsetY = Math.max(4, Math.round(height * 0.008));
    ctx.drawImage(img, 0, 0, width, height);
  } else {
    // Transparent cutout
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
  }

  if (tempUrl) {
    URL.revokeObjectURL(tempUrl);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) return reject(new Error('Canvas blob generation failed'));
        resolve({
          blob,
          dataUrl: canvas.toDataURL('image/png'),
        });
      },
      'image/png',
      0.95
    );
  });
}

/**
 * Primary removal via @imgly/background-removal (browser WebAssembly).
 */
async function removeWithImgly(imageSrc, onProgress) {
  const { default: imglyRemoveBackground } = await import('@imgly/background-removal');

  if (onProgress) {
    onProgress({ phase: 'init', percent: 15, text: 'Initializing AI Studio engine...' });
  }

  const transparentBlob = await imglyRemoveBackground(imageSrc, {
    progress: (key, current, total) => {
      if (onProgress && total > 0) {
        const pct = Math.min(85, Math.max(15, Math.round((current / total) * 70) + 15));
        onProgress({
          phase: 'processing',
          percent: pct,
          text: `Processing craft isolation (${pct}%)...`,
        });
      }
    },
    output: {
      format: 'image/png',
      quality: 0.95,
      type: 'foreground',
    },
  });

  return transparentBlob;
}

/**
 * Fallback removal via @xenova/transformers RMBG-1.4.
 */
async function removeWithTransformers(imageSrc, onProgress) {
  const { pipeline, env, RawImage } = await import('@xenova/transformers');
  env.allowLocalModels = false;
  env.useBrowserCache = true;

  if (onProgress) {
    onProgress({ phase: 'init', percent: 15, text: 'Loading AI model (Transformers.js)...' });
  }

  if (!segmenterInstance) {
    segmenterInstance = await pipeline('image-segmentation', 'briaai/RMBG-1.4', {
      progress_callback: (p) => {
        if (onProgress && p.status === 'progress') {
          const pct = Math.round(p.progress || 0);
          onProgress({
            phase: 'downloading',
            percent: Math.min(85, Math.round(pct * 0.7) + 15),
            text: `Loading RMBG model (${pct}%)...`,
          });
        }
      },
    });
  }

  if (onProgress) {
    onProgress({ phase: 'processing', percent: 85, text: 'Segmenting craft edges...' });
  }

  let sourceUrl = imageSrc;
  let createdUrl = null;
  if (imageSrc instanceof Blob) {
    createdUrl = URL.createObjectURL(imageSrc);
    sourceUrl = createdUrl;
  }

  try {
    const rawImage = await RawImage.fromURL(sourceUrl);
    const output = await segmenterInstance(rawImage);

    const mask = output?.[0]?.mask;
    if (!mask) throw new Error('AI was unable to generate background mask');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('Failed to load image into canvas'));
      img.src = sourceUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = rawImage.width;
    canvas.height = rawImage.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const maskData = mask.data;
    for (let i = 0; i < maskData.length; i++) {
      imgData.data[i * 4 + 3] = maskData[i];
    }
    ctx.putImageData(imgData, 0, 0);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Mask compositing failed'));
          resolve(blob);
        },
        'image/png',
        0.95
      );
    });
  } finally {
    if (createdUrl) {
      URL.revokeObjectURL(createdUrl);
    }
  }
}

/**
 * Remove background from an image source (URL, DataURL, or Blob).
 * Automatically tries the fastest and most reliable client-side AI engine.
 *
 * @param {string|Blob} imageSrc - The image source URL or Blob
 * @param {Object} options
 * @param {Function} [options.onProgress] - Callback: ({ phase, percent, text }) => void
 * @param {'studio'|'transparent'} [options.background='studio'] - Output background type
 * @returns {Promise<{ blob: Blob, dataUrl: string }>}
 */
export async function removeImageBackground(imageSrc, { onProgress, background = 'studio' } = {}) {
  let transparentBlob = null;
  let lastErr = null;

  // 1. Try @imgly/background-removal first (optimized WebAssembly)
  try {
    transparentBlob = await removeWithImgly(imageSrc, onProgress);
  } catch (imglyErr) {
    console.warn('⚠️ @imgly/background-removal failed, trying Transformers.js fallback:', imglyErr.message || imglyErr);
    lastErr = imglyErr;
  }

  // 2. Fallback to @xenova/transformers RMBG-1.4 if needed
  if (!transparentBlob) {
    try {
      transparentBlob = await removeWithTransformers(imageSrc, onProgress);
    } catch (transErr) {
      console.error('⚠️ Transformers.js background removal also failed:', transErr.message || transErr);
      throw lastErr || transErr;
    }
  }

  if (onProgress) {
    onProgress({
      phase: 'compositing',
      percent: 95,
      text: background === 'studio' ? 'Applying clean studio polish...' : 'Finalizing transparent cutout...',
    });
  }

  // 3. Composite onto requested background (studio white or transparent)
  const result = await applyStudioBackground(transparentBlob, background);

  if (onProgress) {
    onProgress({ phase: 'done', percent: 100, text: 'Enhancement complete!' });
  }

  return result;
}
