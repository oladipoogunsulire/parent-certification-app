export interface InfluenceScoreLabels {
  "10": string
  "7": string
  "5": string
  "3": string
}

export interface PlatformSettingsData {
  influenceScoreLabels: InfluenceScoreLabels
}

export const DEFAULT_INFLUENCE_SCORE_LABELS: InfluenceScoreLabels = {
  "10": "Best response (Most influential)",
  "7": "Good response (Positively influential)",
  "5": "Neutral response (Minimally influential)",
  "3": "Weak response (Least influential)",
}
