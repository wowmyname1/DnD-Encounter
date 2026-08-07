import type { Die } from '@/types'

export interface ParseResult {
  total: number
  expression: string
  allDice: Die[]
  modifier: number
}

export function validateExpression(expr: string): { valid: boolean; error: string | null } {
  if (!expr || !expr.trim()) return { valid: false, error: null }
  expr = expr.trim().toLowerCase()

  if (/[^0-9dkhl+\-\s]/.test(expr)) {
    return { valid: false, error: 'Недопустимые символы' }
  }
  if (!/^[\d+\-]/.test(expr)) {
    return { valid: false, error: 'Должно начинаться с числа или +/-' }
  }

  const tokens = tokenize(expr)
  if (tokens.length === 0) return { valid: false, error: 'Пустое выражение' }

  for (const t of tokens) {
    const raw = t.raw.trim()
    if (!raw) return { valid: false, error: 'Пустой токен' }
    if (/^\d+$/.test(raw)) continue

    const match = raw.match(/^(\d*)d(\d+)(kh|kl)?(\d*)$/)
    if (!match) return { valid: false, error: `Неверный формат: "${raw}"` }

    const num = match[1] ? parseInt(match[1]) : 1
    const sides = parseInt(match[2])
    const keepType = match[3]
    const keepCount = match[4] ? parseInt(match[4]) : num

    if (num < 1 || num > 100) return { valid: false, error: 'Количество: 1–100' }
    if (sides < 2 || sides > 1000) return { valid: false, error: 'Грани: 2–1000' }
    if (keepType && keepCount > num) {
      return { valid: false, error: `Нельзя оставить ${keepCount} из ${num}` }
    }
  }

  return { valid: true, error: null }
}

interface Token {
  raw: string
  sign: '+' | '-'
}

function tokenize(expr: string): Token[] {
  const tokens: Token[] = []
  let current = ''
  let sign: '+' | '-' = '+'

  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i]
    if ((ch === '+' || ch === '-') && i > 0) {
      const prev2 = expr.substring(Math.max(0, i - 2), i)
      if (prev2.endsWith('kh') || prev2.endsWith('kl')) {
        current += ch
        continue
      }
      if (current) tokens.push({ raw: current, sign })
      current = ''
      sign = ch as '+' | '-'
    } else {
      current += ch
    }
  }
  if (current) tokens.push({ raw: current, sign })
  return tokens
}

export function parseDiceExpression(expr: string): ParseResult {
  expr = expr.replace(/\s+/g, '').toLowerCase()
  const tokens = tokenize(expr)

  let total = 0
  let modifier = 0
  const allDice: Die[] = []

  for (const token of tokens) {
    const match = token.raw.match(/^(\d*)d(\d+)(kh|kl)?(\d*)$/)
    if (match) {
      const num = parseInt(match[1]) || 1
      const sides = parseInt(match[2])
      const keepType = match[3] as 'kh' | 'kl' | undefined
      const keepCount = match[4] !== undefined && match[4] !== '' ? parseInt(match[4]) : num

      const rolls: number[] = []
      for (let i = 0; i < num; i++) {
        rolls.push(Math.floor(Math.random() * sides) + 1)
      }

      let keptIndices = rolls.map((_, i) => i)
      if (keepType) {
        const indexed = rolls.map((value, i) => ({ value, i }))
        indexed.sort((a, b) =>
          keepType === 'kh' ? b.value - a.value : a.value - b.value
        )
        keptIndices = indexed.slice(0, keepCount).map(x => x.i)
      }

      const keptSet = new Set(keptIndices)

      rolls.forEach((value, i) => {
        allDice.push({
          id: allDice.length,
          value,
          sides,
          selected: keptSet.has(i),
          spent: false,
          dropped: !!keepType && !keptSet.has(i),
          sign: token.sign,
        })
      })

      const sum = rolls
        .filter((_, i) => keptSet.has(i))
        .reduce((a, b) => a + b, 0)

      total += token.sign === '+' ? sum : -sum
    } else {
      const num = parseInt(token.raw)
      if (!isNaN(num)) {
        modifier += token.sign === '+' ? num : -num
        total += token.sign === '+' ? num : -num
      }
    }
  }

  return { total, expression: expr, allDice, modifier }
}
