import React, { useCallback, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAppFlow, type UserProfile } from "../../hooks/useAppFlow";
import {
  WelcomeScreen,
  MethodChoiceScreen,
  DeviceScanScreen,
  OnboardingScreen,
  ProfileBuiltScreen,
  HomeScreen,
  MatchFoundScreen,
  HandshakeScreen,
  PreMeetingScreen,
  ApproachScreen,
  MeetingScreen,
  PostMeetingScreen,
} from "../../components/screens";
import { supabase } from "../../lib/supabase";
import { apiCall } from "../../lib/api";

export default function MainScreen() {
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
    sessionCtx,
    loading,
    user,
  } = useAppFlow();

  const [savingProfile, setSavingProfile] = useState(false);

  // When device scan produces a profile via /api/scan/analyze
  const handleScanProfileReady = useCallback(
    async (scanProfile: any) => {
      setSavingProfile(true);
      try {
        const res = await apiCall("/profile/finalize", {
          method: "POST",
          body: JSON.stringify({
            profile: scanProfile,
            conversation: [],
            name: userName.trim(),
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setProfile({
          summary: scanProfile.summary,
          eq_score: scanProfile.eqScore,
          traits: scanProfile.traits || [],
          personality_nodes: scanProfile.personalityNodes || [],
          personality_edges: scanProfile.personalityEdges || [],
          intent_profile: scanProfile.intentProfile || {},
          core_values: scanProfile.coreValues || [],
          traitInsights: {},
        });
      } catch (e) {
        console.error("Failed to save scan profile:", e);
        setProfile({
          summary: scanProfile.summary,
          eq_score: scanProfile.eqScore,
          traits: scanProfile.traits || [],
          personality_nodes: scanProfile.personalityNodes || [],
          personality_edges: scanProfile.personalityEdges || [],
          intent_profile: scanProfile.intentProfile || {},
          core_values: scanProfile.coreValues || [],
          traitInsights: {},
        });
      }
      setSavingProfile(false);
    },
    [userName, setProfile]
  );

  // When user enters name on welcome screen
  const handleActivate = useCallback(async () => {
    if (!userName.trim()) return;
    if (user) {
      await supabase
        .from("users")
        .update({ name: userName.trim() })
        .eq("id", user.id);
    }
    setScreen("methodChoice");
  }, [userName, user, setScreen]);

  // When IRIS finishes building the profile
  const handleProfileReady = useCallback(
    async (irisProfile: any, conversation: Array<{ role: string; content: string }>) => {
      setSavingProfile(true);
      try {
        const res = await apiCall("/profile/finalize", {
          method: "POST",
          body: JSON.stringify({
            profile: irisProfile,
            conversation,
            name: userName.trim(),
          }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

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
        const res = await apiCall("/match/respond", {
          method: "POST",
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
        await apiCall("/match/respond", {
          method: "POST",
          body: JSON.stringify({ matchId: match.id, response: "decline" }),
        });
      } catch (e) {
        console.error("Match decline error:", e);
      }
    }
    setMatch(null);
    setScreen("home");
  }, [match, setMatch, setScreen]);

  // Loading state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  // Build match data for screens from real match or session context
  const matchDisplayData = sessionCtx?.matchData || {
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

  const renderScreen = () => {
    switch (screen) {
      case "welcome":
        return (
          <WelcomeScreen
            userName={userName}
            onNameChange={setUserName}
            onNext={handleActivate}
          />
        );
      case "methodChoice":
        return (
          <MethodChoiceScreen
            userName={userName}
            onChat={() => setScreen("onboarding")}
            onScan={() => setScreen("deviceScan")}
          />
        );
      case "deviceScan":
        return (
          <DeviceScanScreen
            userName={userName}
            onNext={() => setScreen("profileBuilt")}
            deviceScanLog={sessionCtx?.deviceScanLog || []}
            onProfileReady={handleScanProfileReady}
          />
        );
      case "onboarding":
        return (
          <OnboardingScreen
            userName={userName}
            onNext={() => setScreen("profileBuilt")}
            onProfileReady={handleProfileReady}
          />
        );
      case "profileBuilt":
        return (
          <ProfileBuiltScreen
            userName={userName}
            onNext={() => setScreen("home")}
            profile={profile}
            intentProfile={sessionCtx?.intentProfile || profile?.intent_profile}
            profileCompounding={sessionCtx?.profileCompounding}
          />
        );
      case "home":
        return (
          <HomeScreen
            onNext={() => setScreen("matchFound")}
            scanLog={sessionCtx?.scanLog || []}
          />
        );
      case "matchFound":
        return (
          <MatchFoundScreen
            onAccept={handleMatchAccept}
            onDecline={handleMatchDecline}
            matchData={matchDisplayData}
          />
        );
      case "handshake":
        return (
          <HandshakeScreen
            onNext={() => setScreen("preMeeting")}
            negotiationSteps={sessionCtx?.negotiationSteps || []}
          />
        );
      case "preMeeting":
        return (
          <PreMeetingScreen
            onNext={() => setScreen("approach")}
            matchData={matchDisplayData}
          />
        );
      case "approach":
        return (
          <ApproachScreen
            onNext={() => setScreen("meeting")}
            matchData={matchDisplayData}
          />
        );
      case "meeting":
        return (
          <MeetingScreen
            onNext={() => setScreen("postMeeting")}
            matchData={matchDisplayData}
          />
        );
      case "postMeeting":
        return (
          <PostMeetingScreen
            userName={userName}
            onRestart={() => {
              setMatch(null);
              setScreen("home");
            }}
            matchData={matchDisplayData}
            matchId={match?.id}
          />
        );
      default:
        return null;
    }
  };

  return <View style={styles.container}>{renderScreen()}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07070D",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#07070D",
    alignItems: "center",
    justifyContent: "center",
  },
});
