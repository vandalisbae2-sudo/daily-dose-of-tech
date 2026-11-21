export type InsightGroup = "software" | "hardware"

export type Insight = {
  title: string
  summary: string
  group: InsightGroup
}

// CONTENT NEEDED: supplied by Martin
// Example shape:
// { title: "Insight title", summary: "One or two sentences.", group: "software" }
export const insights: Insight[] = []
