// ═══════════════════════════════════════════════════════════
// HALO · Data Layer
// All mock generators removed. Real data flows through:
//   - /api/chat (IRIS conversation + silent scan context)
//   - /api/match (real user matching from Supabase)
//   - /api/profile/finalize (real profile persistence)
//   - /api/scan/analyze (real device scan analysis)
//   - /api/feedback (real meeting feedback)
// ═══════════════════════════════════════════════════════════

// Domain colors used by IRIS profile system
export const domainColors: Record<string, string> = {
  "Attachment": "#E11D48",
  "Emotional Intelligence": "#F59E0B",
  "Communication": "#0EA5E9",
  "Values": "#10B981",
  "Lifestyle": "#F97316",
  "Conflict": "#EF4444",
  "Love Language": "#EC4899",
  "Cognitive": "#6366F1",
  "Social": "#14B8A6",
  "Growth": "#84CC16",
  "Physical": "#06B6D4",
  "History": "#8B5CF6",
};
