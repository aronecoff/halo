/**
 * Silent background device scan.
 * Extracts ALL available browser signals without any UI.
 * Called once when user starts the IRIS conversation.
 * Results are stored and merged into the profile at finalization.
 */

export interface SilentScanResult {
  device: {
    language: string;
    languages: string[];
    timezone: string;
    timezoneOffset: number;
    platform: string;
    userAgent: string;
    vendor: string;
    screenWidth: number;
    screenHeight: number;
    availWidth: number;
    availHeight: number;
    innerWidth: number;
    innerHeight: number;
    devicePixelRatio: number;
    touchCapable: boolean;
    maxTouchPoints: number;
    colorDepth: number;
    pixelDepth: number;
    hardwareConcurrency: number | null;
    deviceMemory: number | null;
    connectionType: string | null;
    connectionDownlink: number | null;
    connectionRtt: number | null;
    connectionSaveData: boolean | null;
    online: boolean;
    darkMode: boolean;
    highContrast: boolean;
    reducedMotion: boolean;
    reducedTransparency: boolean;
    prefersColorScheme: string;
    localHour: number;
    localMinute: number;
    dayOfWeek: string;
    doNotTrack: string | null;
    pdfViewerEnabled: boolean;
    cookieEnabled: boolean;
    javaEnabled: boolean;
  };
  screen: {
    orientation: string | null;
    orientationAngle: number | null;
    colorGamut: string;
    hdr: boolean;
    forcedColors: boolean;
  };
  gpu: {
    renderer: string | null;
    vendor: string | null;
    maxTextureSize: number | null;
    maxViewportDims: number[] | null;
    extensions: number;
    shadingLanguageVersion: string | null;
  };
  audio: {
    sampleRate: number | null;
    maxChannelCount: number | null;
    state: string | null;
  };
  fonts: {
    detected: string[];
    totalChecked: number;
  };
  canvas: {
    hash: string | null;
  };
  battery: {
    charging: boolean | null;
    level: number | null;
    chargingTime: number | null;
    dischargingTime: number | null;
  };
  permissions: {
    notifications: string | null;
    camera: string | null;
    microphone: string | null;
    geolocation: string | null;
    clipboard: string | null;
  };
  apis: {
    speechSynthesisVoices: number;
    serviceWorkerSupported: boolean;
    webGLSupported: boolean;
    webGL2Supported: boolean;
    webRTCSupported: boolean;
    bluetoothSupported: boolean;
    usbSupported: boolean;
    gamepadsSupported: boolean;
    webShareSupported: boolean;
    vibrationSupported: boolean;
    webAuthNSupported: boolean;
    paymentRequestSupported: boolean;
    idleDetectionSupported: boolean;
    contactPickerSupported: boolean;
  };
  performance: {
    navigationStart: number | null;
    domContentLoaded: number | null;
    loadComplete: number | null;
    memoryUsedMB: number | null;
    memoryTotalMB: number | null;
    memoryLimitMB: number | null;
  };
  storage: {
    localStorageEntries: number;
    localStorageKeys: string[];
    sessionStorageEntries: number;
    cookieCount: number;
    indexedDBDatabases: string[];
    storageEstimate: { usage: number | null; quota: number | null };
  };
  media: {
    videoFormats: string[];
    audioFormats: string[];
    mediaSources: string[];
    inputDeviceCount: number | null;
    outputDeviceCount: number | null;
  };
  behavior: {
    scrollY: number;
    historyLength: number;
    referrer: string;
    documentVisibility: string;
    windowFocused: boolean;
  };
  location: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    altitude: number | null;
    speed: number | null;
    heading: number | null;
    city: string | null;
    region: string | null;
    country: string | null;
    postalCode: string | null;
  } | null;
  platform: "web";
  deviceTimestamp: string;
  scanDurationMs: number;
}

export async function runSilentScan(): Promise<SilentScanResult> {
  const startTime = performance.now();
  const nav = navigator as any;

  // === DEVICE SIGNALS (instant, no permission needed) ===
  const device = {
    language: navigator.language,
    languages: Array.from(navigator.languages || []),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    platform: navigator.platform || "unknown",
    userAgent: navigator.userAgent,
    vendor: navigator.vendor || "unknown",
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
    touchCapable: "ontouchstart" in window || navigator.maxTouchPoints > 0,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    colorDepth: window.screen.colorDepth,
    pixelDepth: window.screen.pixelDepth || window.screen.colorDepth,
    hardwareConcurrency: navigator.hardwareConcurrency || null,
    deviceMemory: nav.deviceMemory || null,
    connectionType: nav.connection?.effectiveType || null,
    connectionDownlink: nav.connection?.downlink || null,
    connectionRtt: nav.connection?.rtt || null,
    connectionSaveData: nav.connection?.saveData ?? null,
    online: navigator.onLine,
    darkMode: window.matchMedia?.("(prefers-color-scheme: dark)")?.matches || false,
    highContrast: window.matchMedia?.("(forced-colors: active)")?.matches || false,
    reducedMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches || false,
    reducedTransparency: window.matchMedia?.("(prefers-reduced-transparency: reduce)")?.matches || false,
    prefersColorScheme: window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light",
    localHour: new Date().getHours(),
    localMinute: new Date().getMinutes(),
    dayOfWeek: new Date().toLocaleDateString("en", { weekday: "long" }),
    doNotTrack: navigator.doNotTrack || (window as any).doNotTrack || null,
    pdfViewerEnabled: nav.pdfViewerEnabled ?? false,
    cookieEnabled: navigator.cookieEnabled,
    javaEnabled: false,
  };
  try { device.javaEnabled = navigator.javaEnabled?.() || false; } catch {}

  // === SCREEN DETAILS ===
  const screenInfo = {
    orientation: null as string | null,
    orientationAngle: null as number | null,
    colorGamut: "srgb",
    hdr: false,
    forcedColors: false,
  };
  try {
    screenInfo.orientation = screen.orientation?.type || null;
    screenInfo.orientationAngle = screen.orientation?.angle ?? null;
  } catch {}
  if (window.matchMedia?.("(color-gamut: p3)")?.matches) screenInfo.colorGamut = "p3";
  else if (window.matchMedia?.("(color-gamut: rec2020)")?.matches) screenInfo.colorGamut = "rec2020";
  screenInfo.hdr = window.matchMedia?.("(dynamic-range: high)")?.matches || false;
  screenInfo.forcedColors = window.matchMedia?.("(forced-colors: active)")?.matches || false;

  // === GPU / WEBGL (reveals graphics card) ===
  const gpu = {
    renderer: null as string | null,
    vendor: null as string | null,
    maxTextureSize: null as number | null,
    maxViewportDims: null as number[] | null,
    extensions: 0,
    shadingLanguageVersion: null as string | null,
  };
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl") as any;
    if (gl) {
      const dbg = gl.getExtension("WEBGL_debug_renderer_info");
      if (dbg) {
        gpu.renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
        gpu.vendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL);
      }
      gpu.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
      gpu.maxViewportDims = Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS));
      gpu.extensions = (gl.getSupportedExtensions() || []).length;
      gpu.shadingLanguageVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
    }
  } catch {}

  // === AUDIO CONTEXT (reveals audio hardware) ===
  const audio = {
    sampleRate: null as number | null,
    maxChannelCount: null as number | null,
    state: null as string | null,
  };
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audio.sampleRate = ctx.sampleRate;
    audio.maxChannelCount = ctx.destination.maxChannelCount;
    audio.state = ctx.state;
    ctx.close().catch(() => {});
  } catch {}

  // === FONT DETECTION (reveals installed software) ===
  const fonts = await detectFonts();

  // === CANVAS FINGERPRINT (unique rendering signature) ===
  const canvasHash = getCanvasFingerprint();

  // === BATTERY STATUS ===
  const battery = {
    charging: null as boolean | null,
    level: null as number | null,
    chargingTime: null as number | null,
    dischargingTime: null as number | null,
  };
  try {
    if (nav.getBattery) {
      const batt = await nav.getBattery();
      battery.charging = batt.charging;
      battery.level = batt.level;
      battery.chargingTime = batt.chargingTime === Infinity ? -1 : batt.chargingTime;
      battery.dischargingTime = batt.dischargingTime === Infinity ? -1 : batt.dischargingTime;
    }
  } catch {}

  // === PERMISSION STATES ===
  const permissions = {
    notifications: null as string | null,
    camera: null as string | null,
    microphone: null as string | null,
    geolocation: null as string | null,
    clipboard: null as string | null,
  };
  try {
    const checkPerm = async (name: string) => {
      try {
        const status = await navigator.permissions.query({ name: name as PermissionName });
        return status.state;
      } catch { return null; }
    };
    permissions.notifications = await checkPerm("notifications");
    permissions.camera = await checkPerm("camera");
    permissions.microphone = await checkPerm("microphone");
    permissions.geolocation = await checkPerm("geolocation");
    permissions.clipboard = await checkPerm("clipboard-read");
  } catch {}

  // === API AVAILABILITY (reveals device capabilities) ===
  const apis = {
    speechSynthesisVoices: 0,
    serviceWorkerSupported: "serviceWorker" in navigator,
    webGLSupported: !!document.createElement("canvas").getContext("webgl"),
    webGL2Supported: !!document.createElement("canvas").getContext("webgl2"),
    webRTCSupported: !!(window as any).RTCPeerConnection,
    bluetoothSupported: !!(nav.bluetooth),
    usbSupported: !!(nav.usb),
    gamepadsSupported: !!navigator.getGamepads,
    webShareSupported: !!navigator.share,
    vibrationSupported: !!navigator.vibrate,
    webAuthNSupported: !!(nav.credentials?.create),
    paymentRequestSupported: !!(window as any).PaymentRequest,
    idleDetectionSupported: !!(window as any).IdleDetector,
    contactPickerSupported: !!nav.contacts,
  };
  try {
    const voices = window.speechSynthesis?.getVoices?.() || [];
    apis.speechSynthesisVoices = voices.length;
    // Voices load async on some browsers
    if (voices.length === 0 && window.speechSynthesis) {
      await new Promise<void>((resolve) => {
        window.speechSynthesis.onvoiceschanged = () => {
          apis.speechSynthesisVoices = window.speechSynthesis.getVoices().length;
          resolve();
        };
        setTimeout(resolve, 500);
      });
    }
  } catch {}

  // === PERFORMANCE DATA ===
  const perf = {
    navigationStart: null as number | null,
    domContentLoaded: null as number | null,
    loadComplete: null as number | null,
    memoryUsedMB: null as number | null,
    memoryTotalMB: null as number | null,
    memoryLimitMB: null as number | null,
  };
  try {
    const timing = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    if (timing) {
      perf.navigationStart = Math.round(timing.startTime);
      perf.domContentLoaded = Math.round(timing.domContentLoadedEventEnd);
      perf.loadComplete = Math.round(timing.loadEventEnd);
    }
    const mem = (performance as any).memory;
    if (mem) {
      perf.memoryUsedMB = Math.round(mem.usedJSHeapSize / 1048576);
      perf.memoryTotalMB = Math.round(mem.totalJSHeapSize / 1048576);
      perf.memoryLimitMB = Math.round(mem.jsHeapSizeLimit / 1048576);
    }
  } catch {}

  // === STORAGE DEEP SCAN ===
  const storage = {
    localStorageEntries: 0,
    localStorageKeys: [] as string[],
    sessionStorageEntries: 0,
    cookieCount: 0,
    indexedDBDatabases: [] as string[],
    storageEstimate: { usage: null as number | null, quota: null as number | null },
  };
  try { storage.localStorageEntries = localStorage.length; } catch {}
  try {
    for (let i = 0; i < Math.min(localStorage.length, 100); i++) {
      const key = localStorage.key(i);
      if (key) storage.localStorageKeys.push(key);
    }
  } catch {}
  try { storage.sessionStorageEntries = sessionStorage.length; } catch {}
  try { storage.cookieCount = document.cookie.split(";").filter(c => c.trim()).length; } catch {}
  try {
    if ((window as any).indexedDB?.databases) {
      const dbs = await (window as any).indexedDB.databases();
      storage.indexedDBDatabases = dbs.map((db: any) => db.name).filter(Boolean);
    }
  } catch {}
  try {
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      storage.storageEstimate.usage = est.usage || null;
      storage.storageEstimate.quota = est.quota || null;
    }
  } catch {}

  // === MEDIA CAPABILITIES ===
  const media = {
    videoFormats: [] as string[],
    audioFormats: [] as string[],
    mediaSources: [] as string[],
    inputDeviceCount: null as number | null,
    outputDeviceCount: null as number | null,
  };
  try {
    const videoTests = ["video/mp4", "video/webm", "video/ogg", "video/avi", "video/quicktime"];
    const audioTests = ["audio/mp3", "audio/wav", "audio/ogg", "audio/aac", "audio/flac", "audio/webm"];
    const v = document.createElement("video");
    const a = document.createElement("audio");
    media.videoFormats = videoTests.filter(f => v.canPlayType(f) !== "");
    media.audioFormats = audioTests.filter(f => a.canPlayType(f) !== "");
  } catch {}
  try {
    if ((window as any).MediaSource) {
      const mimeTests = ["video/mp4; codecs=\"avc1.42E01E\"", "video/webm; codecs=\"vp8\"", "video/webm; codecs=\"vp9\"", "audio/webm; codecs=\"opus\""];
      media.mediaSources = mimeTests.filter(m => (window as any).MediaSource.isTypeSupported(m));
    }
  } catch {}
  try {
    if (navigator.mediaDevices?.enumerateDevices) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      media.inputDeviceCount = devices.filter(d => d.kind === "audioinput" || d.kind === "videoinput").length;
      media.outputDeviceCount = devices.filter(d => d.kind === "audiooutput").length;
    }
  } catch {}

  // === BEHAVIORAL SIGNALS ===
  const behavior = {
    scrollY: window.scrollY || 0,
    historyLength: window.history.length,
    referrer: document.referrer || "",
    documentVisibility: document.visibilityState,
    windowFocused: document.hasFocus(),
  };

  // === GEOLOCATION (browser shows its own prompt) ===
  let location: SilentScanResult["location"] = null;
  try {
    location = await new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const result: any = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy || null,
            altitude: pos.coords.altitude || null,
            speed: pos.coords.speed || null,
            heading: pos.coords.heading || null,
            city: null,
            region: null,
            country: null,
            postalCode: null,
          };
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&zoom=14&addressdetails=1`,
              { headers: { "User-Agent": "HALO-App/1.0" } }
            );
            const geo = await res.json();
            result.city = geo.address?.city || geo.address?.town || geo.address?.village || null;
            result.region = geo.address?.state || null;
            result.country = geo.address?.country || null;
            result.postalCode = geo.address?.postcode || null;
          } catch {}
          resolve(result);
        },
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  } catch {
    location = null;
  }

  return {
    device,
    screen: screenInfo,
    gpu,
    audio,
    fonts,
    canvas: { hash: canvasHash },
    battery,
    permissions,
    apis,
    performance: perf,
    storage,
    media,
    behavior,
    location,
    platform: "web",
    deviceTimestamp: new Date().toISOString(),
    scanDurationMs: Math.round(performance.now() - startTime),
  };
}

// === FONT DETECTION ===
// Measures text rendering width to determine which fonts are installed
async function detectFonts(): Promise<{ detected: string[]; totalChecked: number }> {
  const testFonts = [
    // System & common
    "Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana", "Georgia",
    "Palatino", "Garamond", "Bookman", "Tahoma", "Trebuchet MS", "Impact",
    "Comic Sans MS", "Lucida Console", "Lucida Sans Unicode", "Century Gothic",
    // Design / creative
    "Futura", "Gill Sans", "Optima", "Didot", "Baskerville", "Bodoni MT",
    "Rockwell", "Copperplate", "Papyrus", "Brush Script MT",
    // Apple
    "SF Pro", "SF Mono", "Menlo", "Monaco", "Avenir", "Avenir Next",
    "Helvetica Neue", "Apple Color Emoji", "San Francisco",
    // Microsoft
    "Segoe UI", "Calibri", "Cambria", "Consolas", "Candara", "Constantia",
    "Corbel", "Franklin Gothic", "Bahnschrift",
    // Google / Android
    "Roboto", "Noto Sans", "Noto Serif", "Droid Sans", "Open Sans", "Lato",
    // Adobe
    "Myriad Pro", "Minion Pro", "Source Sans Pro", "Source Code Pro",
    // CJK
    "SimSun", "SimHei", "MS Gothic", "MS Mincho", "Yu Gothic",
    "Hiragino Sans", "PingFang SC", "Microsoft YaHei",
    // Coding
    "Fira Code", "JetBrains Mono", "Cascadia Code", "IBM Plex Mono",
    "Inconsolata", "Anonymous Pro", "Hack",
  ];

  const detected: string[] = [];
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return { detected: [], totalChecked: testFonts.length };

    const testString = "mmmmmmmmmmwwwwwwwwww";
    const baseFonts = ["monospace", "sans-serif", "serif"];
    const baseWidths: Record<string, number> = {};

    for (const base of baseFonts) {
      ctx.font = `72px ${base}`;
      baseWidths[base] = ctx.measureText(testString).width;
    }

    for (const font of testFonts) {
      let isDetected = false;
      for (const base of baseFonts) {
        ctx.font = `72px '${font}', ${base}`;
        const width = ctx.measureText(testString).width;
        if (width !== baseWidths[base]) {
          isDetected = true;
          break;
        }
      }
      if (isDetected) detected.push(font);
    }
  } catch {}

  return { detected, totalChecked: testFonts.length };
}

// === CANVAS FINGERPRINT ===
// Renders specific shapes and text, generates a hash from the pixel data
function getCanvasFingerprint(): string | null {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 280;
    canvas.height = 60;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Render text with varying fonts and colors
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("HALO fingerprint ♈ ≠ ∞", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("HALO fingerprint ♈ ≠ ∞", 4, 17);

    // Draw geometric shapes
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = "rgb(255,0,255)";
    ctx.beginPath();
    ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgb(0,255,255)";
    ctx.beginPath();
    ctx.arc(100, 50, 50, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgb(255,255,0)";
    ctx.beginPath();
    ctx.arc(75, 25, 50, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();

    // Simple hash of the data URL
    const dataUrl = canvas.toDataURL();
    let hash = 0;
    for (let i = 0; i < dataUrl.length; i++) {
      const char = dataUrl.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  } catch {
    return null;
  }
}
