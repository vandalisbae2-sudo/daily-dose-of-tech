export type BuildStep = {
  title: string
  body: string
}

// Order is the array position. Do not store a separate step number.
// CONTENT NEEDED: supplied by Martin
// Example shape:
// { title: "Step title", body: "What to do in this step." }
export const buildSteps: BuildStep[] = []
