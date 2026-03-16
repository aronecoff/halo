"use client";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { HaloMark, IrisOrb, PrimaryButton, Card, Label, ScreenWrap, AnimatedNumber } from "@/components/ui";

interface ProfileBuiltScreenProps {
  userName: string;
  onNext: () => void;
  profile: any;
  intentProfile: any;
}

/** Build real accuracy compounding from actual profile data */
function buildRealCompounding(profile: any) {
  if (!profile) return null;
  const nodes = profile.personality_nodes || profile.personalityNodes || [];
  const traits = profile.traits || [];
  const edges = profile.personality_edges || profile.personalityEdges || [];
  const intent = profile.intent_profile || profile.intentProfile || {};
  const coreValues = profile.core_values || profile.coreValues || [];

  // Calculate real data points from actual profile content
  const conversationPoints = traits.length * 12 + (profile.summary?.length || 0);
  const nodePoints = nodes.length * 8;
  const edgePoints = edges.length * 4;
  const intentPoints = (intent.signals?.length || 0) * 15;
  const valuePoints = coreValues.length * 10;

  // Confidence grows with real data density
  const baseConfidence = Math.min(65 + traits.length * 4, 82);
  const nodeConfidence = Math.min(baseConfidence + nodes.length, 88);
  const edgeConfidence = Math.min(nodeConfidence + Math.floor(edges.length / 3), 91);
  const intentConfidence = Math.min(edgeConfidence + (intent.signals?.length || 0), 94);

  return {
    stages: [
      { label: "IRIS Conversation Analysis", confidence: baseConfidence, dataPoints: conversationPoints },
      { label: "Personality Node Mapping", confidence: nodeConfidence, dataPoints: conversationPoints + nodePoints },
      { label: "Trait Correlation Engine", confidence: edgeConfidence, dataPoints: conversationPoints + nodePoints + edgePoints },
      { label: "Intent Classification", confidence: intentConfidence, dataPoints: conversationPoints + nodePoints + edgePoints + intentPoints + valuePoints },
    ],
    projections: [
      { label: "After 1st meeting", confidence: Math.min(intentConfidence + 4, 96) },
      { label: "After 3 meetings", confidence: Math.min(intentConfidence + 8, 98) },
    ],
  };
}

export function ProfileBuiltScreen({ userName, onNext, profile, intentProfile }: ProfileBuiltScreenProps) {
  const nodes = profile?.personality_nodes || profile?.personalityNodes || [];
  const edges = profile?.personality_edges || profile?.personalityEdges || [];
  const traits = profile?.traits || [];
  const summary = profile?.summary || "";
  const eqScore = profile?.eq_score || profile?.eqScore || 0;
  const traitInsights = profile?.traitInsights || {};

  // Build compounding from REAL profile data
  const profileCompounding = useMemo(() => buildRealCompounding(profile), [profile]);

  // Use real intent from profile, not mock
  const realIntent = intentProfile || profile?.intent_profile || profile?.intentProfile || null;

  const [visibleNodes, setVisibleNodes] = useState(0);
  const [expandedTrait, setExpandedTrait] = useState<string | null>(null);

  useEffect(() => {
    if (visibleNodes < nodes.length) {
      const t = setTimeout(() => setVisibleNodes((v) => v + 1), 200);
      return () => clearTimeout(t);
    }
  }, [visibleNodes, nodes.length]);

  const nodeMap: Record<string, any> = {};
  nodes.forEach((n: any) => { nodeMap[n.id] = n; });

  return (
    <ScreenWrap k="profileBuilt">
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px 60px", minHeight: 0 }}>
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <HaloMark size={18} />
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "#6B7280", marginTop: 4 }}>
            {userName.trim().split(" ")[0].toUpperCase()}, YOUR PERSONALITY WEB
          </div>
        </div>

        {/* SVG Personality Web */}
        <svg viewBox="0 0 380 320" width="100%" height="130" style={{ display: "block" }}>
          {edges.map((e: any, i: number) => {
            const s = nodeMap[e.source];
            const t = nodeMap[e.target];
            if (!s || !t) return null;
            const sVis = nodes.indexOf(s) < visibleNodes;
            const tVis = nodes.indexOf(t) < visibleNodes;
            return (
              <line key={i} x1={s.x} y1={s.y} x2={t.x} y2={t.y} stroke={s.domainColor} strokeOpacity={sVis && tVis ? e.weight * 0.3 : 0} strokeWidth={1} style={{ transition: "stroke-opacity 0.5s ease" }} />
            );
          })}
          {nodes.map((n: any, i: number) => {
            const show = i < visibleNodes;
            return (
              <g key={n.id} style={{ transition: "opacity 0.4s ease, transform 0.4s ease" }}>
                <circle cx={n.x} cy={n.y} r={show ? n.size / 2 : 0} fill={n.domainColor} fillOpacity={0.8} style={{ transition: "r 0.4s ease" }} />
                <text x={n.x} y={n.y + n.size / 2 + 12} textAnchor="middle" fill="#fff" fontSize={8} opacity={show ? 0.9 : 0} style={{ transition: "opacity 0.4s ease" }}>
                  {n.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* EQ Score + summary */}
        <Card style={{ marginTop: 8, padding: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <IrisOrb size={22} pulse={false} />
            <div>
              <p style={{ fontSize: 11.5, lineHeight: 1.55, color: "#E0E0E0", fontWeight: 400 }}>{summary}</p>
              {eqScore > 0 && (
                <div style={{ marginTop: 8, fontSize: 11, color: "#A78BFA", fontWeight: 600 }}>
                  EQ Signal: <AnimatedNumber value={eqScore} />
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Traits list */}
        <div style={{ marginTop: 12 }}>
          <Label>DETECTED TRAITS</Label>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 2 }}>
            {traits.map((t: any) => (
              <div key={t.label}>
                <motion.button whileTap={{ scale: 0.98 }} onClick={() => setExpandedTrait(expandedTrait === t.label ? null : t.label)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: expandedTrait === t.label ? "rgba(139,92,246,0.06)" : "transparent", border: "none", borderRadius: 10, cursor: "pointer", transition: "background 0.2s" }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 1 }}>{t.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#E0E0E0" }}>{t.value}</span>
                </motion.button>
                {expandedTrait === t.label && traitInsights[t.label] && (
                  <div className="fade-up" style={{ padding: "6px 12px 12px", fontSize: 12, color: "#8B5CF6", lineHeight: 1.5, fontStyle: "italic" }}>
                    {traitInsights[t.label]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Intent Detection */}
        {realIntent && (
          <div style={{ marginTop: 12 }}>
            <Label style={{ marginBottom: 8 }}>INTENT DETECTED</Label>
            <Card style={{ padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#A78BFA" }}>{realIntent.classification}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#4ADE80" }}>{Math.round((realIntent.confidence || 0) * 100)}%</span>
              </div>
              {realIntent.breakdown && (
                <>
                  <div style={{ display: "flex", gap: 4, height: 6, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ flex: realIntent.breakdown.genuine, background: "#A78BFA", borderRadius: 3 }} />
                    <div style={{ flex: realIntent.breakdown.casual, background: "#6B7280", borderRadius: 3 }} />
                    <div style={{ flex: realIntent.breakdown.physical, background: "#374151", borderRadius: 3 }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ fontSize: 8, color: "#A78BFA" }}>Genuine {realIntent.breakdown.genuine}%</span>
                    <span style={{ fontSize: 8, color: "#6B7280" }}>Casual {realIntent.breakdown.casual}%</span>
                    <span style={{ fontSize: 8, color: "#4B5563" }}>Physical {realIntent.breakdown.physical}%</span>
                  </div>
                </>
              )}
            </Card>
          </div>
        )}

        {/* Profile Accuracy Compounding — built from real data */}
        {profileCompounding && (
          <div style={{ marginTop: 12 }}>
            <Label style={{ marginBottom: 8 }}>PROFILE ACCURACY</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {profileCompounding.stages?.map((s: any) => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", background: "rgba(74,222,128,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="8" height="8" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <span style={{ fontSize: 10, color: "#9CA3AF", flex: 1 }}>{s.label}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#4ADE80" }}>{s.confidence}%</span>
                  <span style={{ fontSize: 8, color: "#4B5563" }}>{s.dataPoints.toLocaleString()} pts</span>
                </div>
              ))}
              {profileCompounding.projections?.slice(0, 2).map((p: any) => (
                <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 8, opacity: 0.5 }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: "1px solid rgba(107,114,128,0.3)" }} />
                  <span style={{ fontSize: 10, color: "#6B7280", flex: 1 }}>{p.label}</span>
                  <span style={{ fontSize: 10, color: "#6B7280" }}>{p.confidence}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <PrimaryButton onClick={onNext}>BEGIN SCANNING</PrimaryButton>
        </div>
      </div>
    </ScreenWrap>
  );
}
