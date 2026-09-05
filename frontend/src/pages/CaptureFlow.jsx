import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, Mic, MicOff, Sparkles, DollarSign, CheckCircle,
  Send, ArrowRight, ArrowLeft, Image as ImageIcon, Upload,
  Play, Square, RotateCcw, FileText, PartyPopper, Copy, X,
  ShoppingBag, LayoutGrid, Volume2, VolumeX
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import {
  createDraftProduct, uploadImage, uploadVoice,
  generateCatalogue, getPrice, confirmProduct,
  publishProduct, getProduct, exportProduct
} from '../services/api';
import { BACKEND_ORIGIN } from '../config';
import { resolveImageUrl, formatPrice } from '../utils/helpers';
import StatusBadge from '../components/StatusBadge';
import LoadingOverlay from '../components/LoadingOverlay';
import './CaptureFlow.css';

const STEPS = [
  { id: 'photo', label: 'Photo', icon: Camera },
  { id: 'voice', label: 'Voice', icon: Mic },
  { id: 'catalogue', label: 'Catalogue', icon: Sparkles },
  { id: 'review', label: 'Review', icon: CheckCircle },
  { id: 'publish', label: 'Publish', icon: Send },
];

const LANGUAGES = [
  { code: 'auto', label: '🌐 Auto-Detect' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml', label: 'മലയാളം (Malayalam)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'en', label: 'English' },
];

// High-performance client-side image compression for mobile devices
async function compressImage(file, maxDimension = 1600, quality = 0.85) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/') || file.type === 'image/svg+xml') {
      return resolve(file);
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return resolve(file);
          }
          const baseName = (file.name || 'craft_photo').replace(/\.[^/.]+$/, '');
          const compressedFile = new File([blob], `${baseName}.jpg`, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

export default function CaptureFlow({ toast }) {
  const navigate = useNavigate();
  const { language: globalLang, setLanguage: setGlobalLang, t, speakText, isSpeaking, stopSpeaking } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [loadingSteps, setLoadingSteps] = useState([]);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);

  // Photo state & refs
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageResult, setImageResult] = useState(null);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Resolved image URLs for preview and comparison
  const resolvedOriginal = resolveImageUrl(imageResult?.original_url || product?.images?.original_url, BACKEND_ORIGIN) || imagePreview;
  const resolvedEnhanced = resolveImageUrl(imageResult?.enhanced_url || product?.images?.enhanced_url, BACKEND_ORIGIN) || imagePreview;

  // Voice state - synced with global language
  const [language, setLanguage] = useState(() => (globalLang && globalLang !== 'en' ? globalLang : 'auto'));

  useEffect(() => {
    if (globalLang && globalLang !== 'en' && globalLang !== language) {
      setLanguage(globalLang);
    }
  }, [globalLang]);

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [voiceResult, setVoiceResult] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);

  // Catalogue state
  const [catalogueResult, setCatalogueResult] = useState(null);
  const [priceResult, setPriceResult] = useState(null);

  // Review state — editable fields
  const [editFields, setEditFields] = useState({});

  // Publish state
  const [publishDone, setPublishDone] = useState(false);
  const [exportJson, setExportJson] = useState(null);
  const [showExport, setShowExport] = useState(false);

  // ─── Step 0: Auto-optimize & Upload on Mobile Capture ───────────────────
  async function processAndUploadImage(rawFile) {
    if (!rawFile) return;

    // Show preview immediately from captured raw file for instant mobile visual feedback
    const tempUrl = URL.createObjectURL(rawFile);
    setImagePreview(tempUrl);
    setLoading(true);
    setLoadingMsg('Preparing your craft photo...');
    setLoadingSteps([
      'Optimizing photo for fast mobile upload',
      'Creating product draft',
      'Uploading to ZenCraft Studio',
      'Enhancing image with AI',
    ]);
    setLoadingStepIdx(0);

    try {
      // 1. Client-side compress for mobile speed and reliability
      const compressed = await compressImage(rawFile, 1600, 0.85);
      setImageFile(compressed);

      // Update preview to compressed URL
      const compressedUrl = URL.createObjectURL(compressed);
      setImagePreview(compressedUrl);

      // 2. Create draft if we don't have a product yet
      setLoadingStepIdx(1);
      let prod = product;
      if (!prod) {
        prod = await createDraftProduct(language);
        setProduct(prod);
      }

      // 3. Upload image
      setLoadingStepIdx(2);
      const res = await uploadImage(prod.product_id, compressed);
      setImageResult(res.images);

      // 4. Enhance with AI
      setLoadingStepIdx(3);
      await new Promise((r) => setTimeout(r, 600));

      setCurrentStep(1);
      toast.success('Photo captured & enhanced with AI!');
    } catch (err) {
      console.error('Photo capture upload failed:', err);
      toast.error(err.serverMessage || err.message || 'Failed to upload photo. Please tap retry.');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    // Clear input value so taking photo again or retrying triggers onChange every time on mobile
    e.target.value = '';
    if (!file) return;

    // Immediately upload when user confirms photo (gives tick mark in camera)
    await processAndUploadImage(file);
  }

  async function handleUploadImage() {
    if (!imageFile) return;
    await processAndUploadImage(imageFile);
  }

  // ─── Step 1: Voice recording ───────────────────────────────────────────
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(t => t.stop());
        cancelAnimationFrame(animFrameRef.current);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Audio visualizer
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      drawWaveform();
    } catch (err) {
      toast.error('Microphone access denied');
    }
  }

  function drawWaveform() {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        gradient.addColorStop(0, '#f59e0b');
        gradient.addColorStop(1, '#ea580c');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
    }
    draw();
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  function resetRecording() {
    setAudioBlob(null);
    setAudioUrl(null);
    setVoiceResult(null);
  }

  async function handleUploadVoice() {
    if (!audioBlob || !product) return;
    setLoading(true);
    setLoadingMsg('Transcribing your voice note...');
    setLoadingSteps(['Processing audio', 'Extracting craft details', 'Identifying materials & technique']);
    setLoadingStepIdx(0);
    try {
      const audioFile = new File([audioBlob], 'voice.webm', { type: 'audio/webm' });
      setLoadingStepIdx(1);
      const res = await uploadVoice(product.product_id, audioFile, language);
      // Response: { description, language_original, material, craft_type,
      //             production: { time_days, technique }, transcription_confidence }
      setVoiceResult(res);
      setLoadingStepIdx(2);
      await new Promise(r => setTimeout(r, 500));
      setCurrentStep(2);
      toast.success(`Voice transcribed! Confidence: ${Math.round(res.transcription_confidence * 100)}%`);
    } catch (err) {
      toast.error(err.serverMessage || err.message);
    } finally {
      setLoading(false);
    }
  }

  // ─── Step 2: Catalogue + price generation ──────────────────────────────

  async function handleGenerateCatalogue() {
    if (!product) return;
    setLoading(true);
    setLoadingMsg('Generating AI catalogue...');
    setLoadingSteps(['Analyzing craft...', 'Generating catalogue...', 'Preparing marketplace content...', 'Calculating pricing...']);
    setLoadingStepIdx(0);
    try {
      // CATALOGUE: POST /products/:id/catalogue — NO body sent
      // Backend uses stored product data. Response:
      // { product_name, category, keywords[], description }
      setLoadingStepIdx(0);
      await new Promise(r => setTimeout(r, 600));
      setLoadingStepIdx(1);
      const catRes = await generateCatalogue(product.product_id);
      setCatalogueResult(catRes);

      setLoadingStepIdx(2);
      await new Promise(r => setTimeout(r, 400));

      // PRICE: GET /products/:id/price
      // Response: { pricing: { estimated_cost, market_range_low, market_range_high,
      //             recommended_price, confidence, reasoning[] } }
      setLoadingStepIdx(3);
      const priceRes = await getPrice(product.product_id, {
        ...catRes,
        ...voiceResult,
        product_name: catRes?.product_name || product?.product_name,
        category: catRes?.category || product?.category,
        craft_type: voiceResult?.craft_type || product?.craft_type,
        material: voiceResult?.material || product?.material,
        production_time_days: voiceResult?.production?.time_days,
        production_technique: voiceResult?.production?.technique,
      });
      setPriceResult(priceRes.pricing);

      // Prefill editable review fields
      setEditFields({
        product_name: catRes.product_name || '',
        category: catRes.category || '',
        description: catRes.description || '',
        material: voiceResult?.material || '',
        craft_type: voiceResult?.craft_type || '',
        production_time_days: voiceResult?.production?.time_days ?? '',
        production_technique: voiceResult?.production?.technique || '',
        recommended_price: priceRes.pricing?.recommended_price ?? '',
        keywords: (catRes.keywords || []).join(', '),
      });

      setCurrentStep(3);
      toast.success('Catalogue & pricing generated!');
    } catch (err) {
      toast.error(err.serverMessage || err.message);
    } finally {
      setLoading(false);
    }
  }

  // ─── Step 3: Review & Confirm ──────────────────────────────────────────

  function handleFieldChange(field, value) {
    setEditFields((prev) => ({ ...prev, [field]: value }));
  }

  async function handleConfirm() {
    if (!product) return;
    setLoading(true);
    setLoadingMsg('Confirming your product...');
    setLoadingSteps([]);
    try {
      // Build corrections object matching backend's expected structure
      const corrections = {
        product_name: editFields.product_name,
        category: editFields.category,
        description: editFields.description,
        material: editFields.material,
        craft_type: editFields.craft_type,
        keywords: editFields.keywords
          ? editFields.keywords.split(',').map((k) => k.trim()).filter(Boolean)
          : [],
        production: {
          time_days: editFields.production_time_days ? Number(editFields.production_time_days) : undefined,
          technique: editFields.production_technique || undefined,
        },
        pricing: {
          recommended_price: editFields.recommended_price ? Number(editFields.recommended_price) : undefined,
          estimated_cost: dynamicPricing?.currentEstCost,
          confidence: dynamicPricing ? dynamicPricing.dynamicConfidence / 100 : undefined,
        },
      };

      // PUT /products/:id/confirm — response is full product with status: "confirmed"
      const confirmed = await confirmProduct(product.product_id, corrections);
      setProduct(confirmed);
      setCurrentStep(4);
      toast.success('Product confirmed! Ready to publish.');
    } catch (err) {
      toast.error(err.serverMessage || err.message);
    } finally {
      setLoading(false);
    }
  }

  // ─── Step 4: Publish ───────────────────────────────────────────────────

  async function handlePublish() {
    if (!product) return;
    if (product.status !== 'confirmed') {
      toast.error('Product must be confirmed before publishing.');
      return;
    }
    setLoading(true);
    setLoadingMsg('Publishing to marketplace...');
    setLoadingSteps([]);
    try {
      // PUT /products/:id/publish — response: { status: "published" }
      const res = await publishProduct(product.product_id);
      setProduct((prev) => ({ ...prev, status: res.status }));
      setPublishDone(true);
      toast.success('🎉 Product published successfully to the marketplace!');

      // Smoothly navigate directly to marketplace after publishing
      setTimeout(() => {
        navigate('/marketplace', {
          state: {
            justPublished: true,
            productId: product.product_id,
            productName: editFields.product_name || product?.product_name || 'Your Craft'
          }
        });
      }, 1000);
    } catch (err) {
      toast.error(err.serverMessage || err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleExport() {
    if (!product) return;
    try {
      const data = await exportProduct(product.product_id);
      setExportJson(data);
      setShowExport(true);
    } catch (err) {
      toast.error(err.serverMessage || err.message);
    }
  }

  function copyExportJson() {
    navigator.clipboard.writeText(JSON.stringify(exportJson, null, 2));
    toast.success('Copied to clipboard!');
  }

  // Dynamic pricing & confidence recalculation based on user price and production days
  const dynamicPricing = (() => {
    if (!priceResult) return null;

    const baseCost = Number(priceResult.estimated_cost) || 1000;
    const baseDays = Math.max(1, Number(product?.production_time_days || voiceResult?.production?.time_days || 3));
    const userDays = Number(editFields.production_time_days) > 0 ? Number(editFields.production_time_days) : baseDays;

    // Daily artisan labor rate (~₹250/day)
    const laborRatePerDay = 250;
    const daysDiff = userDays - baseDays;
    const currentEstCost = Math.max(150, Math.round(baseCost + (daysDiff * laborRatePerDay)));

    const low = Number(priceResult.market_range_low) || Math.round(currentEstCost * 1.5);
    const high = Number(priceResult.market_range_high) || Math.round(currentEstCost * 3.5);
    const rec = Number(priceResult.recommended_price) || Math.round(currentEstCost * 2.2);

    const userPrice = Number(editFields.recommended_price) > 0 ? Number(editFields.recommended_price) : rec;

    // Calculate dynamic confidence score reflecting market sell-through rate and feasibility
    let dynamicConfidence = 88;
    let feedback = 'Optimal market pricing';
    let statusLevel = 'success'; // 'success' | 'warning' | 'danger'

    if (userPrice < currentEstCost) {
      // Selling below cost: high loss risk
      const ratio = userPrice / currentEstCost;
      dynamicConfidence = Math.max(35, Math.min(55, Math.round(ratio * 50)));
      feedback = `⚠️ Below estimated cost (₹${currentEstCost.toLocaleString('en-IN')}) — Risk of financial loss!`;
      statusLevel = 'danger';
    } else if (userPrice < low) {
      // Below market low
      const ratio = (userPrice - currentEstCost) / (low - currentEstCost || 1);
      dynamicConfidence = Math.max(60, Math.min(78, Math.round(60 + ratio * 18)));
      feedback = '⚠️ Below market entry range — High buyer interest, but artisan profit is compromised.';
      statusLevel = 'warning';
    } else if (userPrice >= low && userPrice <= high) {
      // Within healthy market range
      const distFromRec = Math.abs(userPrice - rec) / (high - low || 1);
      dynamicConfidence = Math.max(82, Math.min(96, Math.round(95 - (distFromRec * 13))));
      if (Math.abs(userPrice - rec) <= (rec * 0.08)) {
        feedback = '🎯 Optimal Sweet Spot — Highest probability of rapid sales & strong profit margin.';
      } else if (userPrice > rec) {
        feedback = '📈 Premium Boutique Range — Maximizes revenue per piece with steady buyer conversion.';
      } else {
        feedback = '⚡ Competitive Value Range — Accelerates initial sales and marketplace ranking.';
      }
      statusLevel = 'success';
    } else {
      // Above market high
      const overRatio = (userPrice - high) / (high || 1);
      dynamicConfidence = Math.max(38, Math.min(74, Math.round(75 - (overRatio * 50))));
      feedback = '⚠️ Above premium market range — Increased buyer hesitation and price sensitivity.';
      statusLevel = 'warning';
    }

    const profit = userPrice - currentEstCost;
    const profitMargin = userPrice > 0 ? Math.round((profit / userPrice) * 100) : 0;

    return {
      currentEstCost,
      userPrice,
      dynamicConfidence,
      feedback,
      statusLevel,
      profit,
      profitMargin,
      userDays,
    };
  })();

  return (
    <div className="page">
      {loading && (
        <LoadingOverlay
          message={loadingMsg}
          steps={loadingSteps}
          currentStep={loadingStepIdx}
        />
      )}

      {/* Step indicator */}
      <div className="flow-steps">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className={`flow-step ${i === currentStep ? 'active' : i < currentStep ? 'done' : ''}`}
          >
            <div className="flow-step-icon">
              <s.icon size={14} />
            </div>
            <span className="flow-step-label">{t(`step.${s.id}`, s.label)}</span>
          </div>
        ))}
      </div>

      {/* ═══ STEP 0: Photo Capture ═══ */}
      {currentStep === 0 && (
        <div className="flow-section capture-layout-2col animate-fade-in">
          {/* Left Column: Capture Card Workspace */}
          <div className="capture-main-col">
            <div className="card capture-card">
              <div className="flow-title-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <h2 className="flow-title" style={{ margin: 0 }}>
                  <Camera size={20} />
                  {t('capture.title', 'Capture Your Craft')}
                </h2>
                <button
                  type="button"
                  className={`tts-audio-btn ${isSpeaking ? 'speaking' : ''}`}
                  onClick={() => {
                    if (isSpeaking) {
                      stopSpeaking();
                    } else {
                      const textToRead = `${t('capture.title')}. ${t('capture.subtitle')}. ${t('capture.tip1Title')}: ${t('capture.tip1Desc')}`;
                      speakText(textToRead, language === 'auto' ? globalLang : language);
                    }
                  }}
                  title={isSpeaking ? t('tts.stop', 'Stop reading') : t('tts.listen', 'Read instructions aloud')}
                >
                  {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  <span>{isSpeaking ? t('tts.stop', 'Stop') : t('tts.listen', 'Listen')}</span>
                </button>
              </div>
              <p className="flow-desc">{t('capture.subtitle', 'Take a photo using your camera or choose from your gallery')}</p>

              <div className="photo-area">
                {imagePreview ? (
                  <div className="photo-preview">
                    <img src={imagePreview} alt="Craft preview" />
                    <button
                      type="button"
                      className="photo-remove"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      title="Remove / Retake"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div
                    className="photo-placeholder"
                    onClick={() => cameraInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="photo-placeholder-icon">
                      <Camera size={42} strokeWidth={1.5} />
                    </div>
                    <span className="photo-placeholder-title">{t('capture.openCamera', 'Tap to Open Camera')}</span>
                    <span className="photo-placeholder-sub">{t('capture.cameraHint', 'Takes an instant photo of your product & auto-enhances')}</span>
                  </div>
                )}

                {/* Hidden file inputs: dedicated camera & dedicated gallery */}
                <input
                  ref={cameraInputRef}
                  id="camera-input"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <input
                  ref={galleryInputRef}
                  id="gallery-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />

                {/* Mobile-friendly dual capture action buttons */}
                <div className="photo-capture-options">
                  <button
                    type="button"
                    className="btn btn-primary photo-opt-btn photo-opt-camera"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={loading}
                  >
                    <Camera size={19} />
                    <span>{imagePreview ? t('capture.retakePhoto', 'Retake with Camera') : t('capture.takePhoto', 'Take Photo (Camera)')}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary photo-opt-btn"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={loading}
                  >
                    <ImageIcon size={18} />
                    <span>{t('capture.gallery', 'Choose from Gallery')}</span>
                  </button>
                </div>
              </div>

              {/* Language selector */}
              <div style={{ marginTop: 'var(--space-md)' }}>
                <label className="input-label">{t('capture.nativeLang', 'Your native language (for voice & details)')}</label>
                <div className="lang-chips">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      className={`chip ${language === l.code ? 'active' : ''}`}
                      onClick={() => {
                        setLanguage(l.code);
                        if (l.code !== 'auto') {
                          setGlobalLang(l.code);
                        }
                      }}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {imageFile && (
                <button
                  type="button"
                  className="btn btn-primary btn-block btn-lg"
                  disabled={loading}
                  onClick={handleUploadImage}
                  style={{ marginTop: 'var(--space-lg)' }}
                >
                  <Upload size={18} /> {loading ? t('capture.uploading', 'Uploading & Enhancing...') : t('capture.enhanceBtn', 'Upload & Enhance Now')}
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Companion Studio Guide Panel */}
          <div className="capture-sidebar-col">
            {/* Photography Guide Card */}
            <div className="card capture-guide-card">
              <div className="cgc-header">
                <div className="cgc-icon-badge">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="cgc-title">{t('capture.tipsTitle', 'Artisan Photography Tips')}</h3>
                  <p className="cgc-subtitle">{t('capture.tipsSubtitle', 'Techniques for high-converting marketplace listings')}</p>
                </div>
              </div>

              <div className="cgc-tips-list">
                <div className="cgc-tip-item">
                  <span className="cgc-tip-num">1</span>
                  <div className="cgc-tip-body">
                    <strong>{t('capture.tip1Title', 'Natural Soft Lighting')}</strong>
                    <p>{t('capture.tip1Desc', 'Shoot near an open window or daylight shade. Avoid harsh camera flash and hard shadows.')}</p>
                  </div>
                </div>

                <div className="cgc-tip-item">
                  <span className="cgc-tip-num">2</span>
                  <div className="cgc-tip-body">
                    <strong>{t('capture.tip2Title', 'Clean Neutral Background')}</strong>
                    <p>{t('capture.tip2Desc', 'Place your craft on plain wood, fabric, or a neutral table for clean AI studio polish.')}</p>
                  </div>
                </div>

                <div className="cgc-tip-item">
                  <span className="cgc-tip-num">3</span>
                  <div className="cgc-tip-body">
                    <strong>{t('capture.tip3Title', 'Highlight Handmade Texture')}</strong>
                    <p>{t('capture.tip3Desc', 'Capture authentic carving grooves, handloom weaves, and clay glaze signatures.')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Workflow Preview Card */}
            <div className="card capture-workflow-card">
              <div className="cwc-header">
                <h3 className="cwc-title">{t('capture.nextTitle', 'What Happens Next?')}</h3>
                <span className="cwc-badge">{t('capture.nextBadge', '3 Easy Steps')}</span>
              </div>

              <div className="cwc-steps">
                <div className="cwc-step">
                  <div className="cwc-step-num">1</div>
                  <div className="cwc-step-info">
                    <h4>{t('capture.nextStep1Title', 'Instant AI Studio Polish')}</h4>
                    <p>{t('capture.nextStep1Desc', 'AI balances shadows, removes background clutter, and sharpens craft textures.')}</p>
                  </div>
                </div>

                <div className="cwc-step">
                  <div className="cwc-step-num">2</div>
                  <div className="cwc-step-info">
                    <h4>{t('capture.nextStep2Title', 'Voice Storytelling')}</h4>
                    <p>{t('capture.nextStep2Desc', 'Speak in your regional language; AI generates professional e-commerce product titles & descriptions.')}</p>
                  </div>
                </div>

                <div className="cwc-step">
                  <div className="cwc-step-num">3</div>
                  <div className="cwc-step-info">
                    <h4>{t('capture.nextStep3Title', 'Fair Price & Publish')}</h4>
                    <p>{t('capture.nextStep3Desc', 'Get AI-recommended fair pricing based on material cost, labor days, and live marketplace demand.')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ STEP 1: Voice Recording ═══ */}
      {currentStep === 1 && (
        <div className="flow-section voice-step-container animate-fade-in">
          <div className="flow-title-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <h2 className="flow-title" style={{ margin: 0 }}>
              <Mic size={20} />
              {t('voice.title', 'Describe Your Craft')}
            </h2>
            <button
              type="button"
              className={`tts-audio-btn ${isSpeaking ? 'speaking' : ''}`}
              onClick={() => {
                if (isSpeaking) {
                  stopSpeaking();
                } else {
                  speakText(`${t('voice.title')}. ${t('voice.desc')}`, language === 'auto' ? globalLang : language);
                }
              }}
              title={isSpeaking ? t('tts.stop', 'Stop reading') : t('tts.listen', 'Read instructions aloud')}
            >
              {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
              <span>{isSpeaking ? t('tts.stop', 'Stop') : t('tts.listen', 'Listen')}</span>
            </button>
          </div>
          <p className="flow-desc">
            {t('voice.desc', 'Record a voice note in your native language — describe materials, technique, and story.')}
          </p>

          {/* Spoken Language Selector */}
          <div className="card voice-lang-card" style={{ marginBottom: 'var(--space-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="input-label" style={{ margin: 0, fontWeight: 600 }}>
                {t('capture.nativeLang', 'Spoken Language')}
              </label>
              <span className="badge badge-accent" style={{ fontSize: '0.72rem' }}>
                AssemblyAI + Gemini Multilingual
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--clr-text-secondary)', margin: '0 0 10px' }}>
              Select the language you will speak in. AssemblyAI transcribes your dialect accurately and Gemini translates & normalizes it into professional e-commerce product attributes.
            </p>
            <div className="lang-chips">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  className={`chip ${language === l.code ? 'active' : ''}`}
                  onClick={() => {
                    setLanguage(l.code);
                    if (l.code !== 'auto') {
                      setGlobalLang(l.code);
                    }
                  }}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Image comparison */}
          {imageResult && (
            <div className="image-compare card">
              <div className="ic-row">
                <div className="ic-item">
                  <span className="ic-label">Original</span>
                  {resolvedOriginal ? (
                    <img src={resolvedOriginal} alt="Original" className="ic-img" />
                  ) : (
                    <div className="ic-placeholder skeleton" />
                  )}
                </div>
                <div className="ic-item">
                  <span className="ic-label">Enhanced</span>
                  {resolvedEnhanced ? (
                    <img src={resolvedEnhanced} alt="Enhanced" className="ic-img" />
                  ) : (
                    <div className="ic-placeholder skeleton" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Audio recorder */}
          <div className="recorder card">
            <canvas ref={canvasRef} width={300} height={60} className="waveform-canvas" />

            <div className="recorder-controls">
              {!audioBlob ? (
                <button
                  className={`recorder-btn ${isRecording ? 'recording' : ''}`}
                  onClick={isRecording ? stopRecording : startRecording}
                >
                  {isRecording ? <Square size={20} /> : <Mic size={20} />}
                </button>
              ) : (
                <div className="recorder-playback">
                  <audio src={audioUrl} controls className="audio-player" />
                  <button className="btn btn-ghost btn-sm" onClick={resetRecording}>
                    <RotateCcw size={14} /> Re-record
                  </button>
                </div>
              )}
              <p className="recorder-hint">
                {isRecording ? t('voice.recording', 'Recording... tap to stop') : audioBlob ? 'Review your recording' : t('voice.tapToRecord', 'Tap to start recording')}
              </p>
            </div>
          </div>

          {/* Voice result preview */}
          {voiceResult && (
            <div className="voice-result card animate-fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ margin: 0 }}>Extracted Details</h4>
                <button
                  type="button"
                  className={`tts-audio-btn ${isSpeaking ? 'speaking' : ''}`}
                  onClick={() => {
                    if (isSpeaking) {
                      stopSpeaking();
                    } else if (voiceResult.description) {
                      speakText(voiceResult.description, language === 'auto' ? globalLang : language);
                    }
                  }}
                  title={isSpeaking ? t('tts.stop', 'Stop') : t('tts.listen', 'Listen to craft description')}
                >
                  {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  <span>{isSpeaking ? t('tts.stop', 'Stop') : t('tts.listen', 'Listen Story')}</span>
                </button>
              </div>
              <div className="vr-tags">
                <span className="badge badge-accent">{voiceResult.craft_type}</span>
                <span className="badge badge-accent">{voiceResult.material}</span>
                <span className="badge badge-accent">{voiceResult.production?.technique}</span>
                <span className="badge badge-accent">{voiceResult.production?.time_days} days</span>
              </div>
              <p className="vr-desc">{voiceResult.description}</p>
              <p className="vr-confidence">
                Confidence: {Math.round(voiceResult.transcription_confidence * 100)}%
              </p>
            </div>
          )}

          <div className="flow-actions">
            <button className="btn btn-ghost" onClick={() => setCurrentStep(0)}>
              <ArrowLeft size={16} /> {t('common.back', 'Back')}
            </button>
            <button
              className="btn btn-primary"
              disabled={!audioBlob}
              onClick={handleUploadVoice}
            >
              {t('voice.processBtn', 'Process Voice')} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ═══ STEP 2: Catalogue Generation ═══ */}
      {currentStep === 2 && (
        <div className="flow-section catalogue-step-container animate-fade-in">
          <h2 className="flow-title">
            <Sparkles size={20} />
            AI Catalogue Generation
          </h2>
          <p className="flow-desc">
            Generate SEO-optimized title, category, keywords, description, and pricing
          </p>

          <div className="gen-summary card">
            <h4>Data collected so far</h4>
            <div className="gen-items stagger">
              <div className="gen-item animate-fade-in">
                <Camera size={14} /> Photo uploaded & enhanced
              </div>
              {voiceResult && (
                <>
                  <div className="gen-item animate-fade-in">
                    <Mic size={14} /> {voiceResult.craft_type} — {voiceResult.material}
                  </div>
                  <div className="gen-item animate-fade-in">
                    <FileText size={14} /> {voiceResult.description?.slice(0, 80)}...
                  </div>
                </>
              )}
            </div>
          </div>

          <button
            className="btn btn-primary btn-block btn-lg"
            onClick={handleGenerateCatalogue}
          >
            <Sparkles size={18} /> {t('catalogue.generateBtn', 'Generate Catalogue & Pricing')}
          </button>

          <button className="btn btn-ghost" onClick={() => setCurrentStep(1)} style={{ marginTop: 8, width: '100%' }}>
            <ArrowLeft size={16} /> {t('common.backToVoice', 'Back to voice')}
          </button>
        </div>
      )}

      {/* ═══ STEP 3: Review & Confirm ═══ */}
      {currentStep === 3 && (
        <div className="flow-section animate-fade-in">
          <div className="flow-title-row">
            <h2 className="flow-title">
              <CheckCircle size={20} />
              {t('review.title', 'Review & Confirm')}
            </h2>
            <StatusBadge status={product?.status} />
          </div>
          <p className="flow-desc">{t('review.subtitle', 'Review AI-generated fields and make corrections before confirming')}</p>

          <div className="review-grid-layout">
            {/* Left Column: Craft Details Form */}
            <div className="review-col-details card">
              <h3 className="review-col-heading">{t('review.craftInfo', 'Craft Information')}</h3>

              <div className="rf-group">
                <label className="input-label">{t('review.productName', 'Product Name')}</label>
                <input
                  className="input-field"
                  value={editFields.product_name || ''}
                  onChange={(e) => handleFieldChange('product_name', e.target.value)}
                />
              </div>

              <div className="rf-row">
                <div className="rf-group" style={{ flex: 1 }}>
                  <label className="input-label">{t('market.category', 'Category')}</label>
                  <input
                    className="input-field"
                    value={editFields.category || ''}
                    onChange={(e) => handleFieldChange('category', e.target.value)}
                  />
                </div>
                <div className="rf-group" style={{ flex: 1 }}>
                  <label className="input-label">{t('market.craftType', 'Craft Type')}</label>
                  <input
                    className="input-field"
                    value={editFields.craft_type || ''}
                    onChange={(e) => handleFieldChange('craft_type', e.target.value)}
                  />
                </div>
              </div>

              <div className="rf-group">
                <label className="input-label">{t('review.material', 'Material')}</label>
                <input
                  className="input-field"
                  value={editFields.material || ''}
                  onChange={(e) => handleFieldChange('material', e.target.value)}
                />
              </div>

              <div className="rf-row">
                <div className="rf-group" style={{ flex: 1 }}>
                  <label className="input-label">{t('review.productionTime', 'Production Time (days)')}</label>
                  <input
                    type="number"
                    className="input-field"
                    value={editFields.production_time_days || ''}
                    onChange={(e) => handleFieldChange('production_time_days', e.target.value)}
                  />
                </div>
                <div className="rf-group" style={{ flex: 1 }}>
                  <label className="input-label">{t('review.technique', 'Technique')}</label>
                  <input
                    className="input-field"
                    value={editFields.production_technique || ''}
                    onChange={(e) => handleFieldChange('production_technique', e.target.value)}
                  />
                </div>
              </div>

              <div className="rf-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="input-label" style={{ margin: 0 }}>{t('market.productDesc', 'Description')}</label>
                  {(editFields.description || product?.description) && (
                    <button
                      type="button"
                      className={`tts-audio-btn ${isSpeaking ? 'speaking' : ''}`}
                      onClick={() => {
                        if (isSpeaking) {
                          stopSpeaking();
                        } else {
                          speakText(editFields.description || product?.description, language === 'auto' ? globalLang : language);
                        }
                      }}
                      title={isSpeaking ? t('tts.stop', 'Stop') : t('tts.listen', 'Listen to description')}
                    >
                      {isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                      <span>{isSpeaking ? t('tts.stop', 'Stop') : t('tts.listen', 'Listen')}</span>
                    </button>
                  )}
                </div>
                <textarea
                  className="input-field"
                  rows={4}
                  value={editFields.description || ''}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                />
              </div>

              <div className="rf-group">
                <label className="input-label">{t('review.keywords', 'Keywords (comma-separated)')}</label>
                <input
                  className="input-field"
                  value={editFields.keywords || ''}
                  onChange={(e) => handleFieldChange('keywords', e.target.value)}
                  placeholder="madhubani, folk art, handmade"
                />
              </div>
            </div>

            {/* Right Column: AI Pricing Intelligence */}
            <div className="review-col-pricing">
              {priceResult && dynamicPricing ? (
                <div className="pricing-card card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0 }}><DollarSign size={16} /> {t('review.aiPricing', 'AI Pricing Intelligence')}</h4>
                    <span
                      className={`badge badge-${dynamicPricing.statusLevel === 'success' ? 'published' : dynamicPricing.statusLevel === 'warning' ? 'confirmed' : 'draft'}`}
                      style={{ fontSize: '0.75rem', padding: '3px 10px' }}
                    >
                      Est. Margin: {dynamicPricing.profitMargin}% (₹{dynamicPricing.profit.toLocaleString('en-IN')})
                    </span>
                  </div>

                  <div className="pc-grid">
                    <div className="pc-stat" title={`Dynamically calculated for ${dynamicPricing.userDays} days of artisan production`}>
                      <span className="pc-label">Est. Cost {dynamicPricing.userDays ? `(${dynamicPricing.userDays}d)` : ''}</span>
                      <span className="pc-value">{formatPrice(dynamicPricing.currentEstCost)}</span>
                    </div>
                    <div className="pc-stat">
                      <span className="pc-label">{t('review.marketLow', 'Market Low')}</span>
                      <span className="pc-value">{formatPrice(priceResult.market_range_low)}</span>
                    </div>
                    <div className="pc-stat">
                      <span className="pc-label">{t('review.marketHigh', 'Market High')}</span>
                      <span className="pc-value">{formatPrice(priceResult.market_range_high)}</span>
                    </div>
                    <div className="pc-stat pc-stat-primary">
                      <span className="pc-label">{t('review.aiRecommended', 'AI Recommended')}</span>
                      <span className="pc-value">{formatPrice(priceResult.recommended_price)}</span>
                    </div>
                  </div>

                  <div className="rf-group" style={{ marginTop: 'var(--space-md)' }}>
                    <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{t('review.yourPrice', 'Your Price (₹)')}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)', fontWeight: 400 }}>
                        Recalculates confidence in real-time
                      </span>
                    </label>
                    <input
                      type="number"
                      className="input-field"
                      value={editFields.recommended_price || ''}
                      onChange={(e) => handleFieldChange('recommended_price', e.target.value)}
                    />
                  </div>

                  {/* Real-time Dynamic Sell-Through Confidence Meter */}
                  <div
                    className="animate-fade-in"
                    style={{
                      background: dynamicPricing.statusLevel === 'success'
                        ? 'rgba(34, 197, 94, 0.08)'
                        : dynamicPricing.statusLevel === 'warning'
                        ? 'rgba(245, 158, 11, 0.1)'
                        : 'rgba(239, 68, 68, 0.12)',
                      border: `1px solid ${
                        dynamicPricing.statusLevel === 'success'
                          ? 'rgba(34, 197, 94, 0.3)'
                          : dynamicPricing.statusLevel === 'warning'
                          ? 'rgba(245, 158, 11, 0.35)'
                          : 'rgba(239, 68, 68, 0.4)'
                      }`,
                      borderRadius: '10px',
                      padding: '10px 14px',
                      marginTop: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--clr-text-primary)' }}>
                        {t('review.confidenceMeter', 'Market Sell-Through Confidence')}
                      </span>
                      <span
                        style={{
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          color: dynamicPricing.statusLevel === 'success'
                            ? 'var(--clr-success, #22c55e)'
                            : dynamicPricing.statusLevel === 'warning'
                            ? '#f59e0b'
                            : '#ef4444',
                        }}
                      >
                        {dynamicPricing.dynamicConfidence}%
                      </span>
                    </div>

                    {/* Meter bar */}
                    <div style={{ width: '100%', height: '6px', background: 'var(--clr-border, #E4DED3)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${dynamicPricing.dynamicConfidence}%`,
                          height: '100%',
                          background: dynamicPricing.statusLevel === 'success'
                            ? 'var(--clr-success, #22c55e)'
                            : dynamicPricing.statusLevel === 'warning'
                            ? '#f59e0b'
                            : '#ef4444',
                          transition: 'width 0.3s ease, background 0.3s ease',
                        }}
                      />
                    </div>

                    <p style={{ margin: '8px 0 0', fontSize: '0.78rem', color: 'var(--clr-text-secondary)', lineHeight: 1.4 }}>
                      {dynamicPricing.feedback}
                    </p>
                  </div>

                  <div className="pc-reasoning">
                    {priceResult.reasoning?.map((r, i) => (
                      <p key={i} className="pc-reason">• {r}</p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="pricing-card card" style={{ textAlign: 'center', padding: 'var(--space-xl) var(--space-md)' }}>
                  <DollarSign size={28} style={{ color: 'var(--clr-accent)', margin: '0 auto var(--space-sm)' }} />
                  <h4 style={{ justifyContent: 'center' }}>{t('review.aiPricing', 'AI Pricing Intelligence')}</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--clr-text-secondary)' }}>
                    Pricing recommendations will be generated based on materials and labor time.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flow-actions">
            <button className="btn btn-ghost" onClick={() => setCurrentStep(2)}>
              <ArrowLeft size={16} /> {t('common.back', 'Back')}
            </button>
            <button className="btn btn-primary" onClick={handleConfirm}>
              <CheckCircle size={16} /> {t('review.confirmBtn', 'Confirm Product')}
            </button>
          </div>
        </div>
      )}

      {/* ═══ STEP 4: Publish ═══ */}
      {currentStep === 4 && (
        <div className="flow-section animate-fade-in">
          <div className="flow-title-row">
            <h2 className="flow-title">
              <Send size={20} />
              Publish Product
            </h2>
            <StatusBadge status={product?.status} />
          </div>

          {!publishDone ? (
            <>
              <div className="publish-preview card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>{editFields.product_name || product?.product_name}</h3>
                    <p className="publish-cat">{editFields.category || product?.category}</p>
                  </div>
                  <button
                    type="button"
                    className={`tts-audio-btn ${isSpeaking ? 'speaking' : ''}`}
                    onClick={() => {
                      if (isSpeaking) {
                        stopSpeaking();
                      } else {
                        const name = editFields.product_name || product?.product_name || '';
                        const desc = editFields.description || product?.description || '';
                        speakText(`${name}. ${desc}`, language === 'auto' ? globalLang : language);
                      }
                    }}
                    title={isSpeaking ? t('tts.stop', 'Stop') : t('tts.listen', 'Listen to product summary')}
                  >
                    {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    <span>{isSpeaking ? t('tts.stop', 'Stop') : t('tts.listen', 'Listen')}</span>
                  </button>
                </div>
                <p className="publish-price">{formatPrice(editFields.recommended_price || product?.pricing?.recommended_price)}</p>
                <p className="publish-desc">{(editFields.description || product?.description || '').slice(0, 150)}...</p>
              </div>

              {product?.status !== 'confirmed' && (
                <div className="publish-warning">
                  ⚠️ Product must be confirmed before it can be published.
                  Status is currently: <strong>{product?.status}</strong>
                </div>
              )}

              <button
                className="btn btn-success btn-block btn-lg"
                disabled={product?.status !== 'confirmed'}
                onClick={handlePublish}
              >
                <Send size={18} /> Publish to Marketplace
              </button>
            </>
          ) : (
            <div className="publish-done animate-scale-in">
              <div className="publish-done-icon">
                <PartyPopper size={40} />
              </div>
              <h3>🎉 Published Successfully!</h3>
              <p>Your craft is now live on the marketplace. Moving to Marketplace...</p>
              <div className="publish-done-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/marketplace', {
                    state: {
                      justPublished: true,
                      productId: product?.product_id,
                      productName: editFields.product_name || product?.product_name
                    }
                  })}
                >
                  <ShoppingBag size={16} /> View Marketplace
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => navigate('/dashboard')}
                >
                  <LayoutGrid size={16} /> Artisan Studio
                </button>
                <button className="btn btn-ghost" onClick={handleExport}>
                  <FileText size={16} /> Export JSON
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Export modal */}
      {showExport && exportJson && (
        <div className="export-overlay" onClick={() => setShowExport(false)}>
          <div className="export-modal glass-card animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="export-header">
              <h3>Marketplace Export (ONDC/JSON)</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowExport(false)}>
                <X size={16} />
              </button>
            </div>
            <pre className="export-code">{JSON.stringify(exportJson, null, 2)}</pre>
            <button className="btn btn-primary btn-block" onClick={copyExportJson}>
              <Copy size={16} /> Copy to Clipboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
