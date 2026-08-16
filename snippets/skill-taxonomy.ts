// The skill taxonomy: how the exam is decomposed for the diagnostic.
//
// Every question in the bank is tagged to exactly one of these skills. The
// "prerequisites" links are what let the study plan reason about root causes:
// if a person is weak on Linear Equations AND on a skill underneath it, the
// plan sends them to the foundation first.
//
// This is the structure only. The questions themselves are not part of this
// repo.

export type Section = "math" | "reading";

export interface Skill {
  label: string;
  section: Section;
  prerequisites: string[]; // ids of skills this one builds on
}

export const SKILLS: Record<string, Skill> = {
  // Math: a chain from arithmetic up to quadratics
  arithmetic_basic:       { label: "Basic Arithmetic",                 section: "math", prerequisites: [] },
  fractions:              { label: "Fractions & Rational Numbers",     section: "math", prerequisites: ["arithmetic_basic"] },
  order_of_operations:    { label: "Order of Operations",              section: "math", prerequisites: ["arithmetic_basic"] },
  number_sequences:       { label: "Number Sequences & Patterns",      section: "math", prerequisites: ["arithmetic_basic"] },
  algebraic_substitution: { label: "Plugging Values into Expressions", section: "math", prerequisites: ["arithmetic_basic", "order_of_operations"] },
  linear_equations:       { label: "Linear Equations",                 section: "math", prerequisites: ["arithmetic_basic", "order_of_operations", "algebraic_substitution"] },
  inequalities:           { label: "Inequalities",                     section: "math", prerequisites: ["linear_equations"] },
  systems_of_equations:   { label: "Systems of Equations",             section: "math", prerequisites: ["linear_equations"] },
  polynomials:            { label: "Polynomials & Manipulation",       section: "math", prerequisites: ["linear_equations"] },
  graph_interpretation:   { label: "Graph Interpretation",             section: "math", prerequisites: ["linear_equations"] },
  factoring:              { label: "Factoring",                        section: "math", prerequisites: ["polynomials", "fractions"] },
  quadratics:             { label: "Quadratic Equations",              section: "math", prerequisites: ["factoring"] },

  // Reading: a shallower chain
  vocabulary_in_context:  { label: "Vocabulary in Context",            section: "reading", prerequisites: [] },
  detail_retrieval:       { label: "Detail Retrieval",                 section: "reading", prerequisites: [] },
  main_idea:              { label: "Main Idea",                        section: "reading", prerequisites: [] },
  inference:              { label: "Inference",                        section: "reading", prerequisites: ["main_idea", "detail_retrieval"] },
  author_perspective:     { label: "Author's Purpose & Tone",          section: "reading", prerequisites: ["main_idea", "inference"] },
};
