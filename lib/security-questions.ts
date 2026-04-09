import bcrypt from "bcryptjs"

export const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What was the name of the street you grew up on?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What was the make of your first car?",
  "What city were you born in?",
  "What is the name of your closest childhood friend?",
  "What was your childhood nickname?",
  "What was the first concert you attended?",
  "What is your oldest sibling's middle name?",
]

/** Normalise answer: trim whitespace and lowercase */
function normalise(answer: string): string {
  return answer.trim().toLowerCase()
}

/** Hash a security answer */
export async function hashAnswer(answer: string): Promise<string> {
  return bcrypt.hash(normalise(answer), 10)
}

/** Verify a security answer against a stored hash */
export async function verifyAnswer(answer: string, hash: string): Promise<boolean> {
  return bcrypt.compare(normalise(answer), hash)
}
