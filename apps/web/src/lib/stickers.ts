// Sticker packs — emoji-based stickers for room objects and chat
export const STICKER_PACKS = {
  reactions: {
    label: 'Reactions',
    stickers: ['😀', '😂', '🥰', '😎', '🤔', '😱', '🤯', '🥳', '😴', '🤡', '👍', '👎', '❤️', '🔥', '💯', '⭐', '🎉', '💀', '👀', '🙌']
  },
  animals: {
    label: 'Animals',
    stickers: ['🐶', '🐱', '🐼', '🦊', '🐸', '🐵', '🦁', '🐧', '🦄', '🐝', '🦋', '🐙', '🐬', '🦩', '🐨']
  },
  food: {
    label: 'Food',
    stickers: ['🍕', '🍔', '🌮', '🍣', '🍩', '🧁', '🍪', '☕', '🍺', '🧃', '🍿', '🌶️', '🍇', '🍓', '🥑']
  },
  objects: {
    label: 'Objects',
    stickers: ['🎮', '🎧', '📱', '💻', '🎸', '🎤', '📸', '🎨', '🏆', '💡', '🔑', '💎', '🚀', '⚡', '🌈']
  }
} as const;

export type StickerPackKey = keyof typeof STICKER_PACKS;

export const ALL_STICKER_KEYS = Object.keys(STICKER_PACKS) as StickerPackKey[];
