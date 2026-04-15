@AGENTS.md

## Belt Progression

A module is complete when:
1. All active lessons are marked complete
2. All active scenarios have been attempted at least once

Belt thresholds (modules completed → belt):
- 0 → No belt
- 1–2 → White Belt
- 3–4 → Yellow Belt
- 5–6 → Green Belt
- 7–8 → Blue Belt
- 9 → Brown Belt
- 10 + pass final exam → Black Belt

Belt is stored on the User model as `currentBelt` (String?) and `beltEarnedAt` (DateTime?).
Belt check runs after every lesson completion and every scenario attempt via `checkAndAwardBelt()` in `lib/module-completion.ts`.

## Influence Score™ System

Scoring model: 3 (Weak) / 5 (Neutral) / 7 (Good) / 10 (Best)
Calculation: Running average across all scenario attempts × 10
Range: 30 (all weak) → 100 (all best)

Influence Levels:
- Reactive Parent: 0–40
- Developing Parent: 41–65
- Intentional Parent: 66–85
- Ultimate Influencer™: 86–100

Key rules:
- Score never gates progression — users always move forward
- Retakes allowed — all attempts recorded, score recalculates on each attempt
- Score is guidance not judgment
