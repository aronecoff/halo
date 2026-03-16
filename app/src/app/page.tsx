"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppFlow, type UserProfile } from "@/hooks/useAppFlow";
import {
  OnboardingScreen,
  ProfileBuiltScreen,
  HomeScreen,
  MatchFoundScreen,
  HandshakeScreen,
  PreMeetingScreen,
  ApproachScreen,
  MeetingScreen,
  PostMeetingScreen,
} from "@/components/screens";
import { LandingPage } from "@/components/LandingPage";
import { createClient } from "@/lib/supabase/client";
import { runSilentScan, type SilentScanResult } from "@/lib/silent-scan";

export default function Home() {
  const {
    screen,
    setScreen,
    userName,
    setUserName,
    profile,
    setProfile,
    match,
    setMatch,
    refreshMatch,
    matchDisplayData,
    loading,
    user,
  } = useAppFlow();

  const supabase = createClient();
  const [savingProfile, setSavingProfile] = useState(false);

  // Silent scan data — collected IMMEDIATELY on page load, before any interaction
  const scanDataRef = useRef<SilentScanResult | null>(null);
  const [scanReady, setScanReady] = useState(false);
  const scanStarted = useRef(false);

  // Run silent scan on mount — IRIS will have this data before the user says a word
  useEffect(() => {
    if (scanStarted.current) return;
    scanStarted.current = true;
    runSilentScan().then((data) => {
      scanDataRef.current = data;
      setScanReady(true);
    }).catch(() => {
      setScanReady(true);
    });
  }, []);

  // Enter the app from landing page
  const handleGetStarted = useCallback(async (name: string) => {
    setUserName(name);
    if (user) {
      await supabase
        .from("users")
        .update({ name: name.trim() })
        .eq("id", user.id);
    }
    setScreen("onboarding");
  }, [user, supabase, setScreen, setUserName]);

  // When IRIS finishes — merge conversation profile with silent scan data
  const handleProfileReady = useCallback(
    async (irisProfile: any, conversation: Array<{ role: string; content: string }>) => {
      setSavingProfile(true);
      const scanData = scanDataRef.current;

      try {
        let scanProfile: any = null;
        if (scanData) {
          try {
            const scanRes = await fetch("/api/scan/analyze", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ scanData: { ...scanData, userName: userName.trim() } }),
            });
            const scanResult = await scanRes.json();
            if (scanResult.profile) scanProfile = scanResult.profile;
          } catch {}
        }

        const finalProfile = scanProfile ? mergeProfiles(irisProfile, scanProfile) : irisProfile;

        const res = await fetch("/api/profile/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profile: finalProfile,
            conversation,
            name: userName.trim(),
            scanData: scanData || undefined,
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setProfile({
          summary: finalProfile.summary,
          eq_score: finalProfile.eqScore,
          traits: finalProfile.traits || [],
          personality_nodes: finalProfile.personalityNodes || [],
          personality_edges: finalProfile.personalityEdges || [],
          intent_profile: finalProfile.intentProfile || {},
          core_values: finalProfile.coreValues || [],
          traitInsights: {},
        });
      } catch (e) {
        console.error("Failed to save profile:", e);
        setProfile({
          summary: irisProfile.summary,
          eq_score: irisProfile.eqScore,
          traits: irisProfile.traits || [],
          personality_nodes: irisProfile.personalityNodes || [],
          personality_edges: irisProfile.personalityEdges || [],
          intent_profile: irisProfile.intentProfile || {},
          core_values: irisProfile.coreValues || [],
          traitInsights: {},
        });
      }
      setSavingProfile(false);
    },
    [userName, setProfile]
  );

  // Match accept handler
  const handleMatchAccept = useCallback(async () => {
    if (match?.id) {
      try {
        const res = await fetch("/api/match/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId: match.id, response: "accept" }),
        });
        const data = await res.json();
        if (data.status === "confirmed") {
          setScreen("handshake");
          return;
        }
      } catch (e) {
        console.error("Match accept error:", e);
      }
    }
    setScreen("handshake");
  }, [match, setScreen]);

  // Match decline handler
  const handleMatchDecline = useCallback(async () => {
    if (match?.id) {
      try {
        await fetch("/api/match/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId: match.id, response: "decline" }),
        });
      } catch (e) {
        console.error("Match decline error:", e);
      }
    }
    setMatch(null);
    setScreen("home");
  }, [match, setMatch, setScreen]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0A0A0F",
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "radial-gradient(circle, #A78BFA 0%, #7C3AED 40%, #4C1D95 100%)",
          animation: "breathe 2s ease-in-out infinite",
        }} />
      </div>
    );
  }

  // Show landing page if user hasn't started yet
  if (screen === "welcome") {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  // Default match display when no real match exists yet
  const displayData = matchDisplayData || {
    irisDescription: "I found someone worth meeting.",
    compatibility: 85,
    sharedTraits: [],
    matchName: match?.other_user_name || "Your match",
    matchPhoto: { url: "", verified: true, verifiedAt: "Mar 2026", contextLine: "" },
    venue: "Coffee shop",
    venueShort: "Cafe",
    area: "San Francisco",
    day: "Saturday",
    time: "10:00 AM",
    duration: "~1 hour",
    starter: "Ask them what they are most curious about right now.",
    reason: "High compatibility across multiple dimensions.",
    intentMatch: "Intent alignment: 89%.",
    venueSafety: { isPublic: true, footTraffic: "high", transitAccess: true, exitEase: "high" },
  };

  // In-app experience — centered mobile layout
  return (
    <div className="app-shell">
      <AnimatePresence mode="wait">
        {screen === "onboarding" && (
          <OnboardingScreen
            userName={userName}
            onNext={() => setScreen("profileBuilt")}
            onProfileReady={handleProfileReady}
            scanData={scanDataRef.current}
          />
        )}
        {screen === "profileBuilt" && (
          <ProfileBuiltScreen
            userName={userName}
            onNext={() => setScreen("home")}
            profile={profile}
            intentProfile={profile?.intent_profile}
          />
        )}
        {screen === "home" && (
          <HomeScreen
            onMatchFound={(newMatch) => {
              setMatch(newMatch);
              setScreen("matchFound");
            }}
          />
        )}
        {screen === "matchFound" && (
          <MatchFoundScreen
            onAccept={handleMatchAccept}
            onDecline={handleMatchDecline}
            matchData={displayData}
          />
        )}
        {screen === "handshake" && (
          <HandshakeScreen
            onNext={() => setScreen("preMeeting")}
            matchData={displayData}
          />
        )}
        {screen === "preMeeting" && (
          <PreMeetingScreen
            onNext={() => setScreen("approach")}
            matchData={displayData}
          />
        )}
        {screen === "approach" && (
          <ApproachScreen
            onNext={() => setScreen("meeting")}
            matchData={displayData}
          />
        )}
        {screen === "meeting" && (
          <MeetingScreen
            onNext={() => setScreen("postMeeting")}
            matchData={displayData}
          />
        )}
        {screen === "postMeeting" && (
          <PostMeetingScreen
            userName={userName}
            onRestart={() => {
              setMatch(null);
              setScreen("home");
            }}
            matchData={displayData}
            matchId={match?.id}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/** Merge IRIS conversation profile with device scan profile. IRIS is primary. */
function mergeProfiles(irisProfile: any, scanProfile: any): any {
  return {
    ...irisProfile,
    summary: irisProfile.summary,
    eqScore: Math.round(((irisProfile.eqScore || 85) + (scanProfile.eqScore || 85)) / 2),
    personalityNodes: mergeNodes(irisProfile.personalityNodes || [], scanProfile.personalityNodes || []),
    personalityEdges: mergeEdges(irisProfile.personalityEdges || [], scanProfile.personalityEdges || []),
    intentProfile: {
      ...(irisProfile.intentProfile || {}),
      confidence: Math.round((((irisProfile.intentProfile?.confidence || 0.85) + (scanProfile.intentProfile?.confidence || 0.85)) / 2) * 100) / 100,
      signals: [
        ...(irisProfile.intentProfile?.signals || []),
        ...(scanProfile.intentProfile?.signals || []).filter(
          (s: any) => !(irisProfile.intentProfile?.signals || []).some((is: any) => is.signal === s.signal)
        ),
      ],
    },
    coreValues: Array.from(new Set([...(irisProfile.coreValues || []), ...(scanProfile.coreValues || [])])).slice(0, 5),
  };
}

function mergeNodes(primary: any[], secondary: any[]): any[] {
  const ids = new Set(primary.map((n: any) => n.id));
  return [...primary, ...secondary.filter((n: any) => !ids.has(n.id))].slice(0, 15);
}

function mergeEdges(primary: any[], secondary: any[]): any[] {
  const keys = new Set(primary.map((e: any) => `${e.source}-${e.target}`));
  return [...primary, ...secondary.filter((e: any) => !keys.has(`${e.source}-${e.target}`))];
}
