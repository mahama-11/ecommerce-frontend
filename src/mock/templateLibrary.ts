export const MY_TEMPLATE_STORAGE_KEY = 'ae_mock_my_templates'

export interface SavedTemplateRecord {
  id: string
  platform: string
  tags: string[]
  usageCount: string
  favorite: number
  savedAt: string
  sourceType?: 'market' | 'chat' | 'design'
  sourceLabel?: string
  zh: {
    title: string
    summary: string
    scenario: string
  }
  en: {
    title: string
    summary: string
    scenario: string
  }
}

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function getSavedTemplates(): SavedTemplateRecord[] {
  if (!canUseStorage()) return []

  const raw = window.localStorage.getItem(MY_TEMPLATE_STORAGE_KEY)
  if (!raw) return []

  try {
    return JSON.parse(raw) as SavedTemplateRecord[]
  } catch {
    return []
  }
}

export function saveTemplateRecord(template: SavedTemplateRecord) {
  if (!canUseStorage()) return []

  const existing = getSavedTemplates()
  const next = [template, ...existing.filter(item => item.id !== template.id)]
  window.localStorage.setItem(MY_TEMPLATE_STORAGE_KEY, JSON.stringify(next))
  return next
}
