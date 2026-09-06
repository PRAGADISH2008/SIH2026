const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

let modelPromise = null;
let processorPromise = null;

async function getModelAndProcessor() {
  const { AutoModel, AutoProcessor, env } = await import('@huggingface/transformers');
  env.allowLocalModels = false;

  if (!modelPromise) {
    modelPromise = AutoModel.from_pretrained('briaai/RMBG-1.4');
  }
  if (!processorPromise) {
    processorPromise = AutoProcessor.from_pretrained('briaai/RMBG-1.4');
  }
  return Promise.all([modelPromise, processorPromise]);
}

/**
 * Removes background from an image file and saves the enhanced image.
 *
 * @param {string} inputPath - Absolute path to input image file
 * @param {'studio'|'transparent'} [mode='studio'] - Output mode
 * @returns {Promise<{ enhancedFilename: string, enhancedUrl: string }>}
 */
async function removeBackgroundFromFile(inputPath, mode = 'studio') {
  const { RawImage } = await import('@huggingface/transformers');
  const [model, processor] = await getModelAndProcessor();

  const img = await RawImage.read(inputPath);
  const { pixel_values } = await processor(img);
  const { output } = await model({ input: pixel_values });

  // Generate alpha mask resized to original image dimensions
  const mask = await RawImage.fromTensor(output[0].mul(255).to('uint8')).resize(img.width, img.height);
  const transparent = img.putAlpha(mask);

  const ext = '.png';
  const enhancedFilename = `enhanced_${uuidv4()}${ext}`;
  const enhancedPath = path.join(__dirname, '..', 'uploads', enhancedFilename);

  if (mode === 'transparent') {
    await transparent.save(enhancedPath);
  } else {
    // Studio mode: composite product onto clean, pure white background
    const studio = new RawImage(new Uint8ClampedArray(img.width * img.height * 4), img.width, img.height, 4);
    const tData = transparent.data;
    const sData = studio.data;

    for (let i = 0; i < tData.length; i += 4) {
      const a = tData[i + 3] / 255;
      // Blend over crisp white (#FFFFFF)
      sData[i] = Math.round(tData[i] * a + 255 * (1 - a));
      sData[i + 1] = Math.round(tData[i + 1] * a + 255 * (1 - a));
      sData[i + 2] = Math.round(tData[i + 2] * a + 255 * (1 - a));
      sData[i + 3] = 255;
    }

    await studio.save(enhancedPath);
  }

  return {
    enhancedFilename,
    enhancedUrl: `/uploads/${enhancedFilename}`,
  };
}

module.exports = {
  removeBackgroundFromFile,
};
