"use client"

import { useState } from "react"

export interface OptionItem {
  id?: string
  optionText: string
  isCorrect: boolean
  explanation: string | null
  displayOrder: number
}

export interface QuestionItem {
  id: string
  questionText: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
  moduleTag: string | null
  isActive: boolean
  createdAt: string
  options: OptionItem[]
}

interface ModuleOption {
  id: string
  moduleTitle: string
}

interface Props {
  initialQuestions: QuestionItem[]
  modules: ModuleOption[]
}

interface FormOption {
  optionText: string
  isCorrect: boolean
  explanation: string
}

interface ModalForm {
  questionText: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
  moduleTag: string
  isActive: boolean
  options: FormOption[]
}

function emptyForm(): ModalForm {
  return {
    questionText: "",
    difficulty: "MEDIUM",
    moduleTag: "",
    isActive: true,
    options: [
      { optionText: "", isCorrect: true, explanation: "" },
      { optionText: "", isCorrect: false, explanation: "" },
    ],
  }
}

function difficultyBadge(d: "EASY" | "MEDIUM" | "HARD") {
  if (d === "EASY") return "bg-green-100 text-green-700"
  if (d === "MEDIUM") return "bg-amber-100 text-amber-700"
  return "bg-red-100 text-red-700"
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] ${
          checked ? "bg-[#1E3A5F]" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
  )
}

export default function ExamQuestionBank({ initialQuestions, modules }: Props) {
  const [questions, setQuestions] = useState<QuestionItem[]>(initialQuestions)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<QuestionItem | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const [modalForm, setModalForm] = useState<ModalForm>(emptyForm())

  // Summary stats
  const total = questions.length
  const active = questions.filter((q) => q.isActive)
  const easyCount = active.filter((q) => q.difficulty === "EASY").length
  const mediumCount = active.filter((q) => q.difficulty === "MEDIUM").length
  const hardCount = active.filter((q) => q.difficulty === "HARD").length

  function openCreate() {
    setEditingQuestion(null)
    setModalForm(emptyForm())
    setModalError("")
    setValidationErrors([])
    setModalOpen(true)
  }

  function openEdit(q: QuestionItem) {
    setEditingQuestion(q)
    const opts: FormOption[] = q.options.map((o) => ({
      optionText: o.optionText,
      isCorrect: o.isCorrect,
      explanation: o.explanation ?? "",
    }))
    while (opts.length < 2) opts.push({ optionText: "", isCorrect: false, explanation: "" })
    setModalForm({
      questionText: q.questionText,
      difficulty: q.difficulty,
      moduleTag: q.moduleTag ?? "",
      isActive: q.isActive,
      options: opts,
    })
    setModalError("")
    setValidationErrors([])
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingQuestion(null)
    setModalError("")
    setValidationErrors([])
  }

  function updateOption(index: number, field: keyof FormOption, value: string | boolean) {
    setModalForm((prev) => {
      const opts = prev.options.map((o, i) => {
        if (i === index) return { ...o, [field]: value }
        // Radio behaviour: uncheck all other isCorrect when this one is set
        if (field === "isCorrect" && value === true) return { ...o, isCorrect: false }
        return o
      })
      return { ...prev, options: opts }
    })
  }

  function addOption() {
    if (modalForm.options.length < 6) {
      setModalForm((prev) => ({
        ...prev,
        options: [...prev.options, { optionText: "", isCorrect: false, explanation: "" }],
      }))
    }
  }

  function removeOption(index: number) {
    if (modalForm.options.length > 2) {
      setModalForm((prev) => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }))
    }
  }

  function validateModal(): string[] {
    const errors: string[] = []
    if (!modalForm.questionText.trim()) errors.push("Question text is required")
    const filled = modalForm.options.filter((o) => o.optionText.trim() !== "")
    if (filled.length < 2) errors.push("At least 2 answer options must be filled in")
    const correct = filled.filter((o) => o.isCorrect)
    if (correct.length !== 1) errors.push("Exactly one option must be marked as the correct answer")
    return errors
  }

  async function handleModalSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errors = validateModal()
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }
    setValidationErrors([])
    setModalLoading(true)
    setModalError("")

    const payload = {
      questionText: modalForm.questionText,
      difficulty: modalForm.difficulty,
      moduleTag: modalForm.moduleTag || null,
      isActive: modalForm.isActive,
      options: modalForm.options.filter((o) => o.optionText.trim() !== ""),
    }

    try {
      const url = editingQuestion
        ? `/api/admin/exam/questions/${editingQuestion.id}`
        : "/api/admin/exam/questions"
      const method = editingQuestion ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setModalError(data.error || "Something went wrong")
        setModalLoading(false)
        return
      }
      if (editingQuestion) {
        setQuestions((prev) =>
          prev.map((q) => (q.id === editingQuestion.id ? data : q))
        )
      } else {
        setQuestions((prev) => [data, ...prev])
      }
      closeModal()
    } catch {
      setModalError("Something went wrong")
    } finally {
      setModalLoading(false)
    }
  }

  async function handleDelete(questionId: string) {
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/admin/exam/questions/${questionId}`, { method: "DELETE" })
      if (res.ok) {
        setQuestions((prev) =>
          prev.map((q) => (q.id === questionId ? { ...q, isActive: false } : q))
        )
      }
    } finally {
      setDeleteLoading(false)
      setDeleteConfirmId(null)
    }
  }

  return (
    <div>
      {/* Summary bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-gray-900">{total} questions total</span>
          {" · "}
          <span className="font-medium text-gray-700">{active.length} active</span>
          {" — "}
          <span className="text-green-700 font-medium">{easyCount} Easy</span>
          {" · "}
          <span className="text-amber-700 font-medium">{mediumCount} Medium</span>
          {" · "}
          <span className="text-red-700 font-medium">{hardCount} Hard</span>
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="bg-[#F97316] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#ea6c0a] transition-colors"
        >
          + Add question
        </button>
      </div>

      {/* Question list */}
      {questions.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No questions yet. Add your first exam question.</p>
          <button
            type="button"
            onClick={openCreate}
            className="bg-[#1E3A5F] text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-[#162d4a]"
          >
            Add question
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <div
              key={q.id}
              className={`bg-white rounded-lg border p-4 ${
                q.isActive ? "border-gray-200" : "border-gray-100 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${difficultyBadge(
                        q.difficulty
                      )}`}
                    >
                      {q.difficulty}
                    </span>
                    {q.moduleTag && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#1E3A5F]/10 text-[#1E3A5F]">
                        {q.moduleTag}
                      </span>
                    )}
                    {!q.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        Inactive
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {q.options.length} option{q.options.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 line-clamp-2">{q.questionText}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => openEdit(q)}
                    className="text-sm text-[#1E3A5F] hover:underline"
                  >
                    Edit
                  </button>
                  {deleteConfirmId === q.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">Delete?</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(q.id)}
                        disabled={deleteLoading}
                        className="text-xs text-red-600 font-medium hover:underline disabled:opacity-50"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(null)}
                        className="text-xs text-gray-500 hover:underline"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(q.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:items-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
            aria-hidden="true"
          />

          {/* Modal panel */}
          <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1E3A5F]">
                {editingQuestion ? "Edit question" : "Add question"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="p-6 space-y-5">
              {modalError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  {modalError}
                </div>
              )}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                  {validationErrors.map((err, i) => (
                    <p key={i} className="text-sm text-red-700">
                      {err}
                    </p>
                  ))}
                </div>
              )}

              {/* Question text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question text <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={modalForm.questionText}
                  onChange={(e) =>
                    setModalForm({ ...modalForm, questionText: e.target.value })
                  }
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                  placeholder="Enter the exam question..."
                  required
                />
              </div>

              {/* Difficulty + Module tag */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={modalForm.difficulty}
                    onChange={(e) =>
                      setModalForm({
                        ...modalForm,
                        difficulty: e.target.value as "EASY" | "MEDIUM" | "HARD",
                      })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Module tag (optional)
                  </label>
                  <select
                    value={modalForm.moduleTag}
                    onChange={(e) =>
                      setModalForm({ ...modalForm, moduleTag: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                  >
                    <option value="">— None —</option>
                    {modules.map((m) => (
                      <option key={m.id} value={m.moduleTitle}>
                        {m.moduleTitle}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active toggle */}
              <Toggle
                checked={modalForm.isActive}
                onChange={(v) => setModalForm({ ...modalForm, isActive: v })}
                label="Active (included in exam)"
              />

              {/* Answer options */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Answer options
                    <span className="text-gray-400 font-normal ml-1">(2–6)</span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    Select the radio button next to the correct answer
                  </p>
                </div>

                <div className="space-y-4">
                  {modalForm.options.map((opt, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-lg p-4 ${
                        opt.isCorrect ? "border-green-300 bg-green-50/30" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        {/* Correct radio */}
                        <div className="flex items-center mt-1">
                          <input
                            type="radio"
                            name="correctOption"
                            id={`opt-correct-${idx}`}
                            checked={opt.isCorrect}
                            onChange={() => updateOption(idx, "isCorrect", true)}
                            className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={`opt-correct-${idx}`}
                            className="block text-xs font-medium text-gray-600 mb-1"
                          >
                            Option {idx + 1}
                            {opt.isCorrect && (
                              <span className="ml-2 text-green-600 font-semibold">
                                ✓ Correct
                              </span>
                            )}
                          </label>
                          <textarea
                            value={opt.optionText}
                            onChange={(e) =>
                              updateOption(idx, "optionText", e.target.value)
                            }
                            rows={2}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                            placeholder={`Answer option ${idx + 1}...`}
                          />
                        </div>
                        {modalForm.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(idx)}
                            className="text-xs text-red-500 hover:text-red-700 mt-1 flex-shrink-0"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Explanation (shown after answering — optional)
                        </label>
                        <textarea
                          value={opt.explanation}
                          onChange={(e) =>
                            updateOption(idx, "explanation", e.target.value)
                          }
                          rows={2}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                          placeholder="Why this answer is correct or incorrect..."
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {modalForm.options.length < 6 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="mt-3 flex items-center gap-1.5 text-sm text-[#1E3A5F] font-medium hover:underline"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add option
                  </button>
                )}
              </div>

              {/* Modal actions */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="bg-[#1E3A5F] text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-[#162d4a] disabled:opacity-50 transition-colors"
                >
                  {modalLoading
                    ? "Saving…"
                    : editingQuestion
                    ? "Save changes"
                    : "Create question"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
