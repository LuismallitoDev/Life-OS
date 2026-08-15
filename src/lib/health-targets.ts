export type HealthTargets = {
  calories: number;
  protein: number;
  water: number;
};

// Matches what Health & Fitness used as hardcoded defaults before this was
// made configurable in Settings.
export const DEFAULT_HEALTH_TARGETS: HealthTargets = {
  calories: 2200,
  protein: 150,
  water: 2500,
};

export const HEALTH_TARGETS_KEY = "healthTargets";
