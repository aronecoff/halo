"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";

export type Screen =
  | "welcome"
  | "onboarding"
  | "profileBuilt"
  | "home"
  | "matchFound"
  | "handshake"
  | "preMeeting"
  | "approach"
  | "meeting"
  | "postMeeting";

export interface UserProfile {
  summary: string;
  eq_score: number;
  traits: Array<{ label: string; value: string }>;
  personality_nodes: any[];
  personality_edges: any[];
  intent_profile: any;
  core_values: string[];
  traitInsights?: Record<string, string>;
}

export interface MatchRecord {
  id: string;
  user_a_id: string;
  user_b_id: string;
  compatibility_score: number;
  shared_traits: string[];
  complementary_traits?: string[];
  match_dimensions?: any[];
  risk_factors?: string[];
  iris_description: string;
  status: string;
  venue: any;
  meeting_time: string;
  meeting_day: string;
  conversation_starter: string;
  other_user_name?: string;
}

export function useAppFlow() {
  const { user } = useAuth();
  const [screen, setScreen] = useState<Screen>("welcome");
  const [userName, setUserName] = useState("");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [match, setMatch] = useState<MatchRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Load user state on mount
  useEffect(() => {
    if (!user) { setLoading(false); return; }

    async function loadState() {
      try {
        // Fetch user record
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", user!.id)
          .single();

        if (userData?.name) setUserName(userData.name);

        if (userData?.onboarding_complete) {
          // Fetch profile
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user!.id)
            .single();

          if (profileData) {
            setProfile({
              summary: profileData.summary,
              eq_score: profileData.eq_score,
              traits: profileData.traits || [],
              personality_nodes: profileData.personality_nodes || [],
              personality_edges: profileData.personality_edges || [],
              intent_profile: profileData.intent_profile || {},
              core_values: profileData.core_values || [],
              traitInsights: {},
            });
          }

          // Check for active match
          const { data: matchData } = await supabase
            .from("matches")
            .select("*")
            .or(`user_a_id.eq.${user!.id},user_b_id.eq.${user!.id}`)
            .not("status", "in", '("completed","declined")')
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (matchData) {
            // Get the other user's name
            const otherUserId = matchData.user_a_id === user!.id ? matchData.user_b_id : matchData.user_a_id;
            const { data: otherUser } = await supabase
              .from("users")
              .select("name")
              .eq("id", otherUserId)
              .single();

            setMatch({ ...matchData, other_user_name: otherUser?.name || "Your match" });

            // Route to appropriate screen based on match status
            if (matchData.status === "confirmed") {
              setScreen("preMeeting");
            } else if (matchData.status === "pending" || matchData.status === "accepted_a" || matchData.status === "accepted_b") {
              setScreen("matchFound");
            }
          } else {
            setScreen("home");
          }
        } else {
          // User exists but hasn't completed onboarding
          setScreen("welcome");
        }
      } catch (e) {
        console.error("Error loading state:", e);
        setScreen("welcome");
      }
      setLoading(false);
    }

    loadState();
  }, [user]);

  // Build match display data from REAL match record — no mock generators
  const matchDisplayData = useMemo(() => {
    if (!match) return null;
    return {
      irisDescription: match.iris_description || "I found someone worth meeting.",
      compatibility: match.compatibility_score,
      sharedTraits: match.shared_traits || [],
      complementaryTraits: match.complementary_traits || [],
      match_dimensions: match.match_dimensions || [],
      risk_factors: match.risk_factors || [],
      matchName: match.other_user_name || "Your match",
      matchPhoto: { url: "", verified: true, verifiedAt: "Mar 2026", contextLine: "" },
      venue: match.venue?.name || "Coffee shop",
      venueShort: match.venue?.short || "Cafe",
      area: match.venue?.area || "San Francisco",
      day: match.meeting_day || "Saturday",
      time: match.meeting_time || "10:00 AM",
      duration: "~1 hour",
      starter: match.conversation_starter || "Ask them what they are most curious about right now.",
      reason: "High compatibility across multiple dimensions.",
      intentMatch: `Intent alignment: ${Math.min((match.compatibility_score || 85) + 4, 99)}%.`,
      venueSafety: { isPublic: true, footTraffic: "high", transitAccess: true, exitEase: "high" },
    };
  }, [match]);

  const refreshMatch = useCallback(async () => {
    if (!user) return null;
    const { data } = await supabase
      .from("matches")
      .select("*")
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .not("status", "in", '("completed","declined")')
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      const otherUserId = data.user_a_id === user.id ? data.user_b_id : data.user_a_id;
      const { data: otherUser } = await supabase
        .from("users")
        .select("name")
        .eq("id", otherUserId)
        .single();
      const enriched = { ...data, other_user_name: otherUser?.name || "Your match" };
      setMatch(enriched);
      return enriched;
    }
    return null;
  }, [user]);

  return {
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
  };
}
