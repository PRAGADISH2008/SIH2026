/**
 * Bhashini (MeitY Government of India) Speech-to-Text (ASR) Service
 *
 * Integrated via official ULCA / Dhruva AI Pipeline:
 * 1. Discovers serviceId and ASR model from MeitY ULCA.
 * 2. Transcribes spoken regional audio in native Indian languages (Tamil, Hindi, Telugu, etc.)
 *    via https://dhruva-api.bhashini.gov.in.
 */

const fs = require('fs');
const path = require('path');

const BHASHINI_AUTH_URL = 'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline';
const BHASHINI_INFERENCE_URL = 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline';
const DEFAULT_PIPELINE_ID = '64392f96daac500b55c543cd';

// Standard Bhashini language code mapping & serviceId defaults
const LANG_MAP = {
  ta: 'ta',
  tamil: 'ta',
  hi: 'hi',
  hindi: 'hi',
  te: 'te',
  telugu: 'te',
  kn: 'kn',
  kannada: 'kn',
  ml: 'ml',
  malayalam: 'ml',
  bn: 'bn',
  bengali: 'bn',
  mr: 'mr',
  marathi: 'mr',
  gu: 'gu',
  gujarati: 'gu',
  pa: 'pa',
  punjabi: 'pa',
  en: 'en',
  english: 'en',
};

// Fallback serviceIds in case getModelsPipeline takes longer to respond
const DEFAULT_SERVICE_IDS = {
  ta: 'ai4bharat/conformer-multilingual-dravidian-gpu--t4',
  te: 'ai4bharat/conformer-multilingual-dravidian-gpu--t4',
  kn: 'ai4bharat/conformer-multilingual-dravidian-gpu--t4',
  ml: 'ai4bharat/conformer-multilingual-dravidian-gpu--t4',
  hi: 'ai4bharat/conformer-hi-gpu--t4',
  bn: 'ai4bharat/conformer-multilingual-indo-aryan-gpu--t4',
  mr: 'ai4bharat/conformer-multilingual-indo-aryan-gpu--t4',
  en: 'ai4bharat/whisper-medium-en--gpu--t4',
};

/**
 * Transcribe local audio using the Bhashini ASR pipeline.
 *
 * @param {string} audioFilePath - Path to local audio file (webm, wav, mp3)
 * @param {string} [preferredLanguage='ta'] - Language code or name
 * @returns {Promise<{ text: string, languageCode: string, confidence: number, provider: 'bhashini' }>}
 */
async function transcribeWithBhashini(audioFilePath, preferredLanguage = 'ta') {
  const userId = process.env.BHASHINI_USER_ID;
  const apiKey = process.env.BHASHINI_API_KEY;

  if (!userId || !apiKey) {
    throw new Error('BHASHINI_USER_ID or BHASHINI_API_KEY is not configured in .env');
  }

  const lang = LANG_MAP[String(preferredLanguage || '').toLowerCase()] || 'ta';

  if (!fs.existsSync(audioFilePath)) {
    throw new Error(`Audio file not found: ${audioFilePath}`);
  }

  const audioBuffer = fs.readFileSync(audioFilePath);
  const base64Audio = audioBuffer.toString('base64');
  let ext = path.extname(audioFilePath).replace('.', '').toLowerCase() || 'webm';
  if (ext === 'ogg' || ext === 'm4a') ext = 'wav';

  console.log(`🇮🇳 [Bhashini] Discovering ASR pipeline for language: ${lang}...`);

  let serviceId = DEFAULT_SERVICE_IDS[lang] || DEFAULT_SERVICE_IDS.ta;

  // ─── Step 1: Query getModelsPipeline for the active serviceId ─────────────
  try {
    const authRes = await fetch(BHASHINI_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        userID: userId,
        apiKey: apiKey,
      },
      body: JSON.stringify({
        pipelineTasks: [
          {
            taskType: 'asr',
            config: {
              language: {
                sourceLanguage: lang,
              },
            },
          },
        ],
        pipelineRequestConfig: {
          pipelineId: process.env.BHASHINI_PIPELINE_ID || DEFAULT_PIPELINE_ID,
        },
      }),
    });

    if (authRes.ok) {
      const authData = await authRes.json();
      const asrTask = authData?.pipelineResponseConfig?.find(
        (task) => task.taskType === 'asr'
      );
      const discoveredServiceId = asrTask?.config?.[0]?.serviceId;
      if (discoveredServiceId) {
        serviceId = discoveredServiceId;
        console.log(`🇮🇳 [Bhashini] Using active serviceId: ${serviceId}`);
      }
    } else {
      console.warn(`⚠️ [Bhashini] Discovery returned ${authRes.status}, using curated serviceId: ${serviceId}`);
    }
  } catch (discErr) {
    console.warn(`⚠️ [Bhashini] Discovery check skipped: ${discErr.message}. Using default serviceId: ${serviceId}`);
  }

  // ─── Step 2: Send Audio to Bhashini Dhruva Inference Engine ──────────────
  console.log(`🇮🇳 [Bhashini] Sending audio to Dhruva inference endpoint (format: ${ext})...`);

  const inferenceBody = {
    pipelineTasks: [
      {
        taskType: 'asr',
        config: {
          language: {
            sourceLanguage: lang,
          },
          serviceId: serviceId,
          audioFormat: ext,
        },
      },
    ],
    inputData: {
      audio: [
        {
          audioContent: base64Audio,
        },
      ],
    },
  };

  const inferRes = await fetch(BHASHINI_INFERENCE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey,
    },
    body: JSON.stringify(inferenceBody),
  });

  if (!inferRes.ok) {
    const errText = await inferRes.text();
    throw new Error(`Bhashini Dhruva inference failed (${inferRes.status}): ${errText}`);
  }

  const inferData = await inferRes.json();
  const transcriptText =
    inferData?.pipelineResponse?.[0]?.output?.[0]?.source ||
    inferData?.pipelineResponse?.[0]?.output?.[0]?.target ||
    '';

  if (!transcriptText || !transcriptText.trim()) {
    throw new Error('Bhashini returned empty transcript');
  }

  console.log(`✅ [Bhashini] Successfully transcribed (${lang}): "${transcriptText.trim()}"`);

  return {
    text: transcriptText.trim(),
    languageCode: lang,
    confidence: 0.96,
    provider: 'bhashini',
  };
}

module.exports = {
  transcribeWithBhashini,
};
