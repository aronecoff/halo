import { NextResponse } from "next/server";
import { SCAN_ANALYSIS_PROMPT } from "@/lib/scan-analysis-prompt";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // Rate limit by IP — 5 requests per minute (scan happens once per session)
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const limit = rateLimit(`scan:${ip}`, { maxRequests: 5, windowMs: 60_000 });
    if (!limit.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const { scanData } = body;

    if (!scanData) {
      return NextResponse.json(
        { error: "scanData is required" },
        { status: 400 }
      );
    }

    // Build a structured description of the scan data for Claude
    const dataDescription = buildDataDescription(scanData);

    // Call Claude directly via fetch
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SCAN_ANALYSIS_PROMPT,
        messages: [
          {
            role: "user",
            content: `Analyze this device scan data and build a personality profile:\n\n${dataDescription}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Anthropic API error:", response.status, errBody);
      return NextResponse.json(
        { error: `Anthropic API error: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const textBlock = data.content?.find((block: any) => block.type === "text");
    if (!textBlock) {
      return NextResponse.json(
        { error: "No text response from model" },
        { status: 500 }
      );
    }

    // Parse JSON response
    let parsed;
    try {
      let rawText = textBlock.text.trim();
      if (rawText.startsWith("```")) {
        rawText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      parsed = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse model response as JSON" },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile: parsed });
  } catch (error: unknown) {
    console.error("Scan analyze error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildDataDescription(scanData: any): string {
  const parts: string[] = [];

  parts.push(`Platform: ${scanData.platform || "unknown"}`);
  parts.push(`Scan timestamp: ${scanData.deviceTimestamp || "unknown"}`);
  if (scanData.scanDurationMs) parts.push(`Scan completed in: ${scanData.scanDurationMs}ms`);
  if (scanData.userName) parts.push(`User name: ${scanData.userName}`);

  // === Mobile-style data (contacts, photos) ===
  if (scanData.contacts) {
    const c = scanData.contacts;
    parts.push(`\n--- CONTACTS ---`);
    parts.push(`Total contacts: ${c.totalContacts}`);
    parts.push(`With phone numbers: ${c.withPhone}`);
    parts.push(`With email addresses: ${c.withEmail}`);
    parts.push(`With profile photos: ${c.withImage}`);
    parts.push(`Inner circle: ${c.frequencyCategories?.innerCircle}`);
    parts.push(`Outer circle: ${c.frequencyCategories?.outerCircle}`);
    parts.push(`Acquaintances: ${c.frequencyCategories?.acquaintances}`);
  }

  if (scanData.photos) {
    const p = scanData.photos;
    parts.push(`\n--- PHOTOS & MEDIA ---`);
    parts.push(`Total photos: ${p.totalPhotos}, videos: ${p.totalVideos}`);
    parts.push(`Monthly average: ${p.monthlyAverage} photos/month`);
    parts.push(`Location clusters: ${p.locationClusters}`);
  }

  // === Web browser data ===
  if (scanData.device) {
    const d = scanData.device;
    parts.push(`\n--- DEVICE & IDENTITY ---`);
    parts.push(`User agent: ${d.userAgent || "unknown"}`);
    parts.push(`Platform: ${d.platform}, Vendor: ${d.vendor || "unknown"}`);
    parts.push(`Language: ${d.language}, All: ${Array.isArray(d.languages) ? d.languages.join(", ") : d.language}`);
    parts.push(`Timezone: ${d.timezone} (UTC offset: ${d.timezoneOffset} min)`);
    parts.push(`Screen: ${d.screenWidth}×${d.screenHeight}, available: ${d.availWidth || "?"}×${d.availHeight || "?"}`);
    parts.push(`Browser viewport: ${d.innerWidth || "?"}×${d.innerHeight || "?"}`);
    parts.push(`Pixel ratio: ${d.devicePixelRatio}x, Color depth: ${d.colorDepth}, Pixel depth: ${d.pixelDepth || d.colorDepth}`);
    parts.push(`Touch: ${d.touchCapable} (max points: ${d.maxTouchPoints || 0})`);
    if (d.hardwareConcurrency) parts.push(`CPU threads: ${d.hardwareConcurrency}`);
    if (d.deviceMemory) parts.push(`Device memory: ${d.deviceMemory}GB`);
    parts.push(`Connection: ${d.connectionType || "unknown"}, downlink: ${d.connectionDownlink || "?"}Mbps, RTT: ${d.connectionRtt || "?"}ms`);
    if (d.connectionSaveData) parts.push(`Data saver mode: ON`);
    parts.push(`Online: ${d.online}`);
    parts.push(`Dark mode: ${d.darkMode}, High contrast: ${d.highContrast || false}`);
    parts.push(`Reduced motion: ${d.reducedMotion}, Reduced transparency: ${d.reducedTransparency || false}`);
    parts.push(`Do Not Track: ${d.doNotTrack || "unset"}`);
    parts.push(`Cookies enabled: ${d.cookieEnabled}, PDF viewer: ${d.pdfViewerEnabled || false}`);
    parts.push(`Active at: ${d.dayOfWeek} ${d.localHour}:${String(d.localMinute || 0).padStart(2, "0")} local time`);
  }

  if (scanData.screen) {
    const s = scanData.screen;
    parts.push(`\n--- DISPLAY ---`);
    parts.push(`Orientation: ${s.orientation || "unknown"} (${s.orientationAngle || 0}°)`);
    parts.push(`Color gamut: ${s.colorGamut || "srgb"}, HDR: ${s.hdr || false}`);
    if (s.forcedColors) parts.push(`Forced colors (accessibility): ON`);
  }

  if (scanData.gpu) {
    const g = scanData.gpu;
    parts.push(`\n--- GPU / GRAPHICS ---`);
    if (g.renderer) parts.push(`GPU renderer: ${g.renderer}`);
    if (g.vendor) parts.push(`GPU vendor: ${g.vendor}`);
    if (g.maxTextureSize) parts.push(`Max texture: ${g.maxTextureSize}px`);
    if (g.maxViewportDims) parts.push(`Max viewport: ${g.maxViewportDims.join("×")}px`);
    parts.push(`WebGL extensions: ${g.extensions || 0}`);
    if (g.shadingLanguageVersion) parts.push(`Shading language: ${g.shadingLanguageVersion}`);
  }

  if (scanData.audio) {
    const a = scanData.audio;
    parts.push(`\n--- AUDIO HARDWARE ---`);
    if (a.sampleRate) parts.push(`Sample rate: ${a.sampleRate}Hz`);
    if (a.maxChannelCount) parts.push(`Max channels: ${a.maxChannelCount}`);
  }

  if (scanData.fonts) {
    parts.push(`\n--- INSTALLED FONTS ---`);
    parts.push(`Detected ${scanData.fonts.detected?.length || 0} of ${scanData.fonts.totalChecked || 0} tested`);
    if (scanData.fonts.detected?.length) {
      parts.push(`Fonts: ${scanData.fonts.detected.join(", ")}`);
    }
  }

  if (scanData.canvas) {
    parts.push(`\n--- CANVAS FINGERPRINT ---`);
    parts.push(`Hash: ${scanData.canvas.hash || "unavailable"}`);
  }

  if (scanData.battery) {
    const b = scanData.battery;
    parts.push(`\n--- BATTERY ---`);
    if (b.level !== null) parts.push(`Level: ${Math.round(b.level * 100)}%, Charging: ${b.charging}`);
  }

  if (scanData.permissions) {
    const p = scanData.permissions;
    parts.push(`\n--- PERMISSION STATES ---`);
    parts.push(`Notifications: ${p.notifications || "unknown"}`);
    parts.push(`Camera: ${p.camera || "unknown"}, Microphone: ${p.microphone || "unknown"}`);
    parts.push(`Geolocation: ${p.geolocation || "unknown"}`);
    parts.push(`Clipboard: ${p.clipboard || "unknown"}`);
  }

  if (scanData.apis) {
    const a = scanData.apis;
    parts.push(`\n--- DEVICE CAPABILITIES ---`);
    const capabilities = [];
    if (a.webGLSupported) capabilities.push("WebGL");
    if (a.webGL2Supported) capabilities.push("WebGL2");
    if (a.webRTCSupported) capabilities.push("WebRTC");
    if (a.bluetoothSupported) capabilities.push("Bluetooth");
    if (a.usbSupported) capabilities.push("USB");
    if (a.gamepadsSupported) capabilities.push("Gamepad");
    if (a.webShareSupported) capabilities.push("WebShare");
    if (a.vibrationSupported) capabilities.push("Vibration");
    if (a.webAuthNSupported) capabilities.push("WebAuthn");
    if (a.paymentRequestSupported) capabilities.push("PaymentRequest");
    if (a.serviceWorkerSupported) capabilities.push("ServiceWorker");
    if (a.contactPickerSupported) capabilities.push("ContactPicker");
    parts.push(`Supported APIs: ${capabilities.join(", ") || "none detected"}`);
    if (a.speechSynthesisVoices) parts.push(`Speech synthesis voices: ${a.speechSynthesisVoices}`);
  }

  if (scanData.performance) {
    const p = scanData.performance;
    parts.push(`\n--- PERFORMANCE ---`);
    if (p.domContentLoaded) parts.push(`DOM loaded: ${p.domContentLoaded}ms`);
    if (p.loadComplete) parts.push(`Page load: ${p.loadComplete}ms`);
    if (p.memoryUsedMB) parts.push(`JS memory: ${p.memoryUsedMB}MB used / ${p.memoryTotalMB}MB total (limit: ${p.memoryLimitMB}MB)`);
  }

  if (scanData.storage) {
    const s = scanData.storage;
    parts.push(`\n--- DIGITAL FOOTPRINT ---`);
    parts.push(`LocalStorage: ${s.localStorageEntries} entries`);
    if (s.localStorageKeys?.length) parts.push(`Storage keys: ${s.localStorageKeys.slice(0, 30).join(", ")}`);
    parts.push(`SessionStorage: ${s.sessionStorageEntries || 0} entries`);
    parts.push(`Cookies: ${s.cookieCount}`);
    if (s.indexedDBDatabases?.length) parts.push(`IndexedDB databases: ${s.indexedDBDatabases.join(", ")}`);
    if (s.storageEstimate?.usage) parts.push(`Storage usage: ${Math.round(s.storageEstimate.usage / 1048576)}MB / ${Math.round((s.storageEstimate.quota || 0) / 1048576)}MB quota`);
  }

  if (scanData.media) {
    const m = scanData.media;
    parts.push(`\n--- MEDIA CAPABILITIES ---`);
    if (m.videoFormats?.length) parts.push(`Video formats: ${m.videoFormats.join(", ")}`);
    if (m.audioFormats?.length) parts.push(`Audio formats: ${m.audioFormats.join(", ")}`);
    if (m.mediaSources?.length) parts.push(`Media sources: ${m.mediaSources.join(", ")}`);
    if (m.inputDeviceCount !== null) parts.push(`Input devices: ${m.inputDeviceCount}, Output devices: ${m.outputDeviceCount}`);
  }

  if (scanData.behavior) {
    const b = scanData.behavior;
    parts.push(`\n--- BEHAVIORAL CONTEXT ---`);
    parts.push(`Browser history depth: ${b.historyLength} entries`);
    if (b.referrer) parts.push(`Referrer: ${b.referrer}`);
    parts.push(`Page visibility: ${b.documentVisibility}, Window focused: ${b.windowFocused}`);
  }

  // === Location ===
  if (scanData.location) {
    const l = scanData.location;
    parts.push(`\n--- LOCATION ---`);
    if (l.city) {
      parts.push(`City: ${l.city}, ${l.region || ""}, ${l.country || ""}`);
      if (l.postalCode) parts.push(`Postal code: ${l.postalCode}`);
    }
    if (l.latitude) parts.push(`Coordinates: ${l.latitude.toFixed(6)}, ${l.longitude.toFixed(6)}`);
    if (l.accuracy) parts.push(`Accuracy: ${Math.round(l.accuracy)}m`);
    if (l.altitude) parts.push(`Altitude: ${Math.round(l.altitude)}m`);
    if (l.speed) parts.push(`Speed: ${l.speed}m/s`);
  } else {
    parts.push(`\n--- LOCATION ---`);
    parts.push(`Access denied or unavailable`);
  }

  return parts.join("\n");
}
