export const MODEL_OPTIONS = ['V1.0', 'V2.0'] as const

export const STYLE_PRESETS = [
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-orange-500 to-red-500',
  'from-emerald-500 to-teal-500',
  'from-rose-500 to-amber-500',
  'from-indigo-500 to-violet-500',
]

export const SIZE_OPTIONS = [
  { value: '1:1', key: 'tool.sizes.square' },
  { value: '4:3', key: 'tool.sizes.landscape' },
  { value: '3:4', key: 'tool.sizes.portrait' },
  { value: '16:9', key: 'tool.sizes.widescreen' },
] as const
