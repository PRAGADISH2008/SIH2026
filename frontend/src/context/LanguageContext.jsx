import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', native: 'English', english: 'English', bcp47: 'en-IN' },
  { code: 'ta', native: 'தமிழ்', english: 'Tamil', bcp47: 'ta-IN' },
  { code: 'hi', native: 'हिन्दी', english: 'Hindi', bcp47: 'hi-IN' },
  { code: 'te', native: 'తెలుగు', english: 'Telugu', bcp47: 'te-IN' },
  { code: 'kn', native: 'ಕನ್ನಡ', english: 'Kannada', bcp47: 'kn-IN' },
  { code: 'ml', native: 'മലയാളം', english: 'Malayalam', bcp47: 'ml-IN' },
  { code: 'bn', native: 'বাংলা', english: 'Bengali', bcp47: 'bn-IN' },
  { code: 'mr', native: 'मराठी', english: 'Marathi', bcp47: 'mr-IN' },
];

const TRANSLATIONS = {
  en: {
    // Nav
    'nav.studio': 'Studio',
    'nav.capture': 'Capture',
    'nav.marketplace': 'Marketplace',
    'nav.login': 'Login',
    'nav.logout': 'Sign Out',
    'nav.demo': 'Demo Mode',
    'nav.live': 'Live API (5000)',
    'nav.tagline': 'Artisan AI Studio',
    // Bottom Nav
    'bnav.studio': 'Studio',
    'bnav.capture': 'Capture',
    'bnav.marketplace': 'Market',
    // Capture Page
    'capture.title': 'Capture Your Craft',
    'capture.subtitle': 'Take a photo using your camera or choose from your gallery',
    'capture.openCamera': 'Tap to Open Camera',
    'capture.cameraHint': 'Takes an instant photo of your product & auto-enhances',
    'capture.takePhoto': 'Take Photo (Camera)',
    'capture.retakePhoto': 'Retake with Camera',
    'capture.gallery': 'Choose from Gallery',
    'capture.nativeLang': 'Your native language (for voice & details)',
    'capture.enhanceBtn': 'Upload & Enhance Now',
    'capture.uploading': 'Uploading & Enhancing...',
    // Capture Companion Guides
    'capture.tipsTitle': 'Artisan Photography Tips',
    'capture.tipsSubtitle': 'Techniques for high-converting marketplace listings',
    'capture.tip1Title': 'Natural Soft Lighting',
    'capture.tip1Desc': 'Shoot near an open window or daylight shade. Avoid harsh camera flash and hard shadows.',
    'capture.tip2Title': 'Clean Neutral Background',
    'capture.tip2Desc': 'Place your craft on plain wood, fabric, or a neutral table for clean AI studio polish.',
    'capture.tip3Title': 'Highlight Handmade Texture',
    'capture.tip3Desc': 'Capture authentic carving grooves, handloom weaves, and clay glaze signatures.',
    'capture.nextTitle': 'What Happens Next?',
    'capture.nextBadge': '3 Easy Steps',
    'capture.nextStep1Title': 'Instant AI Studio Polish',
    'capture.nextStep1Desc': 'AI balances shadows, removes background clutter, and sharpens craft textures.',
    'capture.nextStep2Title': 'Voice Storytelling',
    'capture.nextStep2Desc': 'Speak in your regional language; AI generates professional e-commerce product titles & descriptions.',
    'capture.nextStep3Title': 'Fair Price & Publish',
    'capture.nextStep3Desc': 'Get AI-recommended fair pricing based on material cost, labor days, and live marketplace demand.',
    // Flow Steps
    'step.photo': 'Photo',
    'step.voice': 'Voice',
    'step.catalogue': 'Catalogue',
    'step.review': 'Review',
    'step.publish': 'Publish',
    // Voice step
    'voice.title': 'Describe Your Craft',
    'voice.desc': 'Tap the microphone and tell the story of this piece in your native language.',
    'voice.tapToRecord': 'Tap to start recording',
    'voice.recording': 'Listening... Tap to stop',
    'voice.processBtn': 'Process Voice',
    // Review step
    'review.title': 'Review & Confirm',
    'review.subtitle': 'Review AI-generated fields and make corrections before confirming',
    'review.craftInfo': 'Craft Information',
    'review.productName': 'Product Name',
    'review.material': 'Material',
    'review.productionTime': 'Production Time (days)',
    'review.technique': 'Technique',
    'review.keywords': 'Keywords (comma-separated)',
    'review.confirmBtn': 'Confirm Product',
    'review.aiPricing': 'AI Pricing Intelligence',
    'review.marketLow': 'Market Low',
    'review.marketHigh': 'Market High',
    'review.aiRecommended': 'AI Recommended',
    'review.yourPrice': 'Your Price (₹)',
    'review.confidenceMeter': 'Market Sell-Through Confidence',
    'review.publishBtn': 'Publish to Marketplace',
    'common.back': 'Back',
    'common.backToVoice': 'Back to voice',
    'catalogue.generateBtn': 'Generate Catalogue & Pricing',
    // Marketplace
    'market.searchPlaceholder': 'Search by craft, material, artisan, or region...',
    'market.filters': 'Filters',
    'market.newCraft': 'New Craft',
    'market.artisanStudio': 'Artisan Studio',
    'market.by': 'By',
    'market.shareDetails': 'Share Details',
    'market.call': 'Call',
    'market.whatsapp': 'WhatsApp',
    'market.listen': 'Listen (Voice)',
    'market.stopListen': 'Stop Audio',
    'market.productDesc': 'Product Description',
    'market.publishedBy': 'Authentic craft published by:',
    'market.artisanLabel': 'Artisan:',
    'market.days': 'days',
    'market.marketRange': 'Market Range',
    'market.estMaterialCost': 'Est. Material Cost',
    'market.clear': 'Clear',
    'market.applyFilters': 'Apply Filters',
    'market.noProducts': 'No products found',
    'market.category': 'Category',
    'market.craftType': 'Craft Type',
    'market.minPrice': 'Min Price (₹)',
    'market.maxPrice': 'Max Price (₹)',
    'market.productsCount': 'products',
    // Status
    'status.published': 'Published',
    'status.draft': 'Draft',
    'status.confirmed': 'Confirmed',
    // Dashboard
    'dash.welcome': 'Welcome back',
    'dash.newCraft': 'New Craft',
    'dash.newCraftSub': 'Capture, describe & publish a craft',
    'dash.marketplaceSub': 'Browse live artisan handicrafts',
    'dash.totalCrafts': 'Live Listings',
    'dash.catValue': 'Catalogue Value',
    'dash.craftRegion': 'Craft Region',
    'dash.views': 'Marketplace Views',
    'dash.inquiries': 'Buyer Inquiries',
    'dash.myCrafts': 'Studio Catalogue',
    'dash.catalogueSub': 'Real-time view of your crafts live on the ZenCraft Marketplace',
    'dash.viewMarket': 'View in Marketplace',
    'dash.noCrafts': 'No Crafts Published Yet',
    'dash.noCraftsDesc': 'Capture your first handmade creation using our AI camera and voice assistant to publish to the marketplace.',
    'dash.catalogFirst': 'Catalog Your First Craft',
    'dash.verifiedArtisan': 'Verified Artisan',
    'dash.activeOnZen': 'Active on ZenCraft',
    'dash.buyerContact': 'Buyer Contact',
    'dash.marketStatus': 'Marketplace Status',
    'dash.directWaReady': 'Direct WhatsApp Ready',
    'dash.studioId': 'Studio ID',
    'dash.shareWhatsApp': 'Share Studio on WhatsApp',
    'dash.copyLink': 'Copy Marketplace Link',
    'dash.linkCopied': 'Catalogue Link Copied!',
    'dash.artisanTip': 'When buyers discover your craft in the marketplace, they can contact your registered phone directly via WhatsApp or Phone call.',
    // TTS Audio
    'tts.listen': 'Listen',
    'tts.stop': 'Stop',
    'tts.listenPrompt': 'Click to listen in your language',
  },

  ta: {
    // Nav
    'nav.studio': 'ஸ்டுடியோ',
    'nav.capture': 'கேமரா',
    'nav.marketplace': 'சந்தை',
    'nav.login': 'உள்நுழைக',
    'nav.logout': 'வெளியேறு',
    'nav.demo': 'டெமோ பயன்முறை',
    'nav.live': 'நேரடி API (5000)',
    'nav.tagline': 'கைவினைஞர் AI ஸ்டுடியோ',
    // Bottom Nav
    'bnav.studio': 'ஸ்டுடியோ',
    'bnav.capture': 'கேமரா',
    'bnav.marketplace': 'சந்தை',
    // Capture Page
    'capture.title': 'உங்கள் கைவினைப் பொருளைப் படம் பிடிக்கவும்',
    'capture.subtitle': 'கேமரா மூலம் புகைப்படம் எடுக்கவும் அல்லது கேலரியில் இருந்து தேர்ந்தெடுக்கவும்',
    'capture.openCamera': 'கேமராவைத் திறக்க தொடவும்',
    'capture.cameraHint': 'உடனடி புகைப்படம் எடுத்து தானாகவே மெருகூட்டும்',
    'capture.takePhoto': 'புகைப்படம் எடு (கேமரா)',
    'capture.retakePhoto': 'மீண்டும் படம் எடு',
    'capture.gallery': 'கேலரியில் இருந்து தேர்ந்தெடு',
    'capture.nativeLang': 'உங்கள் தாய்மொழி (குரல் மற்றும் விவரங்களுக்கு)',
    'capture.enhanceBtn': 'பதிவேற்றி மேம்படுத்தவும்',
    'capture.uploading': 'மேம்படுத்தப்படுகிறது...',
    // Capture Companion Guides
    'capture.tipsTitle': 'கைவினைஞர் புகைப்படக் குறிப்புகள்',
    'capture.tipsSubtitle': 'அதிக விற்பனைக்கான எளிய புகைப்பட நுணுக்கங்கள்',
    'capture.tip1Title': 'இயற்கையான வெளிச்சம்',
    'capture.tip1Desc': 'ஜன்னல் அருகே அல்லது பகல் வெளிச்சத்தில் படம் எடுக்கவும். கடுமையான ஃப்ளாஷ் தவிர்க்கவும்.',
    'capture.tip2Title': 'சுத்தமான பின்னணி',
    'capture.tip2Desc': 'வெற்று மரம், துணி அல்லது எளிய மேசையில் கைவினைப் பொருளை வைக்கவும்.',
    'capture.tip3Title': 'கைவினைத் தன்மையைக் காட்டுங்கள்',
    'capture.tip3Desc': 'செதுக்கல் கோடுகள், நெசவு நுணுக்கங்கள் மற்றும் வேலைப்பாடுகளைத் தெளிவாகக் காட்டவும்.',
    'capture.nextTitle': 'அடுத்து என்ன நடக்கும்?',
    'capture.nextBadge': '3 எளிய படிகள்',
    'capture.nextStep1Title': 'உடனடி AI ஸ்டுடியோ மெருகூட்டல்',
    'capture.nextStep1Desc': 'AI நிழல்களைச் சமன் செய்து, தேவையற்ற பின்னணியை நீக்கி படத்தை மெருகேற்றும்.',
    'capture.nextStep2Title': 'குரல் வழி கதை சொல்லல்',
    'capture.nextStep2Desc': 'உங்கள் தாய்மொழியில் பேசினாலே போதும்; AI கவர்ச்சிகரமான தயாரிப்பு விவரங்களை எழுதும்.',
    'capture.nextStep3Title': 'நியாயமான விலை & வெளியீடு',
    'capture.nextStep3Desc': 'மூலப்பொருள் செலவு, உழைப்பு நேரம் அடிப்படையில் AI சிறந்த விலையைக் கணக்கிடும்.',
    // Flow Steps
    'step.photo': 'புகைப்படம்',
    'step.voice': 'குரல்',
    'step.catalogue': 'பட்டியல்',
    'step.review': 'சரிபார்',
    'step.publish': 'வெளியிடு',
    // Voice step
    'voice.title': 'உங்கள் கைவினைப் பற்றிப் பேசுங்கள்',
    'voice.desc': 'மைக்ரோஃபோனைத் தொட்டு உங்கள் தாய்மொழியில் இந்த கைவினைக் கதையைக் கூறுங்கள்.',
    'voice.tapToRecord': 'பதிவு செய்ய தொடவும்',
    'voice.recording': 'கேட்கிறது... நிறுத்த தொடவும்',
    'voice.processBtn': 'குரலைச் செயலாக்கு',
    // Review step
    'review.title': 'சரிபார்த்து உறுதிப்படுத்துக',
    'review.subtitle': 'AI உருவாக்கிய தகவல்களைச் சரிபார்த்து உறுதிப்படுத்தவும்',
    'review.craftInfo': 'கைவினைத் தகவல்கள்',
    'review.productName': 'தயாரிப்பு பெயர்',
    'review.material': 'மூலப்பொருள்',
    'review.productionTime': 'உற்பத்தி காலம் (நாட்கள்)',
    'review.technique': 'தொழில்நுட்பம்',
    'review.keywords': 'முக்கிய வார்த்தைகள்',
    'review.confirmBtn': 'தயாரிப்பை உறுதி செய்',
    'review.aiPricing': 'AI விலை நுண்ணறிவு',
    'review.marketLow': 'குறைந்த சந்தை விலை',
    'review.marketHigh': 'அதிக சந்தை விலை',
    'review.aiRecommended': 'AI பரிந்துரைத்த விலை',
    'review.yourPrice': 'உங்கள் விலை (₹)',
    'review.confidenceMeter': 'விற்பனை நம்பிக்கை விகிதம்',
    'review.publishBtn': 'சந்தையில் வெளியிடவும்',
    'common.back': 'பின்செல்க',
    'common.backToVoice': 'குரல் பதிவுக்குத் திரும்பு',
    'catalogue.generateBtn': 'பட்டியல் & விலையை உருவாக்கு',
    // Marketplace
    'market.searchPlaceholder': 'பொருள், கைவினைஞர் அல்லது ஊர் வாரியாகத் தேடுங்கள்...',
    'market.filters': 'வடிகட்டிகள்',
    'market.newCraft': 'புதிய கைவினை',
    'market.artisanStudio': 'கைவினை ஸ்டுடியோ',
    'market.by': 'ஆக்கியவர்:',
    'market.shareDetails': 'விவரங்களைப் பகிர்க',
    'market.call': 'அழைக்க',
    'market.whatsapp': 'வாட்ஸ்அப்',
    'market.listen': 'கேளுங்கள் (குரல்)',
    'market.stopListen': 'ஆடியோவை நிறுத்து',
    'market.productDesc': 'தயாரிப்பு விவரம்',
    'market.publishedBy': 'கைவினை வெளியிட்டவர்:',
    'market.artisanLabel': 'கைவினைஞர்:',
    'market.days': 'நாட்கள்',
    'market.marketRange': 'சந்தை விலை வரம்பு',
    'market.estMaterialCost': 'தோராய மூலப்பொருள் செலவு',
    'market.clear': 'அழி',
    'market.applyFilters': 'வடிகட்டிகளைப் பயன்படுத்து',
    'market.noProducts': 'தயாரிப்புகள் எதுவும் கிடைக்கவில்லை',
    'market.category': 'வகை',
    'market.craftType': 'கைவினை வகை',
    'market.minPrice': 'குறைந்தபட்ச விலை (₹)',
    'market.maxPrice': 'அதிகபட்ச விலை (₹)',
    'market.productsCount': 'தயாரிப்புகள்',
    // Status
    'status.published': 'வெளியிடப்பட்டது',
    'status.draft': 'வரைவு',
    'status.confirmed': 'உறுதி செய்யப்பட்டது',
    // Dashboard
    'dash.welcome': 'வணக்கம்',
    'dash.newCraft': 'புதிய கைவினைப் பதிவு',
    'dash.newCraftSub': 'கைவினைப் பொருளைப் படம் பிடித்து விவரிக்கவும்',
    'dash.marketplaceSub': 'நேரடி கைவினைப் பொருட்களை உலாவவும்',
    'dash.totalCrafts': 'பதிவு செய்தவை',
    'dash.catValue': 'பட்டியல் மதிப்பு',
    'dash.craftRegion': 'கைவினைப் பகுதி',
    'dash.views': 'சந்தை பார்வைகள்',
    'dash.inquiries': 'வாடிக்கையாளர் அழைப்புகள்',
    'dash.myCrafts': 'ஸ்டுடியோ பட்டியல்',
    'dash.catalogueSub': 'சந்தையில் நேரடியாக உள்ள உங்கள் கைவினைப் பொருட்களின் விவரம்',
    'dash.viewMarket': 'சந்தையில் பார்க்கவும்',
    'dash.noCrafts': 'கைவினைப் பொருட்கள் இன்னும் வெளியிடப்படவில்லை',
    'dash.noCraftsDesc': 'AI கேமரா மற்றும் குரல் உதவியாளரைப் பயன்படுத்தி உங்கள் முதல் கைவினைப் பொருளைப் பட்டியலிடவும்.',
    'dash.catalogFirst': 'முதல் கைவினையைச் சேர்க்கவும்',
    'dash.verifiedArtisan': 'சரிபார்க்கப்பட்ட கைவினைஞர்',
    'dash.activeOnZen': 'ஜென்கிராஃப்டில் நேரலையில்',
    'dash.buyerContact': 'வாங்குபவர் தொடர்பு',
    'dash.marketStatus': 'சந்தை நிலை',
    'dash.directWaReady': 'நேரடி வாட்ஸ்அப் தயார்',
    'dash.studioId': 'ஸ்டுடியோ எண்',
    'dash.shareWhatsApp': 'ஸ்டுடியோவை வாட்ஸ்அப்பில் பகிரவும்',
    'dash.copyLink': 'சந்தை இணைப்பை நகலெடு',
    'dash.linkCopied': 'இணைப்பு நகலெடுக்கப்பட்டது!',
    'dash.artisanTip': 'வாங்குபவர்கள் உங்கள் கைவினையைக் காணும்போது, உங்கள் பதிவுசெய்த எண்ணில் வாட்ஸ்அப் அல்லது தொலைபேசி மூலம் நேரடியாகத் தொடர்புகொள்ளலாம்.',
    // TTS Audio
    'tts.listen': 'கேளுங்கள்',
    'tts.stop': 'நிறுத்து',
    'tts.listenPrompt': 'உங்கள் மொழியில் கேட்க கிளிக் செய்யவும்',
  },

  hi: {
    // Nav
    'nav.studio': 'स्टूडियो',
    'nav.capture': 'कैप्चर',
    'nav.marketplace': 'बाज़ार',
    'nav.login': 'लॉगिन',
    'nav.logout': 'लॉगआउट',
    'nav.demo': 'डेमो मोड',
    'nav.live': 'लाइव API (5000)',
    'nav.tagline': 'कारीगर AI स्टूडियो',
    // Bottom Nav
    'bnav.studio': 'स्टूडियो',
    'bnav.capture': 'कैप्चर',
    'bnav.marketplace': 'बाज़ार',
    // Capture Page
    'capture.title': 'अपने शिल्प की तस्वीर लें',
    'capture.subtitle': 'कैमरे से फोटो खींचें या अपनी गैलरी से चुनें',
    'capture.openCamera': 'कैमरा खोलने के लिए टैप करें',
    'capture.cameraHint': 'तुरंत तस्वीर लेकर अपने-आप उत्पाद को बेहतर बनाता है',
    'capture.takePhoto': 'फोटो लें (कैमरा)',
    'capture.retakePhoto': 'फिर से फोटो लें',
    'capture.gallery': 'गैलरी से चुनें',
    'capture.nativeLang': 'आपकी मूल भाषा (आवाज़ और विवरण के लिए)',
    'capture.enhanceBtn': 'अपलोड करें और सुधारें',
    'capture.uploading': 'सुधार किया जा रहा है...',
    // Capture Companion Guides
    'capture.tipsTitle': 'कारीगर फोटोग्राफी टिप्स',
    'capture.tipsSubtitle': 'अधिक बिक्री के लिए उपयोगी फोटोग्राफी तकनीक',
    'capture.tip1Title': 'प्राकृतिक कोमल रोशनी',
    'capture.tip1Desc': 'खिड़की के पास या दिन के उजाले में फोटो लें। तेज फ्लैश से बचें।',
    'capture.tip2Title': 'साफ तटस्थ पृष्ठभूमि',
    'capture.tip2Desc': 'शिल्प को सादी लकड़ी या कपड़े पर रखें ताकि AI सफाई से काम कर सके।',
    'capture.tip3Title': 'हस्तनिर्मित बनावट दिखाएं',
    'capture.tip3Desc': 'नक्काशी, बुनाई और मिट्टी के विवरण स्पष्ट रूप से दिखाएं।',
    'capture.nextTitle': 'आगे क्या होगा?',
    'capture.nextBadge': '3 आसान कदम',
    'capture.nextStep1Title': 'तुरंत AI स्टूडियो सुधार',
    'capture.nextStep1Desc': 'AI परछाई को संतुलित करेगा और बैकग्राउंड को साफ़ करेगा।',
    'capture.nextStep2Title': 'आवाज़ से कहानी',
    'capture.nextStep2Desc': 'अपनी भाषा में बोलें; AI खुद पेशेवर ई-कॉमर्स विवरण तैयार करेगा।',
    'capture.nextStep3Title': 'उचित मूल्य और प्रकाशन',
    'capture.nextStep3Desc': 'सामग्री लागत और मेहनत के आधार पर AI उचित मूल्य सुझाएगा।',
    // Flow Steps
    'step.photo': 'फोटो',
    'step.voice': 'आवाज़',
    'step.catalogue': 'कैटलॉग',
    'step.review': 'समीक्षा',
    'step.publish': 'प्रकाशित करें',
    // Voice step
    'voice.title': 'अपने शिल्प के बारे में बताएं',
    'voice.desc': 'माइक दबाएं और अपनी भाषा में इस शिल्प की कहानी बताएं।',
    'voice.tapToRecord': 'रिकॉर्डिंग शुरू करने के लिए टैप करें',
    'voice.recording': 'सुन रहा है... रोकने के लिए टैप करें',
    'voice.continue': 'आवाज़ की कहानी प्रोसेस करें',
    // Review step
    'review.title': 'कैटलॉग की समीक्षा करें',
    'review.publishBtn': 'बाज़ार में प्रकाशित करें',
    // Marketplace
    'market.searchPlaceholder': 'शिल्प, सामग्री या क्षेत्र के अनुसार खोजें...',
    'market.filters': 'फ़िल्टर',
    'market.newCraft': 'नया शिल्प',
    'market.artisanStudio': 'कारीगर स्टूडियो',
    'market.by': 'कारीगर:',
    'market.shareDetails': 'विवरण साझा करें',
    'market.call': 'कॉल करें',
    'market.whatsapp': 'व्हाट्सएप',
    'market.listen': 'सुनें (आवाज़)',
    'market.stopListen': 'ऑडियो रोकें',
    'market.productDesc': 'उत्पाद विवरण',
    'market.publishedBy': 'शिल्प निर्माता:',
    // Dashboard
    'dash.welcome': 'नमस्ते',
    'dash.newCraft': 'नया शिल्प जोड़ें',
    'dash.totalCrafts': 'कुल उत्पाद',
    'dash.views': 'बाज़ार दृश्य',
    'dash.inquiries': 'सीधी पूछताछ',
    'dash.myCrafts': 'स्टूडियो कैटलॉग',
    // TTS Audio
    'tts.listen': 'सुनें',
    'tts.stop': 'रोकें',
    'tts.listenPrompt': 'अपनी भाषा में सुनने के लिए क्लिक करें',
  },

  te: {
    // Nav
    'nav.studio': 'స్టూడియో',
    'nav.capture': 'క్యాప్చర్',
    'nav.marketplace': 'మార్కెట్‌ప్లేస్',
    'nav.login': 'లాగిన్',
    'nav.logout': 'లాగౌట్',
    'nav.demo': 'డెమో మోడ్',
    'nav.live': 'లైవ్ API (5000)',
    'nav.tagline': 'కళాకారుల AI స్టూడియో',
    // Bottom Nav
    'bnav.studio': 'స్టూడియో',
    'bnav.capture': 'క్యాప్చర్',
    'bnav.marketplace': 'మార్కెట్',
    // Capture Page
    'capture.title': 'మీ కళాఖండాన్ని క్యాప్చర్ చేయండి',
    'capture.subtitle': 'కెమెరాతో ఫోటో తీయండి లేదా గ్యాలరీ నుండి ఎంచుకోండి',
    'capture.openCamera': 'కెమెరా తెరవడానికి నొక్కండి',
    'capture.cameraHint': 'తక్షణమే ఫోటో తీసి ఆటోమేటిక్‌గా నాణ్యత పెంచుతుంది',
    'capture.takePhoto': 'ఫోటో తీయండి (కెమెరా)',
    'capture.retakePhoto': 'మళ్ళీ తీయండి',
    'capture.gallery': 'గ్యాలరీ నుండి ఎంచుకోండి',
    'capture.nativeLang': 'మీ మాతృభాష (వాయిస్ మరియు వివరాల కోసం)',
    'capture.enhanceBtn': 'అప్‌లోడ్ చేసి మెరుగుపరచండి',
    'capture.uploading': 'మెరుగుపరుస్తోంది...',
    // Capture Companion Guides
    'capture.tipsTitle': 'కళాకారుల ఫోటోగ్రఫీ చిట్కాలు',
    'capture.tipsSubtitle': 'అధిక అమ్మకాల కొరకు ఉపయోగకరమైన సూచనలు',
    'capture.tip1Title': 'సహజమైన మృదువైన వెలుతురు',
    'capture.tip1Desc': 'కిటికీ దగ్గర లేదా పగటి కాంతిలో ఫోటో తీయండి. ఫ్లాష్ వాడవద్దు.',
    'capture.tip2Title': 'శుభ్రమైన నేపథ్యం',
    'capture.tip2Desc': 'సాదా చెక్క లేదా బట్టపై వస్తువును ఉంచండి.',
    'capture.tip3Title': 'చేతిపని నైపుణ్యాన్ని చూపించండి',
    'capture.tip3Desc': 'చెక్కడాలు, నేత వివరాలు స్పష్టంగా కనిపించేలా తీయండి.',
    'capture.nextTitle': 'తర్వాత ఏమి జరుగుతుంది?',
    'capture.nextBadge': '3 సులభమైన దశలు',
    'capture.nextStep1Title': 'తక్షణ AI స్టూడియో పాలిష్',
    'capture.nextStep1Desc': 'AI నీడలను సర్దుబాటు చేసి, బ్యాక్‌గ్రౌండ్‌ను అందంగా మారుస్తుంది.',
    'capture.nextStep2Title': 'వాయిస్ స్టోరీటెల్లింగ్',
    'capture.nextStep2Desc': 'మీ భాషలో మాట్లాడండి; AI ఆకర్షణీయమైన వివరాలను రాస్తుంది.',
    'capture.nextStep3Title': 'సరసమైన ధర & ప్రచురణ',
    'capture.nextStep3Desc': 'మెటీరియల్ ఖర్చు, శ్రమ సమయం ఆధారంగా AI సరసమైన ధరను సూచిస్తుంది.',
    // Flow Steps
    'step.photo': 'ఫోటో',
    'step.voice': 'వాయిస్',
    'step.catalogue': 'కేటలాగ్',
    'step.review': 'సమీక్ష',
    'step.publish': 'ప్రచురించు',
    // Voice step
    'voice.title': 'మీ కళారూపం గురించి చెప్పండి',
    'voice.desc': 'మైక్ నొక్కి మీ స్వంత భాషలో ఈ కళాఖండం కథను చెప్పండి.',
    'voice.tapToRecord': 'రికార్డింగ్ ప్రారంభించడానికి నొక్కండి',
    'voice.recording': 'వింటోంది... ఆపడానికి నొక్కండి',
    'voice.continue': 'వాయిస్ కథను రూపొందించండి',
    // Review step
    'review.title': 'కేటలాగ్‌ను సమీక్షించండి',
    'review.publishBtn': 'మార్కెట్‌లో ప్రచురించండి',
    // Marketplace
    'market.searchPlaceholder': 'కళారూపం, సామగ్రి లేదా ప్రాంతం వారీగా వెతకండి...',
    'market.filters': 'ఫిల్టర్లు',
    'market.newCraft': 'కొత్త కళాకృతి',
    'market.artisanStudio': 'కళాకారుల స్టూడియో',
    'market.by': 'రూపకర్త:',
    'market.shareDetails': 'వివరాలను పంచుకోండి',
    'market.call': 'కాల్ చేయండి',
    'market.whatsapp': 'వాట్సాప్',
    'market.listen': 'వినండి (వాయిస్)',
    'market.stopListen': 'ఆపండి',
    'market.productDesc': 'ఉత్పత్తి వివరణ',
    'market.publishedBy': 'కళాకారుడు:',
    // Dashboard
    'dash.welcome': 'స్వాగతం',
    'dash.newCraft': 'కొత్త కళాఖండం చేర్చండి',
    'dash.totalCrafts': 'మొత్తం వస్తువులు',
    'dash.views': 'వీక్షణలు',
    'dash.inquiries': 'విచారణలు',
    'dash.myCrafts': 'స్టూడియో కేటలాగ్',
    // TTS Audio
    'tts.listen': 'వినండి',
    'tts.stop': 'ఆపండి',
    'tts.listenPrompt': 'మీ భాషలో వినడానికి క్లిక్ చేయండి',
  },

  kn: {
    'nav.studio': 'ಸ್ಟುಡಿಯೋ',
    'nav.capture': 'ಕ್ಯಾಪ್ಚರ್',
    'nav.marketplace': 'ಮಾರುಕಟ್ಟೆ',
    'nav.login': 'ಲಾಗಿನ್',
    'nav.logout': 'ನಿರ್ಗಮಿಸಿ',
    'nav.demo': 'ಡೆಮೊ ಮೋಡ್',
    'nav.live': 'ಲೈವ್ API (5000)',
    'bnav.studio': 'ಸ್ಟುಡಿಯೋ',
    'bnav.capture': 'ಕ್ಯಾಪ್ಚರ್',
    'bnav.marketplace': 'ಮಾರುಕಟ್ಟೆ',
    'capture.title': 'ನಿಮ್ಮ ಕರಕುಶಲ ವಸ್ತುವಿನ ಫೋಟೋ ತೆಗೆಯಿರಿ',
    'capture.subtitle': 'ಕ್ಯಾಮರಾ ಬಳಸಿ ಅಥವಾ ಗ್ಯಾಲರಿಯಿಂದ ಆಯ್ಕೆಮಾಡಿ',
    'capture.openCamera': 'ಕ್ಯಾಮರಾ ತೆರೆಯಲು ಸ್ಪರ್ಶಿಸಿ',
    'capture.takePhoto': 'ಫೋಟೋ ತೆಗೆಯಿರಿ (ಕ್ಯಾಮರಾ)',
    'capture.gallery': 'ಗ್ಯಾಲರಿಯಿಂದ ಆರಿಸಿ',
    'step.photo': 'ಫೋಟೋ',
    'step.voice': 'ಧ್ವನಿ',
    'step.catalogue': 'ಕ್ಯಾಟಲಾಗ್',
    'step.review': 'ಪರಿಶೀಲಿಸಿ',
    'step.publish': 'ಪ್ರಕಟಿಸಿ',
    'market.searchPlaceholder': 'ಕರಕುಶಲ ಅಥವಾ ಪ್ರದೇಶದ ಪ್ರಕಾರ ಹುಡುಕಿ...',
    'market.call': 'ಕರೆ ಮಾಡಿ',
    'market.whatsapp': 'ವಾಟ್ಸಾಪ್',
    'market.shareDetails': 'ವಿವರ ಹಂಚಿಕೊಳ್ಳಿ',
    'tts.listen': 'ಕೇಳಿ',
    'tts.stop': 'ನಿಲ್ಲಿಸಿ',
  },

  ml: {
    'nav.studio': 'സ്റ്റുഡിയോ',
    'nav.capture': 'ക്യാപ്ചർ',
    'nav.marketplace': 'മാർക്കറ്റ്',
    'nav.login': 'ലോഗിൻ',
    'nav.logout': 'ലോഗൗട്ട്',
    'nav.demo': 'ഡെമോ മോഡ്',
    'nav.live': 'ലൈവ് API (5000)',
    'bnav.studio': 'സ്റ്റുഡിയോ',
    'bnav.capture': 'ക്യാപ്ചർ',
    'bnav.marketplace': 'മാർക്കറ്റ്',
    'capture.title': 'നിങ്ങളുടെ കരകൗശല ഉൽപ്പന്നത്തിന്റെ ഫോട്ടോ എടുക്കുക',
    'capture.subtitle': 'ക്യാമറ വഴിയോ ഗാലറിയിൽ നിന്നോ തിരഞ്ഞെടുക്കുക',
    'capture.openCamera': 'ക്യാമറ തുറക്കാൻ ടാപ്പ് ചെയ്യുക',
    'capture.takePhoto': 'ഫോട്ടോ എടുക്കുക (ക്യാമറ)',
    'capture.gallery': 'ഗാലറിയിൽ നിന്ന് തിരഞ്ഞെടുക്കുക',
    'step.photo': 'ഫോട്ടോ',
    'step.voice': 'ശബ്ദം',
    'step.catalogue': 'കാറ്റലോഗ്',
    'step.review': 'പരിശോധിക്കുക',
    'step.publish': 'പ്രസിദ്ധീകരിക്കുക',
    'market.searchPlaceholder': 'കരകൗശല ഉൽപ്പന്നങ്ങൾ തിരയുക...',
    'market.call': 'വിളിക്കുക',
    'market.whatsapp': 'വാട്സാപ്പ്',
    'market.shareDetails': 'വിവരങ്ങൾ പങ്കിടുക',
    'tts.listen': 'കേൾക്കുക',
    'tts.stop': 'നിർത്തുക',
  },

  bn: {
    'nav.studio': 'স্টুডিও',
    'nav.capture': 'ক্যাপচার',
    'nav.marketplace': 'মার্কেটপ্লেস',
    'nav.login': 'লগইন',
    'nav.logout': 'লগআউট',
    'nav.demo': 'ডেমো মোড',
    'nav.live': 'লাইভ API (5000)',
    'bnav.studio': 'স্টুডিও',
    'bnav.capture': 'ক্যাপচার',
    'bnav.marketplace': 'মার্কেটপ্লেস',
    'capture.title': 'আপনার হস্তশিল্পের ছবি তুলুন',
    'capture.subtitle': 'ক্যামেরা ব্যবহার করুন বা গ্যালারি থেকে বাছুন',
    'capture.openCamera': 'ক্যামেরা খুলতে ট্যাপ করুন',
    'capture.takePhoto': 'ছবি তুলুন (ক্যামেরা)',
    'capture.gallery': 'গ্যালারি থেকে বাছুন',
    'step.photo': 'ছবি',
    'step.voice': 'কণ্ঠস্বর',
    'step.catalogue': 'ক্যাটালগ',
    'step.review': 'যাচাই',
    'step.publish': 'প্রকাশ করুন',
    'market.searchPlaceholder': 'শিল্প বা অঞ্চলের মাধ্যমে অনুসন্ধান করুন...',
    'market.call': 'কল করুন',
    'market.whatsapp': 'হোয়াটসঅ্যাপ',
    'market.shareDetails': 'বিবরণ শেয়ার করুন',
    'tts.listen': 'শুনুন',
    'tts.stop': 'থামান',
  },

  mr: {
    'nav.studio': 'स्टुडिओ',
    'nav.capture': 'कॅप्चर',
    'nav.marketplace': 'बाजारपेठ',
    'nav.login': 'लॉगिन',
    'nav.logout': 'लॉगआउट',
    'nav.demo': 'डेमो मोड',
    'nav.live': 'लाइव्ह API (5000)',
    'bnav.studio': 'स्टुडिओ',
    'bnav.capture': 'कॅप्चर',
    'bnav.marketplace': 'बाजारपेठ',
    'capture.title': 'तुमच्या कलाकृतीचा फोटो घ्या',
    'capture.subtitle': 'कॅमेरा वापरा किंवा गॅलरीमधून निवडा',
    'capture.openCamera': 'कॅमेरा उघडण्यासाठी टॅप करा',
    'capture.takePhoto': 'फोटो घ्या (कॅमेरा)',
    'capture.gallery': 'गॅलरीमधून निवडा',
    'step.photo': 'फोटो',
    'step.voice': 'आवाज',
    'step.catalogue': 'कॅटलॉग',
    'step.review': 'पुनरावलोकन',
    'step.publish': 'प्रकाशित करा',
    'market.searchPlaceholder': 'शिल्प किंवा प्रदेशानुसार शोधा...',
    'market.call': 'कॉल करा',
    'market.whatsapp': 'व्हॉट्सअॅप',
    'market.shareDetails': 'माहिती शेअर करा',
    'tts.listen': 'ऐका',
    'tts.stop': 'थांबवा',
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('zencraft_lang') || 'en';
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingText, setSpeakingText] = useState('');

  const setLanguage = useCallback((newLang) => {
    setLanguageState(newLang);
    localStorage.setItem('zencraft_lang', newLang);
  }, []);

  // Text translation helper
  const t = useCallback((key, fallback) => {
    const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
    if (langDict && langDict[key]) return langDict[key];
    if (TRANSLATIONS.en && TRANSLATIONS.en[key]) return TRANSLATIONS.en[key];
    return fallback || key;
  }, [language]);

  // Phase 3: Web Speech API TTS (Zero API keys needed!)
  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingText('');
    }
  }, []);

  const speakText = useCallback((text, langCode = language) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) {
      return false;
    }

    // Toggle off if already speaking this exact text
    if (isSpeaking && speakingText === text) {
      stopSpeaking();
      return false;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const matchedLang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    const bcp47 = matchedLang ? matchedLang.bcp47 : 'en-IN';
    utterance.lang = bcp47;
    utterance.rate = 0.92; // Natural, clear cadence for regional artisans
    utterance.pitch = 1.0;

    // Pick a matching voice if the browser loaded regional voices
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const bestVoice = voices.find(v => v.lang === bcp47 || v.lang.startsWith(langCode));
      if (bestVoice) utterance.voice = bestVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingText(text);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingText('');
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingText('');
    };

    window.speechSynthesis.speak(utterance);
    return true;
  }, [language, isSpeaking, speakingText, stopSpeaking]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      currentLangObj,
      supportedLanguages: SUPPORTED_LANGUAGES,
      speakText,
      stopSpeaking,
      isSpeaking,
      speakingText
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}
