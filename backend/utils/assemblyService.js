/**
 * AssemblyAI Speech-to-Text Service
 *
 * Exclusively responsible for converting voice recordings to text.
 * API key is read strictly from process.env.ASSEMBLYAI_API_KEY.
 */

const { AssemblyAI } = require('assemblyai');

let _client = null;

function getClient() {
  if (_client) return _client;

  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey || apiKey === 'your_assemblyai_api_key_here') {
    throw new Error(
      'ASSEMBLYAI_API_KEY is not configured. Set a valid key in backend/.env'
    );
  }

  _client = new AssemblyAI({ apiKey });
  return _client;
}

/**
 * Transcribe an audio file from disk or URL.
 * Enables automatic language detection for Indian & international languages.
 *
 * @param {string} audioFilePath - Path to local audio file or audio URL
 * @returns {Promise<{ text: string, languageCode: string, confidence: number }>}
 */
async function transcribeAudio(audioFilePath, preferredLanguage = null) {
  try {
    const client = getClient();

    const params = {
      audio: audioFilePath,
    };

    if (preferredLanguage && preferredLanguage !== 'auto') {
      params.language_code = preferredLanguage;
    } else {
      params.language_detection = true;
    }

    const transcript = await client.transcripts.transcribe(params);

    if (transcript.status === 'error') {
      throw new Error(transcript.error || 'AssemblyAI transcription failed');
    }

    const text = (transcript.text || '').trim();
    const languageCode = transcript.language_code || 'en';
    const confidence = typeof transcript.confidence === 'number'
      ? Math.round(transcript.confidence * 100) / 100
      : 0.90;

    return {
      text,
      languageCode,
      confidence,
    };
  } catch (err) {
    const safeMessage = (err.message || String(err))
      .replace(process.env.ASSEMBLYAI_API_KEY || '', '[REDACTED]');
    console.error(`AssemblyAI transcription error: ${safeMessage}`);
    throw new Error(`Speech transcription failed: ${safeMessage}`);
  }
}

module.exports = {
  transcribeAudio,
};
