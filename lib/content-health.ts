import { prisma } from "@/lib/prisma"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ModuleHealthReport {
  moduleId:                    string
  trackId:                     string
  moduleName:                  string
  beltLevel:                   string
  orderIndex:                  number
  isActive:                    boolean
  lessonCount:                 number
  lessonsWithVideo:            number
  lessonsWithContent:          number
  lessonsWithResources:        number
  scenarioCount:               number
  scenariosWithVideo:          number
  scenariosWithScoredResponses: number
  scenariosWithExplanations:   number
  completenessScore:           number
  issues:                      string[]
}

export interface ContentFlag {
  severity: "critical" | "warning" | "info"
  module:   string
  lesson?:  string
  scenario?: string
  issue:    string
  action:   string
  fixUrl:   string
}

export interface ContentHealthReport {
  summary: {
    totalModules:   number
    totalLessons:   number
    totalScenarios: number
    healthScore:    number
  }
  modules: ModuleHealthReport[]
  flags:   ContentFlag[]
}

// ---------------------------------------------------------------------------
// Main builder
// ---------------------------------------------------------------------------

export async function buildContentHealthReport(): Promise<ContentHealthReport> {
  const [modulesResult] = await Promise.allSettled([
    prisma.module.findMany({
      select: {
        id:            true,
        trackId:       true,
        moduleTitle:   true,
        introVideoUrl: true,
        orderIndex:    true,
        isActive:      true,
        belt: { select: { beltLevel: true } },
        lessons: {
          select: {
            id:            true,
            lessonTitle:   true,
            contentBody:   true,
            introVideoUrl: true,
            mainVideoUrl:  true,
            isActive:      true,
            resources:     { select: { id: true } },
          },
        },
        scenarios: {
          select: {
            id:            true,
            scenarioTitle: true,
            videoUrl:      true,
            isActive:      true,
            responses: {
              select: {
                id:             true,
                scoreImpact:    true,
                explanationText: true,
                isOptimal:      true,
              },
            },
          },
        },
      },
      orderBy: { orderIndex: "asc" },
    }),
  ])

  const rawModules = modulesResult.status === "fulfilled" ? modulesResult.value : []

  const modules: ModuleHealthReport[] = []
  const flags:   ContentFlag[]        = []

  for (const m of rawModules) {
    const moduleUrl = `/admin/tracks/${m.trackId}/modules/${m.id}`
    const issues: string[] = []

    // ── Info flags ────────────────────────────────────────────────────────
    if (!m.isActive) {
      flags.push({
        severity: "info",
        module:   m.moduleTitle,
        issue:    "Module is inactive — will not be shown to users",
        action:   "Activate the module when content is ready",
        fixUrl:   moduleUrl,
      })
    }

    // ── Module-level critical/warning checks ──────────────────────────────
    if (m.lessons.length === 0) {
      const msg = "Module has no lessons"
      issues.push(msg)
      flags.push({ severity: "critical", module: m.moduleTitle, issue: msg, action: "Add at least one lesson to this module", fixUrl: moduleUrl })
    }
    if (m.scenarios.length === 0) {
      const msg = "Module has no scenarios"
      issues.push(msg)
      flags.push({ severity: "critical", module: m.moduleTitle, issue: msg, action: "Add at least one scenario to this module", fixUrl: moduleUrl })
    }
    if (!m.introVideoUrl) {
      const msg = "Module has no intro video"
      issues.push(msg)
      flags.push({ severity: "warning", module: m.moduleTitle, issue: msg, action: "Upload an intro video for this module", fixUrl: moduleUrl })
    }

    // ── Lesson checks ──────────────────────────────────────────────────────
    let lessonsWithVideo     = 0
    let lessonsWithContent   = 0
    let lessonsWithResources = 0

    for (const l of m.lessons) {
      const lessonUrl = `/admin/tracks/${m.trackId}/modules/${m.id}/lessons/${l.id}`

      if (!l.isActive) {
        flags.push({ severity: "info", module: m.moduleTitle, lesson: l.lessonTitle, issue: "Lesson is inactive", action: "Activate when ready", fixUrl: lessonUrl })
      }

      const hasContent = l.contentBody.trim().length > 0
      if (hasContent) lessonsWithContent++
      else {
        const msg = "Lesson has no content"
        issues.push(`${l.lessonTitle}: ${msg}`)
        flags.push({ severity: "critical", module: m.moduleTitle, lesson: l.lessonTitle, issue: msg, action: "Add content body to this lesson", fixUrl: lessonUrl })
      }

      const hasVideo = !!(l.introVideoUrl || l.mainVideoUrl)
      if (hasVideo) lessonsWithVideo++
      else {
        const msg = "Lesson has no video"
        issues.push(`${l.lessonTitle}: ${msg}`)
        flags.push({ severity: "warning", module: m.moduleTitle, lesson: l.lessonTitle, issue: msg, action: "Upload an intro or main video for this lesson", fixUrl: lessonUrl })
      }

      if (l.resources.length > 0) lessonsWithResources++
      else {
        flags.push({ severity: "warning", module: m.moduleTitle, lesson: l.lessonTitle, issue: "Lesson has no resources", action: "Add downloadable resources to this lesson", fixUrl: lessonUrl })
      }
    }

    // ── Scenario checks ────────────────────────────────────────────────────
    let scenariosWithVideo          = 0
    let scenariosWithScoredResponses = 0
    let scenariosWithExplanations   = 0

    for (const s of m.scenarios) {
      const scenarioUrl = `/admin/tracks/${m.trackId}/modules/${m.id}/scenarios/${s.id}`

      if (!s.isActive) {
        flags.push({ severity: "info", module: m.moduleTitle, scenario: s.scenarioTitle ?? "Untitled scenario", issue: "Scenario is inactive", action: "Activate when ready", fixUrl: scenarioUrl })
      }

      if (s.videoUrl) scenariosWithVideo++
      else {
        flags.push({ severity: "warning", module: m.moduleTitle, scenario: s.scenarioTitle ?? "Untitled scenario", issue: "Scenario has no video", action: "Upload a video for this scenario", fixUrl: scenarioUrl })
      }

      if (s.responses.length === 0) {
        const msg = "Scenario has no response options"
        issues.push(msg)
        flags.push({ severity: "critical", module: m.moduleTitle, scenario: s.scenarioTitle ?? "Untitled scenario", issue: msg, action: "Add response options to this scenario", fixUrl: scenarioUrl })
      } else if (s.responses.length < 2) {
        const msg = "Scenario needs at least 2 response options"
        issues.push(msg)
        flags.push({ severity: "critical", module: m.moduleTitle, scenario: s.scenarioTitle ?? "Untitled scenario", issue: msg, action: "Add more response options to this scenario", fixUrl: scenarioUrl })
      }

      const hasOptimal = s.responses.some((r) => r.isOptimal)
      if (!hasOptimal && s.responses.length > 0) {
        const msg = "No response marked as optimal"
        issues.push(msg)
        flags.push({ severity: "critical", module: m.moduleTitle, scenario: s.scenarioTitle ?? "Untitled scenario", issue: msg, action: "Mark one response as the optimal answer", fixUrl: scenarioUrl })
      }

      const allScored = s.responses.length > 0 && s.responses.every((r) => r.scoreImpact > 0)
      if (allScored) scenariosWithScoredResponses++

      const missingExplanation = s.responses.some((r) => !r.explanationText)
      if (!missingExplanation && s.responses.length > 0) {
        scenariosWithExplanations++
      } else if (s.responses.length > 0) {
        flags.push({ severity: "warning", module: m.moduleTitle, scenario: s.scenarioTitle ?? "Untitled scenario", issue: "Response missing explanation", action: "Add explanation text to all responses", fixUrl: scenarioUrl })
      }
    }

    // ── Completeness score ─────────────────────────────────────────────────
    // 8 weighted checks → 100 points
    let score = 0
    const lc = m.lessons.length
    const sc = m.scenarios.length

    score += lc > 0 ? 12 : 0                                                                     // has lessons
    score += sc > 0 ? 12 : 0                                                                      // has scenarios
    score += lc > 0 ? Math.round((lessonsWithContent / lc) * 18) : 0                             // content completeness
    score += lc > 0 ? Math.round((lessonsWithVideo / lc) * 14) : 0                               // video completeness
    score += sc > 0 ? Math.round((scenariosWithVideo / sc) * 12) : 0                             // scenario video
    score += sc > 0 ? Math.round((scenariosWithScoredResponses / sc) * 16) : 0                   // scored responses
    score += sc > 0 ? Math.round((scenariosWithExplanations / sc) * 16) : 0                      // explanations
    score = Math.min(100, score)

    modules.push({
      moduleId:                     m.id,
      trackId:                      m.trackId,
      moduleName:                   m.moduleTitle,
      beltLevel:                    m.belt.beltLevel,
      orderIndex:                   m.orderIndex,
      isActive:                     m.isActive,
      lessonCount:                  lc,
      lessonsWithVideo,
      lessonsWithContent,
      lessonsWithResources,
      scenarioCount:                sc,
      scenariosWithVideo,
      scenariosWithScoredResponses,
      scenariosWithExplanations,
      completenessScore:            score,
      issues,
    })
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  const totalLessons   = rawModules.reduce((a, m) => a + m.lessons.length, 0)
  const totalScenarios = rawModules.reduce((a, m) => a + m.scenarios.length, 0)
  const activeModules  = modules.filter((m) => m.isActive)
  const healthScore    = activeModules.length === 0
    ? 0
    : Math.round(activeModules.reduce((a, m) => a + m.completenessScore, 0) / activeModules.length)

  // Sort flags: critical → warning → info
  const severityOrder = { critical: 0, warning: 1, info: 2 }
  flags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  return {
    summary: {
      totalModules:   rawModules.length,
      totalLessons,
      totalScenarios,
      healthScore,
    },
    modules,
    flags,
  }
}
