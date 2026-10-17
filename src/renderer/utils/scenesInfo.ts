export type Scene = {
  id: number
  name: string
  type: 'static' | 'dynamic'
  /** Swatch color; dynamic scenes add a second one for a gradient. */
  hex: string
  hex2?: string
}

export const scenes: Scene[] = [
  { id: 11, name: 'warmWhite', type: 'static', hex: '#ffc979' },
  { id: 12, name: 'dayLight', type: 'static', hex: '#eef2ff' },
  { id: 13, name: 'coldWhite', type: 'static', hex: '#d6e4ff' },
  { id: 14, name: 'nightLight', type: 'static', hex: '#ff9e45' },
  { id: 6, name: 'cozy', type: 'static', hex: '#ffb35c' },
  { id: 17, name: 'trueColors', type: 'static', hex: '#fff1d6' },
  { id: 16, name: 'relax', type: 'static', hex: '#ffb066' },
  { id: 15, name: 'focus', type: 'static', hex: '#f6f1e2' },
  { id: 18, name: 'tvTime', type: 'static', hex: '#7d8cff' },
  { id: 19, name: 'plantGrowth', type: 'static', hex: '#c45cff' },
  { id: 29, name: 'candleLight', type: 'dynamic', hex: '#ffa64d', hex2: '#ffcf6b' },
  { id: 31, name: 'pulse', type: 'dynamic', hex: '#f2f4f8', hex2: '#9aa6bf' },
  { id: 30, name: 'goldenWhite', type: 'dynamic', hex: '#ffcf6b', hex2: '#ffe7b0' },
  { id: 32, name: 'steampunk', type: 'dynamic', hex: '#c9853a', hex2: '#6b4a2b' },
  { id: 5, name: 'fireplace', type: 'dynamic', hex: '#ff6a2b', hex2: '#ffb35c' },
  { id: 22, name: 'fall', type: 'dynamic', hex: '#d9732b', hex2: '#a8452a' },
  { id: 26, name: 'club', type: 'dynamic', hex: '#5a2fe0', hex2: '#e2477a' },
  { id: 3, name: 'sunset', type: 'dynamic', hex: '#ff8a4c', hex2: '#e2477a' },
  { id: 2, name: 'romance', type: 'dynamic', hex: '#e2477a', hex2: '#ff8fb0' },
  { id: 4, name: 'party', type: 'dynamic', hex: '#d43fd1', hex2: '#5a2fe0' },
  { id: 8, name: 'pastelColors', type: 'dynamic', hex: '#ffc4e1', hex2: '#b8e1ff' },
  { id: 20, name: 'spring', type: 'dynamic', hex: '#ffd1e8', hex2: '#b9f2c4' },
  { id: 21, name: 'summer', type: 'dynamic', hex: '#ffd23f', hex2: '#ff8a4c' },
  { id: 7, name: 'forest', type: 'dynamic', hex: '#3f9a52', hex2: '#a3c94b' },
  { id: 24, name: 'jungle', type: 'dynamic', hex: '#2e8a4a', hex2: '#1f6b5f' },
  { id: 25, name: 'mojito', type: 'dynamic', hex: '#7ad36b', hex2: '#e9f7b0' },
  { id: 1, name: 'ocean', type: 'dynamic', hex: '#2f7fd8', hex2: '#38c6c9' },
  { id: 23, name: 'deepDive', type: 'dynamic', hex: '#1b4fa8', hex2: '#38c6c9' },
  { id: 27, name: 'christmas', type: 'dynamic', hex: '#d93b3b', hex2: '#2e8a4a' },
  { id: 28, name: 'halloween', type: 'dynamic', hex: '#ff7a1a', hex2: '#7b3fd1' },
  { id: 10, name: 'bedtime', type: 'dynamic', hex: '#ff9e45', hex2: '#a35a2b' },
  { id: 9, name: 'wakeUp', type: 'dynamic', hex: '#ffd8a8', hex2: '#fff3dc' }
]
