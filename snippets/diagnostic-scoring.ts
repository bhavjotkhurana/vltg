// Turning raw answers into a diagnosis. Sanitized excerpt.
//
// Three moves happen here:
//   1. raw correct count  ->  a 1 to 9 stanine (norm-referenced, an estimate)
//   2. per-skill accuracy  ->  which skills are actually weak
//   3. weak skills + the prerequisite graph  ->  an ordered study plan
//
// The point of (3) is that not all gaps are equal. A weak skill whose
// foundation is also weak gets sent to the foundation first.

import { SKILLS } from "./skill-taxonomy";

// --- 1. Score: raw correct -> stanine -------------------------------------
// The 1 to 9 stanine is a standing-relative-to-others scale. The official
// norming tables for the real exam are not public, so this is a documented
// estimate under a normal model, not a copy of the real curve. The app says so.
const NORM_MEAN = 0.6; // assumed mean proportion-correct sits at the middle band
const NORM_SD = 0.175;

export function rawToStanine(correct: number, total: number): number {
  const z = (correct / total - NORM_MEAN) / NORM_SD;
  // map the z-score onto the nine textbook stanine bands (0.5 SD wide)
  const stanine = Math.round(z / 0.5 + 5);
  return Math.min(9, Math.max(1, stanine));
}

// --- 2. Per-skill accuracy -------------------------------------------------
export interface SkillScore { correct: number; total: number; pct: number; }

export function computeSkillScores(
  responses: { skill: string; isCorrect: boolean }[],
): Record<string, SkillScore> {
  const acc: Record<string, SkillScore> = {};
  for (const r of responses) {
    const s = (acc[r.skill] ??= { correct: 0, total: 0, pct: 0 });
    s.total += 1;
    if (r.isCorrect) s.correct += 1;
  }
  for (const s of Object.values(acc)) s.pct = s.total ? s.correct / s.total : 0;
  return acc;
}

// --- 3. Prioritized, prerequisite-aware study plan ------------------------
type Category = "quick_win" | "foundation" | "prerequisite_chain" | "stretch";

const WEAK = 0.7; // below 70 percent counts as a gap worth addressing

export interface PlanItem {
  skill: string;
  label: string;
  category: Category;
  reason: string;
}

export function generateStudyPlan(scores: Record<string, SkillScore>): PlanItem[] {
  const isWeak = (id: string) => (scores[id]?.pct ?? 1) < WEAK;
  const weakSkills = Object.keys(scores).filter(isWeak);

  const plan: PlanItem[] = weakSkills.map((id) => {
    const skill = SKILLS[id];
    const pct = scores[id].pct;
    const weakPrereqs = skill.prerequisites.filter(isWeak);

    // A gap sitting on top of a shaky foundation: fix the root first.
    if (weakPrereqs.length > 0) {
      return { skill: id, label: skill.label, category: "prerequisite_chain",
        reason: `Gaps in the basics underneath are holding this back, so start there.` };
    }
    // Close to passing already: small effort, fast payoff.
    if (pct >= 0.55) {
      return { skill: id, label: skill.label, category: "quick_win",
        reason: `Already at ${Math.round(pct * 100)}%. A little targeted practice tips this over.` };
    }
    // A foundational skill others depend on: high leverage.
    const isFoundation = Object.values(SKILLS).some((s) => s.prerequisites.includes(id));
    if (isFoundation) {
      return { skill: id, label: skill.label, category: "foundation",
        reason: `Several other skills build on this one, so improving it lifts more than itself.` };
    }
    return { skill: id, label: skill.label, category: "stretch",
      reason: `A harder topic to pick up once the foundations are solid.` };
  });

  // Order the plan by leverage: roots and foundations before quick wins,
  // quick wins before stretch goals.
  const rank: Record<Category, number> = {
    prerequisite_chain: 0, foundation: 1, quick_win: 2, stretch: 3,
  };
  return plan.sort((a, b) => rank[a.category] - rank[b.category]);
}
