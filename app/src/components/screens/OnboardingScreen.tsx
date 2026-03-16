"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { HaloMark, ScreenWrap, ChatBubble, TypingIndicator } from "@/components/ui";

interface OnboardingScreenProps {
  userName: string;
  onNext: () => void;
  onProfileReady: (profile: any, conversation: Array<{ role: string; content: string }>) => void;
  scanData?: any;
}

interface DisplayMessage {
  sender: "iris" | "user" | "system";
  text: string;
  isInferenceCallout?: boolean;
}

export function OnboardingScreen({ userName, onNext, onProfileReady, scanData }: OnboardingScreenProps) {
  const firstName = userName.trim().split(" ")[0];

  // Build a human-readable description of scan data for IRIS context
  const scanContext = useMemo(() => {
    if (!scanData) return undefined;
    return buildScanContext(scanData);
  }, [scanData]);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [apiMessages, setApiMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [typing, setTyping] = useState(false);
  const [inputText, setInputText] = useState("");
  const [qNum, setQNum] = useState(0);
  const [done, setDone] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasStarted = useRef(false);

  const scrollDown = useCallback(() => {
    setTimeout(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, 60);
  }, []);

  // Send first message to IRIS on mount
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    async function initChat() {
      setTyping(true);
      scrollDown();
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: `My name is ${firstName}. I just signed up for HALO.` }],
            scanContext,
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const irisMsg = data.message || "Hey. I am IRIS, your agent. I am going to learn who you are well enough to find people worth meeting. Not through a quiz. Just talk to me.";
        setMessages([{ sender: "iris", text: irisMsg }]);
        setApiMessages([
          { role: "user", content: `My name is ${firstName}. I just signed up for HALO.` },
          { role: "assistant", content: JSON.stringify(data) },
        ]);
        setQNum(1);
        if (data.inference) {
          setMessages(prev => [...prev, { sender: "system", text: `Detected: ${data.inference.trait} (${data.inference.domain})`, isInferenceCallout: true }]);
        }
      } catch (e) {
        setMessages([{ sender: "iris", text: `Hey, ${firstName}. I am IRIS, your agent. I am going to learn who you are well enough to find people worth meeting. Not through a quiz. Just talk to me. What is something you could spend hours doing without noticing time pass?` }]);
        setApiMessages([
          { role: "user", content: `My name is ${firstName}. I just signed up for HALO.` },
          { role: "assistant", content: JSON.stringify({ message: `Hey, ${firstName}. I am IRIS, your agent. I am going to learn who you are well enough to find people worth meeting. Not through a quiz. Just talk to me. What is something you could spend hours doing without noticing time pass?`, inference: null, profileReady: false, profile: null }) },
        ]);
        setQNum(1);
      }
      setTyping(false);
      scrollDown();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    initChat();
  }, [firstName, scrollDown, scanContext]);

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || typing || done) return;

    setInputText("");
    // Add user message to display
    setMessages(prev => [...prev, { sender: "user", text }]);
    scrollDown();

    // Build API messages
    const newApiMessages = [...apiMessages, { role: "user" as const, content: text }];
    setApiMessages(newApiMessages);

    setTyping(true);
    scrollDown();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newApiMessages, scanContext }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const updatedApiMessages = [...newApiMessages, { role: "assistant" as const, content: JSON.stringify(data) }];
      setApiMessages(updatedApiMessages);

      // Add IRIS response
      setMessages(prev => [...prev, { sender: "iris", text: data.message }]);
      setQNum(q => q + 1);

      // Show inference callout if present
      if (data.inference) {
        setTimeout(() => {
          setMessages(prev => [...prev, { sender: "system", text: `Detected: ${data.inference.trait} (${data.inference.domain}) — ${Math.round(data.inference.confidence * 100)}%`, isInferenceCallout: true }]);
          scrollDown();
        }, 300);
      }

      // Check if profile is ready
      if (data.profileReady && data.profile) {
        setDone(true);
        setTimeout(() => {
          setMessages(prev => [...prev, { sender: "system", text: "PROFILE CONSTRUCTION COMPLETE" }]);
          scrollDown();
          onProfileReady(data.profile, updatedApiMessages);
          setTimeout(() => onNext(), 2000);
        }, 800);
      }
    } catch (e) {
      setMessages(prev => [...prev, { sender: "iris", text: "I lost my train of thought for a moment. Say that again?" }]);
    }

    setTyping(false);
    scrollDown();
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [inputText, typing, done, apiMessages, scrollDown, onNext, onProfileReady, scanContext]);

  const progress = Math.min(qNum, 5);

  return (
    <ScreenWrap k="onboarding">
      {/* Header */}
      <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0 }}>
        <HaloMark size={20} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", letterSpacing: 0.5 }}>
            Question {progress} of 5
          </span>
          <div style={{ width: 80, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)" }}>
            <div style={{ width: `${Math.min((progress / 5) * 100, 100)}%`, height: "100%", borderRadius: 2, background: "linear-gradient(135deg,#A78BFA,#7C3AED)", transition: "width 0.4s ease" }} />
          </div>
        </div>
      </div>
      {/* Chat */}
      <div ref={chatRef} style={{ flex: 1, overflowY: "auto", padding: "8px 16px 16px" }}>
        {messages.map((m, i) => (
          <ChatBubble key={i} msg={m} />
        ))}
        {typing && <TypingIndicator />}
      </div>
      {/* Input */}
      {!done && (
        <div style={{ padding: "8px 16px 16px", display: "flex", gap: 8, flexShrink: 0 }}>
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
            placeholder="Type your response..."
            disabled={typing}
            style={{
              flex: 1,
              height: 44,
              borderRadius: 22,
              border: "1px solid rgba(139,92,246,0.2)",
              background: "rgba(139,92,246,0.04)",
              color: "#F3F4F6",
              fontSize: 14,
              padding: "0 16px",
              outline: "none",
              opacity: typing ? 0.5 : 1,
            }}
          />
          <button
            onClick={sendMessage}
            disabled={typing || !inputText.trim()}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "none",
              background: inputText.trim() && !typing ? "linear-gradient(135deg, #A78BFA, #7C3AED)" : "rgba(139,92,246,0.1)",
              cursor: inputText.trim() && !typing ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}
    </ScreenWrap>
  );
}

/** Build a human-readable context string from scan data for IRIS */
function buildScanContext(s: any): string {
  const p: string[] = [];

  if (s.device) {
    const d = s.device;
    p.push(`Platform: ${d.platform}, User-Agent: ${d.userAgent}`);
    p.push(`Language: ${d.language}, Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    p.push(`Screen: ${d.screenWidth}×${d.screenHeight}, DPR: ${d.devicePixelRatio}x`);
    p.push(`Dark mode: ${d.darkMode}, Reduced motion: ${d.reducedMotion}`);
    p.push(`Touch capable: ${d.touchCapable}, Max touch points: ${d.maxTouchPoints}`);
    if (d.hardwareConcurrency) p.push(`CPU threads: ${d.hardwareConcurrency}`);
    if (d.deviceMemory) p.push(`Device memory: ${d.deviceMemory}GB`);
    p.push(`Connection: ${d.connectionType || "unknown"}, Downlink: ${d.connectionDownlink || "?"}Mbps`);
    p.push(`Active at: ${d.dayOfWeek} ${d.localHour}:${String(d.localMinute || 0).padStart(2, "0")} local time`);
    p.push(`Do Not Track: ${d.doNotTrack || "unset"}, Cookies: ${d.cookieEnabled}`);
  }

  if (s.gpu?.renderer) {
    p.push(`GPU: ${s.gpu.renderer} (${s.gpu.vendor || "unknown"})`);
    if (s.gpu.maxTextureSize) p.push(`Max texture: ${s.gpu.maxTextureSize}px`);
  }

  if (s.fonts?.detected?.length) {
    p.push(`Installed fonts (${s.fonts.detected.length}/${s.fonts.totalChecked} detected): ${s.fonts.detected.join(", ")}`);
  }

  if (s.audio?.sampleRate) {
    p.push(`Audio: ${s.audio.sampleRate}Hz sample rate, ${s.audio.maxChannelCount} channels`);
  }

  if (s.battery && s.battery.level !== null) {
    p.push(`Battery: ${Math.round(s.battery.level * 100)}%, Charging: ${s.battery.charging}`);
  }

  if (s.permissions) {
    const pm = s.permissions;
    p.push(`Permissions — Notifications: ${pm.notifications || "?"}, Camera: ${pm.camera || "?"}, Mic: ${pm.microphone || "?"}, Location: ${pm.geolocation || "?"}`);
  }

  if (s.storage) {
    const st = s.storage;
    p.push(`Digital footprint: ${st.localStorageEntries} localStorage entries, ${st.cookieCount} cookies`);
    if (st.localStorageKeys?.length) p.push(`Storage keys: ${st.localStorageKeys.slice(0, 20).join(", ")}`);
    if (st.indexedDBDatabases?.length) p.push(`IndexedDB: ${st.indexedDBDatabases.join(", ")}`);
  }

  if (s.apis) {
    const caps: string[] = [];
    if (s.apis.webGLSupported) caps.push("WebGL");
    if (s.apis.webRTCSupported) caps.push("WebRTC");
    if (s.apis.bluetoothSupported) caps.push("Bluetooth");
    if (s.apis.gamepadsSupported) caps.push("Gamepad");
    if (s.apis.webShareSupported) caps.push("WebShare");
    if (s.apis.vibrationSupported) caps.push("Vibration");
    if (s.apis.paymentRequestSupported) caps.push("PaymentRequest");
    if (caps.length) p.push(`Device APIs: ${caps.join(", ")}`);
    if (s.apis.speechSynthesisVoices) p.push(`Speech voices: ${s.apis.speechSynthesisVoices}`);
  }

  if (s.behavior) {
    p.push(`Browser history depth: ${s.behavior.historyLength} entries`);
    if (s.behavior.referrer) p.push(`Came from: ${s.behavior.referrer}`);
  }

  if (s.performance) {
    if (s.performance.loadComplete) p.push(`Page load: ${s.performance.loadComplete}ms`);
    if (s.performance.memoryUsedMB) p.push(`JS memory: ${s.performance.memoryUsedMB}MB / ${s.performance.memoryTotalMB}MB`);
  }

  if (s.location) {
    const l = s.location;
    if (l.city) p.push(`Location: ${l.city}, ${l.region || ""}, ${l.country || ""}`);
    if (l.latitude) p.push(`Coordinates: ${l.latitude.toFixed(4)}, ${l.longitude.toFixed(4)}`);
  }

  if (s.canvas?.hash) p.push(`Canvas fingerprint: ${s.canvas.hash}`);
  p.push(`Scan completed in: ${s.scanDurationMs}ms`);

  return p.join("\n");
}
