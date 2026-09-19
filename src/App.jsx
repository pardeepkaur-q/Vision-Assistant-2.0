import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useEffect, useRef, useState } from "react";
import "./App.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

// ---------------- LANGUAGES ----------------

const languages = [
  { name: "English", code: "en-IN", flag: "🇬🇧" },
  { name: "Hindi", code: "hi-IN", flag: "🇮🇳" },
  { name: "Punjabi", code: "pa-IN", flag: "ਪੰ" },
  { name: "Bengali", code: "bn-IN", flag: "বাং" },
  { name: "Tamil", code: "ta-IN", flag: "த" },
  { name: "Telugu", code: "te-IN", flag: "తె" },
  { name: "Marathi", code: "mr-IN", flag: "म" },
  { name: "Gujarati", code: "gu-IN", flag: "ગુ" },
  { name: "Kannada", code: "kn-IN", flag: "ಕ" },
  { name: "Malayalam", code: "ml-IN", flag: "മ" },
  { name: "Odia", code: "or-IN", flag: "ଓ" },
];

// ---------------- QUICK FEATURES ----------------

const quickFeatures = [
  {
    icon: "📄",
    title: "Read Document",
    description:
      "Read documents and understand important information.",
  },
  {
    icon: "📷",
    title: "What's Around Me?",
    description:
      "Understand common objects, signs and surroundings.",
  },
  {
    icon: "📝",
    title: "Smart Forms",
    description:
      "Get voice guidance while filling forms.",
  },
  {
    icon: "🎓",
    title: "Study Mode",
    description:
      "Learn from PDFs, paragraphs and difficult words.",
  },
];

// ---------------- FEATURES ----------------

const features = [
  {
    icon: "🗣️",
    title: "Talk to Website",
    text:
      "Speak naturally. VisionAssist can listen, understand and respond.",
    tag: "VOICE FIRST",
  },
  {
    icon: "🌐",
    title: "Indian Languages",
    text:
      "Choose the language that feels natural to you.",
    tag: "11 LANGUAGES",
  },
  {
    icon: "📷",
    title: "Vision Assist",
    text:
      "Understand everyday objects, signs, text and surroundings.",
    tag: "CAMERA AI",
  },
  {
    icon: "📚",
    title: "Study Mode",
    text:
      "Read, explain, summarize and ask questions about study material.",
    tag: "FOR STUDENTS",
  },
  {
    icon: "🧾",
    title: "Smart Forms",
    text:
      "Get spoken guidance about fields and missing information.",
    tag: "FORM ASSIST",
  },
  {
    icon: "🛒",
    title: "Product Reader",
    text:
      "Read packaging labels and basic product information.",
    tag: "OCR",
  },
  {
    icon: "🔐",
    title: "Privacy Mode",
    text:
      "Decide what you want to save, delete or keep private.",
    tag: "USER CONTROL",
  },
  {
    icon: "👨‍👩‍👧",
    title: "Trusted Helper",
    text:
      "Share selected information with a trusted person when you choose.",
    tag: "HUMAN FALLBACK",
  },
];

function App() {
  // ---------------- STATES ----------------

  const [selectedLanguage, setSelectedLanguage] = useState(
    languages[0]
  );

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");

  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  const [activeFeature, setActiveFeature] = useState(null);

  // Document
  const [documentText, setDocumentText] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [isReadingDocument, setIsReadingDocument] =
    useState(false);

  // Camera
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState("");
  const [imageAnalysis, setImageAnalysis] = useState("");

  // Smart Forms
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formMessage, setFormMessage] = useState("");

  // Study
  const [studyText, setStudyText] = useState("");
  const [studyResult, setStudyResult] = useState("");
  const [studyFileName, setStudyFileName] = useState("");

  // Refs
  const recognitionRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const documentInputRef = useRef(null);
  const studyInputRef = useRef(null);

  // ---------------- SPEAK ----------------

  const speak = (text, language = selectedLanguage) => {
    if (!text || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(text);

    utterance.lang = language.code;
    utterance.rate = 0.9;
    utterance.pitch = 1;

    const voices =
      window.speechSynthesis.getVoices();

    const matchingVoice = voices.find((voice) =>
      voice.lang
        .toLowerCase()
        .startsWith(
          language.code
            .split("-")[0]
            .toLowerCase()
        )
    );

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  // ---------------- LANGUAGE CHANGE ----------------

  const handleLanguageChange = (event) => {
    const language = languages.find(
      (item) => item.code === event.target.value
    );

    if (!language) return;

    setSelectedLanguage(language);

    const message =
      language.name === "English"
        ? "English language selected."
        : `${language.name} language selected.`;

    setResponse(message);

    setTimeout(() => {
      speak(message, language);
    }, 100);
  };

  // ---------------- VOICE ASSISTANT ----------------

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const message =
        "Voice recognition is not supported in this browser. Please use Google Chrome.";

      setResponse(message);
      speak(message);

      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = selectedLanguage.code;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("");
      setResponse("I'm listening...");
    };

    recognition.onresult = (event) => {
      let finalText = "";
      let temporaryText = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const text =
          event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalText += text;
        } else {
          temporaryText += text;
        }
      }

      setTranscript(
        finalText || temporaryText
      );

      if (finalText) {
        const reply =
          createResponse(finalText);

        setResponse(reply);

        setTimeout(() => {
          speak(reply);
        }, 250);
      }
    };

    recognition.onerror = (event) => {
      console.log(
        "Speech recognition error:",
        event.error
      );

      setIsListening(false);

      let message =
        "I couldn't hear that. Please try again.";

      if (event.error === "not-allowed") {
        message =
          "Microphone permission is blocked. Please allow microphone access.";
      }

      setResponse(message);
      speak(message);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (error) {
      console.error(
        "Recognition start error:",
        error
      );
    }
  };

  // ---------------- VOICE COMMAND RESPONSE ----------------

  const createResponse = (text) => {
    const lowerText =
      text.toLowerCase();

    if (
      lowerText.includes("hello") ||
      lowerText.includes("hi") ||
      lowerText.includes("नमस्ते") ||
      lowerText.includes("ਸਤ ਸ੍ਰੀ ਅਕਾਲ")
    ) {
      return getGreeting();
    }

    if (
      lowerText.includes("document") ||
      lowerText.includes("document पढ़") ||
      lowerText.includes("document pad")
    ) {
      openFeature("document");

      return getTranslatedMessage(
        "Document Reader is ready. Upload a document and I can help you read it."
      );
    }

    if (
      lowerText.includes("study") ||
      lowerText.includes("पढ़ाई") ||
      lowerText.includes("ਪੜ੍ਹਾਈ")
    ) {
      openFeature("study");

      return getTranslatedMessage(
        "Study Mode is ready. You can use it to understand your study material."
      );
    }

    if (
      lowerText.includes("around me") ||
      lowerText.includes("आसपास") ||
      lowerText.includes("ਆਲੇ ਦੁਆਲੇ")
    ) {
      openFeature("camera");

      return getTranslatedMessage(
        "Vision Mode is ready. You can use your camera to view your surroundings."
      );
    }

    if (
      lowerText.includes("product") ||
      lowerText.includes("medicine") ||
      lowerText.includes("bottle") ||
      lowerText.includes("दवा")
    ) {
      openFeature("product");

      return getTranslatedMessage(
        "Product Reader is ready. Point the camera at a product and capture a clear photo."
      );
    }

    if (
      lowerText.includes("form") ||
      lowerText.includes("forms") ||
      lowerText.includes("फॉर्म")
    ) {
      openFeature("forms");

      return getTranslatedMessage(
        "Smart Forms is ready. I can help you check your form fields."
      );
    }

    if (
      lowerText.includes("language") ||
      lowerText.includes("languages") ||
      lowerText.includes("भाषा") ||
      lowerText.includes("ਭਾਸ਼ਾ")
    ) {
      openFeature("languages");

      return getTranslatedMessage(
        "Indian Languages is ready. Choose the language you want to use."
      );
    }

    return getTranslatedMessage(
      "I am ready to help. Try saying document, study, camera, form or language."
    );
  };

  // ---------------- GREETING ----------------

  const getGreeting = () => {
    const greetings = {
      "en-IN":
        "Hello! I'm VisionAssist. How can I help you?",

      "hi-IN":
        "नमस्ते! मैं VisionAssist हूँ। मैं आपकी कैसे मदद कर सकता हूँ?",

      "pa-IN":
        "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ VisionAssist ਹਾਂ। ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?",

      "bn-IN":
        "নমস্কার! আমি VisionAssist। আমি কীভাবে আপনাকে সাহায্য করতে পারি?",

      "ta-IN":
        "வணக்கம்! நான் VisionAssist. நான் உங்களுக்கு எப்படி உதவ முடியும்?",

      "te-IN":
        "నమస్కారం! నేను VisionAssist. నేను మీకు ఎలా సహాయం చేయగలను?",

      "mr-IN":
        "नमस्कार! मी VisionAssist आहे. मी तुमची कशी मदत करू शकतो?",

      "gu-IN":
        "નમસ્તે! હું VisionAssist છું. હું તમારી કેવી રીતે મદદ કરી શકું?",

      "kn-IN":
        "ನಮಸ್ಕಾರ! ನಾನು VisionAssist. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",

      "ml-IN":
        "നമസ്കാരം! ഞാൻ VisionAssist. ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കാം?",

      "or-IN":
        "ନମସ୍କାର! ମୁଁ VisionAssist। ମୁଁ ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?",
    };

    return (
      greetings[selectedLanguage.code] ||
      greetings["en-IN"]
    );
  };

  // ---------------- TRANSLATED MESSAGE ----------------

  const getTranslatedMessage = (
    englishMessage
  ) => {
    const translations = {
      "hi-IN":
        "यह सुविधा तैयार है। आगे हम इसमें और AI capabilities जोड़ेंगे.",

      "pa-IN":
        "ਇਹ ਸੁਵਿਧਾ ਤਿਆਰ ਹੈ। ਅੱਗੇ ਅਸੀਂ ਇਸ ਵਿੱਚ ਹੋਰ AI capabilities ਸ਼ਾਮਲ ਕਰਾਂਗੇ।",

      "bn-IN":
        "এই সুবিধাটি প্রস্তুত। পরে আমরা এতে আরও AI capabilities যোগ করব।",

      "ta-IN":
        "இந்த வசதி தயாராக உள்ளது. பின்னர் இதில் மேலும் AI capabilities சேர்ப்போம்.",

      "te-IN":
        "ఈ ఫీచర్ సిద్ధంగా ఉంది. తరువాత ఇందులో మరిన్ని AI capabilities జోడిస్తాము.",

      "mr-IN":
        "ही सुविधा तयार आहे. पुढे आपण यात आणखी AI capabilities जोडू.",

      "gu-IN":
        "આ સુવિધા તૈયાર છે. આગળ આપણે તેમાં વધુ AI capabilities ઉમેરીશું.",

      "kn-IN":
        "ಈ ವೈಶಿಷ್ಟ್ಯ ಸಿದ್ಧವಾಗಿದೆ. ಮುಂದೆ ನಾವು ಇದಕ್ಕೆ ಇನ್ನಷ್ಟು AI capabilities ಸೇರಿಸುತ್ತೇವೆ.",

      "ml-IN":
        "ഈ ഫീച്ചർ തയ്യാറാണ്. പിന്നീട് ഇതിലേക്ക് കൂടുതൽ AI capabilities ചേർക്കാം.",

      "or-IN":
        "ଏହି ସୁବିଧା ପ୍ରସ୍ତୁତ ଅଛି। ପରେ ଆମେ ଏଥିରେ ଅଧିକ AI capabilities ଯୋଗ କରିବୁ.",
    };

    return (
      translations[selectedLanguage.code] ||
      englishMessage
    );
  };

  // ---------------- OPEN FEATURES ----------------

  const openFeature = (feature) => {
    stopCamera();

    setActiveFeature(feature);

    if (feature === "document") {
      const message =
        "Document Reader opened. You can upload a PDF or text document.";

      setResponse(message);
      speak(message);
    }

    if (feature === "camera") {
      const message =
        "Vision Mode opened. Camera assistance is ready.";

      setResponse(message);
      speak(message);

      setTimeout(() => {
        startCamera();
      }, 300);
    }

    if (feature === "forms") {
      const message =
        "Smart Forms opened. Voice guidance is ready.";

      setResponse(message);
      speak(message);
    }

    if (feature === "study") {
      const message =
        "Study Mode opened. You can upload study material or paste text.";

      setResponse(message);
      speak(message);
    }

    if (feature === "product") {
      const message =
        "Product Reader opened. You can use the camera to read product information.";

      setResponse(message);
      speak(message);

      setTimeout(() => {
        startCamera();
      }, 300);
    }

    if (feature === "privacy") {
      const message =
        "Privacy Mode opened. Your information stays under your control.";

      setResponse(message);
      speak(message);
    }

    if (feature === "helper") {
      const message =
        "Trusted Helper opened. You can choose what information to share with a trusted person.";

      setResponse(message);
      speak(message);
    }

    if (feature === "languages") {
      const message =
        "Indian Languages opened. Choose the language you want to use.";

      setResponse(message);
      speak(message);
    }
  };

  // ---------------- QUICK FEATURES ----------------

  const handleQuickFeature = (title) => {
    if (title === "Read Document") {
      openFeature("document");
    }

    else if (title === "What's Around Me?") {
      openFeature("camera");
    }

    else if (title === "Smart Forms") {
      openFeature("forms");
    }

    else if (title === "Study Mode") {
      openFeature("study");
    }

    else if (title === "Talk to Website") {
      const message =
        "Voice assistant is ready. Click Talk to VisionAssist and speak naturally.";

      setResponse(message);
      speak(message);
    }

    else if (title === "Indian Languages") {
      openFeature("languages");
    }

    else if (title === "Vision Assist") {
      openFeature("camera");
    }

    else if (title === "Product Reader") {
      openFeature("product");
    }

    else if (title === "Privacy Mode") {
      openFeature("privacy");
    }

    else if (title === "Trusted Helper") {
      openFeature("helper");
    }
  };

  // ---------------- DOCUMENT READER ----------------

  const readPdf = async (file) => {
    setIsReadingDocument(true);
    setDocumentText("");
    setDocumentName(file.name);

    try {
      const arrayBuffer =
        await file.arrayBuffer();

      const pdf =
        await pdfjsLib.getDocument({
          data: arrayBuffer,
        }).promise;

      let fullText = "";

      for (
        let pageNumber = 1;
        pageNumber <= pdf.numPages;
        pageNumber++
      ) {
        const page =
          await pdf.getPage(pageNumber);

        const content =
          await page.getTextContent();

        const pageText =
          content.items
            .map((item) => item.str)
            .join(" ");

        fullText +=
          `\n\nPage ${pageNumber}\n${pageText}`;
      }

      if (!fullText.trim()) {
        fullText =
          "No selectable text was found in this PDF. This may be a scanned document.";
      }

      setDocumentText(
        fullText.trim()
      );

      const message =
        `Document loaded successfully. ${pdf.numPages} page${
          pdf.numPages > 1 ? "s" : ""
        } found.`;

      setResponse(message);
      speak(message);

    } catch (error) {
      console.error(
        "PDF error:",
        error
      );

      const message =
        "I could not read this document. Please try another PDF.";

      setResponse(message);
      speak(message);

    } finally {
      setIsReadingDocument(false);
    }
  };

  const handleDocumentUpload = async (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      file.type === "text/plain" ||
      file.name.endsWith(".txt") ||
      file.name.endsWith(".md")
    ) {
      try {
        const text =
          await file.text();

        setDocumentName(file.name);
        setDocumentText(text);

        const message =
          "Text document loaded successfully.";

        setResponse(message);
        speak(message);

      } catch (error) {
        console.error(error);

        setResponse(
          "Could not read this text file."
        );

        speak(
          "Could not read this text file."
        );
      }

      return;
    }

    if (
      file.type === "application/pdf" ||
      file.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      await readPdf(file);
      return;
    }

    const message =
      "Please upload a PDF, TXT or Markdown document.";

    setResponse(message);
    speak(message);
  };

  const speakDocument = () => {
    if (!documentText) {
      speak(
        "Please upload a document first."
      );
      return;
    }

    speak(
      documentText.slice(0, 5000)
    );
  };

  // ---------------- CAMERA ----------------

  const startCamera = async () => {
    if (
      !navigator.mediaDevices?.getUserMedia
    ) {
      const message =
        "Camera access is not supported by this browser.";

      setResponse(message);
      speak(message);

      return;
    }

    try {
      stopCamera();

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: true,
            audio: false,
          }
        );

      streamRef.current =
        stream;

      setCameraActive(true);

    } catch (error) {
      console.error(
        "Camera error:",
        error
      );

      const message =
        "Camera permission was not available. Please allow camera access.";

      setResponse(message);
      speak(message);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop();
        });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject =
        null;
    }

    setCameraActive(false);
  };

  // ---------------- CONNECT CAMERA ----------------

  useEffect(() => {
    if (
      cameraActive &&
      videoRef.current &&
      streamRef.current
    ) {
      videoRef.current.srcObject =
        streamRef.current;

      videoRef.current
        .play()
        .catch((error) => {
          console.error(
            "Video play error:",
            error
          );
        });
    }
  }, [cameraActive]);

  // ---------------- IMAGE ANALYSIS ----------------

  const analyzeImage = async (
    mode =
      activeFeature === "product"
        ? "product"
        : "vision"
  ) => {
    if (!capturedImage) {
      const message =
        mode === "product"
          ? "Please capture a product photo first."
          : "Please capture an image first.";

      setImageAnalysis(message);
      speak(message);

      return;
    }

    try {
      const loadingMessage =
        mode === "product"
          ? "Reading product information..."
          : "Analyzing image...";

      setImageAnalysis(
        loadingMessage
      );

      const response =
        await fetch(
          `${
            import.meta.env.VITE_API_URL ||
            "http://localhost:5000"
          }/api/analyze-image`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              image: capturedImage,
              mode,
            }),
          }
        );

      const data =
        await response.json();

      console.log(
        "Frontend received:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.error ||
            (mode === "product"
              ? "Product analysis failed"
              : "Image analysis failed")
        );
      }

      const analysis =
        data.analysis ||
        (mode === "product"
          ? "I could not identify readable product information."
          : "No analysis received.");

      setImageAnalysis(
        analysis
      );

      setResponse(analysis);

      speak(analysis);

    } catch (error) {
      console.error(
        "Image analysis error:",
        error
      );

      const errorMessage =
        mode === "product"
          ? "Unable to read the product information. Please capture a clearer photo and try again."
          : "Unable to analyze the image. Please try again.";

      setImageAnalysis(
        errorMessage
      );

      setResponse(
        errorMessage
      );

      speak(errorMessage);
    }
  };

  // ---------------- CAPTURE PHOTO ----------------

  const capturePhoto = () => {
    const video =
      videoRef.current;

    if (!video || !cameraActive) {
      speak(
        "Please start the camera first."
      );

      return;
    }

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      video.videoWidth || 640;

    canvas.height =
      video.videoHeight || 480;

    const context =
      canvas.getContext("2d");

    if (!context) {
      speak(
        "Could not capture the image."
      );

      return;
    }

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const image =
      canvas.toDataURL(
        "image/jpeg",
        0.9
      );

    setCapturedImage(image);
    setImageAnalysis("");

    const message =
      activeFeature === "product"
        ? "Product photo captured. Click Read Product to read the label."
        : "Photo captured successfully. Click Analyze Image to analyze it.";

    setResponse(message);
    speak(message);
  };

  // ---------------- SMART FORMS ----------------

  const checkForm = () => {
    const missing = [];

    if (!formName.trim()) {
      missing.push("Name");
    }

    if (!formEmail.trim()) {
      missing.push("Email");
    }

    if (!formPhone.trim()) {
      missing.push("Phone");
    }

    if (missing.length === 0) {
      const message =
        "All important form fields are filled. Your form looks ready.";

      setFormMessage(message);
      setResponse(message);
      speak(message);

      return;
    }

    const message =
      "Please complete these fields: " +
      missing.join(", ") +
      ".";

    setFormMessage(message);
    setResponse(message);
    speak(message);
  };

  // ---------------- STUDY MODE ----------------

  const handleStudyUpload = async (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    setStudyFileName(
      file.name
    );

    if (
      file.type === "text/plain" ||
      file.name.endsWith(".txt") ||
      file.name.endsWith(".md")
    ) {
      try {
        const text =
          await file.text();

        setStudyText(text);

        const message =
          "Study text loaded successfully.";

        setResponse(message);
        speak(message);

      } catch (error) {
        console.error(error);

        setResponse(
          "Could not read the study file."
        );

        speak(
          "Could not read the study file."
        );
      }

      return;
    }

    if (
      file.type === "application/pdf" ||
      file.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      try {
        const arrayBuffer =
          await file.arrayBuffer();

        const pdf =
          await pdfjsLib.getDocument({
            data: arrayBuffer,
          }).promise;

        let fullText = "";

        for (
          let pageNumber = 1;
          pageNumber <= pdf.numPages;
          pageNumber++
        ) {
          const page =
            await pdf.getPage(
              pageNumber
            );

          const content =
            await page.getTextContent();

          const pageText =
            content.items
              .map(
                (item) =>
                  item.str
              )
              .join(" ");

          fullText +=
            "\n\n" +
            `Page ${pageNumber}\n` +
            pageText;
        }

        setStudyText(
          fullText.trim()
        );

        const message =
          "Study PDF loaded successfully.";

        setResponse(message);
        speak(message);

      } catch (error) {
        console.error(
          "Study PDF error:",
          error
        );

        const message =
          "I could not read this study PDF.";

        setResponse(message);
        speak(message);
      }

      return;
    }

    const message =
      "Please upload a PDF, TXT or Markdown study file.";

    setResponse(message);
    speak(message);
  };

  // ---------------- STUDY SUMMARY ----------------

  const createStudySummary = () => {
    if (!studyText.trim()) {
      const message =
        "Please upload study material or paste some text first.";

      setStudyResult(message);
      speak(message);

      return;
    }

    const cleanText =
      studyText
        .replace(/\s+/g, " ")
        .trim();

    const sentences =
      cleanText
        .split(/[.!?]\s+/)
        .filter(Boolean);

    const summary =
      sentences
        .slice(0, 5)
        .join(". ");

    const result =
      summary +
      (summary.endsWith(".")
        ? ""
        : ".") +
      "\n\nThis is a basic local summary. AI-powered summarization can be connected next.";

    setStudyResult(result);

    speak(
      result.slice(0, 2500)
    );
  };

  // ---------------- CLOSE FEATURE ----------------

  const closeFeature = () => {
    stopCamera();
    setActiveFeature(null);
  };

  // ---------------- STOP SPEAKING ----------------

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
  };

  // ---------------- CLEANUP ----------------

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });

        streamRef.current = null;
      }

      window.speechSynthesis?.cancel();
    };
  }, []);

  // ---------------- UI ----------------

  return (
    <div
      className={`app ${
        largeText ? "large-text" : ""
      } ${
        highContrast
          ? "high-contrast"
          : ""
      }`}
    >
      {/* NAVBAR */}

      <header className="navbar">
        <a
          href="#"
          className="brand"
        >
          <div className="brand-icon">
            ◉
          </div>

          <div>
            <h1>
              VisionAssist
            </h1>

            <span>
              Accessibility 2.0
            </span>
          </div>
        </a>

        <nav>
          <a href="#features">
            Features
          </a>

          <a href="#accessibility">
            Accessibility
          </a>

          <a href="#privacy">
            Privacy
          </a>
        </nav>

        <div className="language">
          <span>
            {selectedLanguage.flag}
          </span>

          <select
            value={
              selectedLanguage.code
            }
            onChange={
              handleLanguageChange
            }
            aria-label="Choose language"
          >
            {languages.map(
              (language) => (
                <option
                  key={
                    language.code
                  }
                  value={
                    language.code
                  }
                >
                  {language.name}
                </option>
              )
            )}
          </select>
        </div>
      </header>

      {/* HERO */}

      <main>
        <section className="hero">
          <div className="hero-content">
            <div className="eyebrow">
              <span className="status-dot"></span>
              VOICE-FIRST ACCESSIBILITY
            </div>

            <h2>
              Understand
              <br />
              <span>
                more.
              </span>
            </h2>

            <p className="hero-description">
              A voice-first AI companion
              designed to help you read,
              learn, understand and
              navigate digital
              information in your
              language.
            </p>

            <div className="hero-actions">
              <button
                className={`talk-button ${
                  isListening
                    ? "active"
                    : ""
                }`}
                onClick={
                  startListening
                }
              >
                <span className="mic">
                  {isListening
                    ? "🔴"
                    : "🎙️"}
                </span>

                {isListening
                  ? "Listening..."
                  : "Talk to VisionAssist"}
              </button>

              <a
                href="#features"
                className="explore-button"
              >
                Explore features
                <span>↓</span>
              </a>
            </div>

            <p className="language-note">
              <span>✓</span>
              Speaking in{" "}
              {selectedLanguage.name}
            </p>

            {transcript && (
              <div className="voice-result">
                <small>
                  You said
                </small>

                <p>
                  {transcript}
                </p>
              </div>
            )}

            {response && (
              <div className="voice-response">
                <div>
                  <span className="mini-dot"></span>
                  VisionAssist
                </div>

                <p>
                  {response}
                </p>

                <button
                  onClick={
                    stopSpeaking
                  }
                >
                  🔇 Stop voice
                </button>
              </div>
            )}
          </div>

          {/* ORB */}

          <div className="orb-area">
            <div className="orb-ring ring-three"></div>
            <div className="orb-ring ring-two"></div>
            <div className="orb-ring ring-one"></div>

            <div
              className={`voice-orb ${
                isListening
                  ? "orb-active"
                  : ""
              }`}
            >
              <div className="orb-core">
                <span>
                  {isListening
                    ? "◉"
                    : "✦"}
                </span>
              </div>
            </div>

            <div className="orb-label">
              <span className="mini-dot"></span>

              {isListening
                ? "Listening to you..."
                : "Ready when you are"}
            </div>
          </div>
        </section>

        {/* QUICK ACTIONS */}

        <section className="quick-section">
          <div className="section-heading">
            <span>
              START HERE
            </span>

            <h3>
              What would you like to do?
            </h3>
          </div>

          <div className="quick-grid">
            {quickFeatures.map(
              (item) => (
                <button
                  className="quick-card"
                  key={item.title}
                  onClick={() =>
                    handleQuickFeature(
                      item.title
                    )
                  }
                >
                  <div>
                    <strong>
                      {item.icon}{" "}
                      {item.title}
                    </strong>

                    <p>
                      {item.description}
                    </p>
                  </div>

                  <span className="arrow">
                    ↗
                  </span>
                </button>
              )
            )}
          </div>
        </section>

        {/* FEATURES */}

        <section
          className="features-section"
          id="features"
        >
          <div className="section-heading centered">
            <span>BUILT FOR REAL LIFE</span>

            <h3>
              One assistant. Many
              <br />
              possibilities.
            </h3>
          </div>

          <div className="feature-grid">
            {features.map((feature, index) => (
              <article
                className={`feature-card ${
                  index === 0 ? "featured" : ""
                }`}
                key={feature.title}
                onClick={() => {
  if (index === 1) {
    setActiveFeature("languages");
  } else {
    handleQuickFeature(feature.title);
  }
}}
              >
                <span className="feature-number">
                  0{index + 1}
                </span>

                <div className="feature-icon">
                  {feature.icon}
                </div>

                <h4>{feature.title}</h4>

                <p>{feature.text}</p>

                <span className="feature-tag">
                  {feature.tag}
                </span>
              </article>
            ))}
          </div>
        </section>

        {/* ACCESSIBILITY */}

        <section
          className="accessibility-section"
          id="accessibility"
        >
          <div>
            <div className="section-label">
              PERSONAL ACCESSIBILITY
            </div>

            <h3>
              Your settings.
              <br />
              <span>
                Your way.
              </span>
            </h3>

            <p>
              VisionAssist remembers
              accessibility preferences
              so users can interact with
              the experience in a way that
              feels comfortable.
            </p>
          </div>

          <div className="accessibility-controls">
            <button
              className={`setting ${
                largeText
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                setLargeText(
                  !largeText
                )
              }
            >
              <span>🔠</span>

              <div>
                <strong>
                  Large Text
                </strong>

                <small>
                  Increase interface text
                  size
                </small>
              </div>

              <i>
                {largeText
                  ? "ON"
                  : "OFF"}
              </i>
            </button>

            <button
              className={`setting ${
                highContrast
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                setHighContrast(
                  !highContrast
                )
              }
            >
              <span>◐</span>

              <div>
                <strong>
                  High Contrast
                </strong>

                <small>
                  Improve visual contrast
                </small>
              </div>

              <i>
                {highContrast
                  ? "ON"
                  : "OFF"}
              </i>
            </button>

            <button
              className="setting"
              onClick={() => {
                window.speechSynthesis.cancel();

                const message =
                  "Slow voice mode is ready. VisionAssist uses a comfortable speaking speed.";

                setResponse(
                  message
                );

                speak(message);
              }}
            >
              <span>🐢</span>

              <div>
                <strong>
                  Slow Voice
                </strong>

                <small>
                  Comfortable speech speed
                </small>
              </div>

              <i>
                READY
              </i>
            </button>
          </div>
        </section>

        {/* PRIVACY */}

        <section
          className="trust-section"
          id="privacy"
        >
          <div className="trust-icon">
            🔐
          </div>

          <div>
            <div className="section-label">
              RESPONSIBLE AI
            </div>

            <h3>
              Assistance with
              transparency.
            </h3>

            <p>
              VisionAssist is designed to
              communicate uncertainty
              instead of pretending to
              know everything. When AI is
              unsure, users can choose
              another way to verify
              information.
            </p>
          </div>

          <div className="uncertain">
            <span>
              AI UNCERTAINTY
            </span>

            <strong>
              “I'm not sure.”
            </strong>

            <small>
              Human / trusted helper
              fallback
            </small>
          </div>
        </section>
      </main>

      {/* FEATURE MODAL */}

      {activeFeature && (
        <div
          className="feature-overlay"
          onClick={
            closeFeature
          }
        >
          <div
            className="feature-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="close-feature"
              onClick={
                closeFeature
              }
            >
              ✕
            </button>

            {/* DOCUMENT */}

            {activeFeature ===
              "document" && (
              <div className="feature-panel">
                <div className="panel-icon">
                  📄
                </div>

                <h2>
                  Document Reader
                </h2>

                <p>
                  Upload a PDF or text
                  document and
                  VisionAssist will extract
                  the readable text.
                </p>

                <input
                  ref={
                    documentInputRef
                  }
                  type="file"
                  accept=".pdf,.txt,.md,application/pdf,text/plain"
                  onChange={
                    handleDocumentUpload
                  }
                  hidden
                />

                <button
                  className="panel-button"
                  onClick={() =>
                    documentInputRef.current?.click()
                  }
                >
                  📁 Upload Document
                </button>

                {isReadingDocument && (
                  <div className="panel-loading">
                    Reading document...
                  </div>
                )}

                {documentName && (
                  <div className="file-name">
                    📎{" "}
                    {documentName}
                  </div>
                )}

                {documentText && (
                  <div className="document-reader-box">
                    <div className="reader-heading">
                      <strong>
                        Extracted Text
                      </strong>

                      <button
                        onClick={
                          speakDocument
                        }
                      >
                        🔊 Read Aloud
                      </button>
                    </div>

                    <p>
                      {documentText}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* PRODUCT READER */}

            {activeFeature ===
              "product" && (
              <div className="feature-panel">
                <div className="panel-icon">
                  🛒
                </div>

                <h2>
                  Product Reader
                </h2>

                <p>
                  Point the camera at a
                  medicine bottle, food
                  package, cosmetic or
                  other product.
                  VisionAssist will read
                  visible product
                  information without
                  guessing.
                </p>

                <div className="camera-box">
                  {cameraActive ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                    />
                  ) : (
                    <div className="camera-placeholder">
                      🛒
                      <span>
                        Camera is off
                      </span>
                    </div>
                  )}
                </div>

                <div className="panel-actions">
                  {!cameraActive ? (
                    <button
                      className="panel-button"
                      onClick={
                        startCamera
                      }
                    >
                      📷 Start Product Camera
                    </button>
                  ) : (
                    <>
                      <button
                        className="panel-button"
                        onClick={
                          capturePhoto
                        }
                      >
                        📸 Capture Product
                      </button>

                      <button
                        className="panel-secondary"
                        onClick={
                          stopCamera
                        }
                      >
                        Stop Camera
                      </button>
                    </>
                  )}
                </div>

                {capturedImage && (
                  <div className="captured-box">
                    <h4>
                      📦 Captured Product
                    </h4>

                    <img
                      src={
                        capturedImage
                      }
                      alt="Captured product"
                    />

                    <button
                      className="panel-button"
                      onClick={() =>
                        analyzeImage(
                          "product"
                        )
                      }
                    >
                      🔍 Read Product
                    </button>

                    {imageAnalysis && (
                      <div className="image-analysis-result">
                        <h4>
                          🛒 Product
                          Information
                        </h4>

                        <p>
                          {imageAnalysis}
                        </p>

                        <button
                          className="panel-secondary"
                          onClick={() =>
                            speak(
                              imageAnalysis
                            )
                          }
                        >
                          🔊 Read Information
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* PRIVACY MODE */}

            {activeFeature ===
              "privacy" && (
              <div className="feature-panel">
                <div className="panel-icon">
                  🔐
                </div>

                <h2>
                  Privacy Mode
                </h2>

                <p>
                  You control temporary
                  information in this demo.
                  You can clear captured
                  images and generated
                  results at any time.
                </p>

                <button
                  className="panel-secondary"
                  onClick={() => {
                    setCapturedImage(
                      ""
                    );

                    setImageAnalysis(
                      ""
                    );

                    setDocumentText(
                      ""
                    );

                    setStudyText("");

                    setStudyResult("");

                    setResponse(
                      "Temporary information has been cleared."
                    );

                    speak(
                      "Temporary information has been cleared."
                    );
                  }}
                >
                  🗑️ Delete Temporary Data
                </button>
              </div>
            )}

            {/* TRUSTED HELPER */}

            {activeFeature ===
              "helper" && (
              <div className="feature-panel">
                <div className="panel-icon">
                  👨‍👩‍👧
                </div>

                <h2>
                  Trusted Helper
                </h2>

                <p>
                  Trusted Helper is a human
                  fallback concept. Review
                  the information yourself
                  before sharing anything
                  with another person.
                </p>

                <button
                  className="panel-button"
                  onClick={() => {
                    const message =
                      "Trusted Helper is ready. You can choose what information to share.";

                    setResponse(
                      message
                    );

                    speak(message);
                  }}
                >
                  🤝 Prepare Helper Request
                </button>
              </div>
            )}

            {/* CAMERA */}

            {activeFeature ===
              "camera" && (
              <div className="feature-panel">
                <div className="panel-icon">
                  📷
                </div>

                <h2>
                  What's Around Me?
                </h2>

                <p>
                  Use your camera to view
                  your surroundings.
                </p>

                <div className="camera-box">
                  {cameraActive ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                    />
                  ) : (
                    <div className="camera-placeholder">
                      📷
                      <span>
                        Camera is off
                      </span>
                    </div>
                  )}
                </div>

                <div className="panel-actions">
                  {!cameraActive ? (
                    <button
                      className="panel-button"
                      onClick={
                        startCamera
                      }
                    >
                      📷 Start Camera
                    </button>
                  ) : (
                    <>
                      <button
                        className="panel-button"
                        onClick={
                          capturePhoto
                        }
                      >
                        📸 Capture
                      </button>

                      <button
                        className="panel-secondary"
                        onClick={
                          stopCamera
                        }
                      >
                        Stop Camera
                      </button>
                    </>
                  )}
                </div>

                {capturedImage && (
                  <div className="captured-box">
                    <h4>
                      Captured Image
                    </h4>

                    <img
                      src={
                        capturedImage
                      }
                      alt="Captured surroundings"
                    />

                    {!imageAnalysis && (
                      <p>
                        Image captured
                        successfully. Click
                        "Analyze Image" to
                        analyze it.
                      </p>
                    )}

                    <button
                      className="panel-secondary"
                      onClick={() =>
                        analyzeImage(
                          "vision"
                        )
                      }
                    >
                      🔍 Analyze Image
                    </button>

                    {imageAnalysis && (
                      <div className="image-analysis-result">
                        <h4>
                          🤖 AI Analysis
                        </h4>

                        <p>
                          {imageAnalysis}
                        </p>

                        <button
                          className="panel-secondary"
                          onClick={() =>
                            speak(
                              imageAnalysis
                            )
                          }
                        >
                          🔊 Read Analysis
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SMART FORMS */}

            {activeFeature ===
              "forms" && (
              <div className="feature-panel">
                <div className="panel-icon">
                  📝
                </div>

                <h2>
                  Smart Forms
                </h2>

                <p>
                  Fill the fields below.
                  VisionAssist will tell
                  you if an important field
                  is missing.
                </p>

                <div className="smart-form">
                  <label>
                    Name

                    <input
                      value={formName}
                      onChange={(event) =>
                        setFormName(
                          event.target.value
                        )
                      }
                      placeholder="Enter your name"
                    />
                  </label>

                  <label>
                    Email

                    <input
                      value={formEmail}
                      onChange={(event) =>
                        setFormEmail(
                          event.target.value
                        )
                      }
                      placeholder="Enter your email"
                      type="email"
                    />
                  </label>

                  <label>
                    Phone

                    <input
                      value={formPhone}
                      onChange={(event) =>
                        setFormPhone(
                          event.target.value
                        )
                      }
                      placeholder="Enter your phone"
                      type="tel"
                    />
                  </label>

                  <button
                    className="panel-button"
                    onClick={
                      checkForm
                    }
                  >
                    ✓ Check My Form
                  </button>

                  {formMessage && (
                    <div className="form-result">
                      {formMessage}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STUDY MODE */}

            {activeFeature ===
              "study" && (
              <div className="feature-panel">
                <div className="panel-icon">
                  🎓
                </div>

                <h2>
                  Study Mode
                </h2>

                <p>
                  Upload a study PDF/TXT
                  file or paste your study
                  material below.
                </p>

                <input
                  ref={
                    studyInputRef
                  }
                  type="file"
                  accept=".pdf,.txt,.md,application/pdf,text/plain"
                  onChange={
                    handleStudyUpload
                  }
                  hidden
                />

                <button
                  className="panel-button"
                  onClick={() =>
                    studyInputRef.current?.click()
                  }
                >
                  📚 Upload Study Material
                </button>

                {studyFileName && (
                  <div className="file-name">
                    📎{" "}
                    {studyFileName}
                  </div>
                )}

                <textarea
                  className="study-textarea"
                  value={studyText}
                  onChange={(event) =>
                    setStudyText(
                      event.target.value
                    )
                  }
                  placeholder="Or paste your study material here..."
                />

                <button
                  className="panel-button"
                  onClick={
                    createStudySummary
                  }
                >
                  ✨ Create Summary
                </button>

                {studyResult && (
                  <div className="study-result">
                    <h4>
                      Study Summary
                    </h4>

                    <p>
                      {studyResult}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* INDIAN LANGUAGES */}

            {activeFeature ===
              "languages" && (
              <div className="feature-panel">
                <div className="panel-icon">
                  🌐
                </div>

                <h2>
                  Indian Languages
                </h2>

                <p>
                  Choose the language that
                  feels natural to you.
                  VisionAssist currently
                  supports 11 languages.
                </p>

                <div className="language-options">
                  {languages.map(
                    (language) => (
                      <button
                        key={
                          language.code
                        }
                        className={
                          selectedLanguage.code ===
                          language.code
                            ? "language-option selected"
                            : "language-option"
                        }
                        onClick={() => {
                          setSelectedLanguage(
                            language
                          );

                          const message =
                            language.name ===
                            "English"
                              ? "English language selected."
                              : `${language.name} language selected.`;

                          setResponse(
                            message
                          );

                          setTimeout(
                            () => {
                              speak(
                                message,
                                language
                              );
                            },
                            100
                          );
                        }}
                      >
                        <span className="language-flag">
                          {
                            language.flag
                          }
                        </span>

                        <span>
                          {
                            language.name
                          }
                        </span>

                        {selectedLanguage.code ===
                          language.code && (
                          <span className="language-check">
                            ✓
                          </span>
                        )}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}

      <footer>
        <div className="brand">
          <div className="brand-icon">
            ◉
          </div>

          <div>
            <strong>
              VisionAssist 2.0
            </strong>

            <span>
              Inclusive technology
            </span>
          </div>
        </div>

        <p>
          Built for reading · learning ·
          understanding · navigating
        </p>
      </footer>
    </div>
  );
}

export default App;