export const emotions = [
  { emoji: '😔', label: '우울함' },
  { emoji: '🔥', label: '신남' },
  { emoji: '😴', label: '나른함' },
  { emoji: '😤', label: '화남' },
  { emoji: '🥰', label: '설렘' },
  { emoji: '😌', label: '평온함' },
] as const;

export const weathers = [
  { emoji: '☀️', label: '맑음' },
  { emoji: '🌧️', label: '비' },
  { emoji: '☁️', label: '흐림' },
  { emoji: '❄️', label: '눈' },
] as const;

export const moodEmoji: Record<string, string> = Object.fromEntries(
  emotions.map((e) => [e.label, e.emoji])
);

export const weatherEmoji: Record<string, string> = Object.fromEntries(
  weathers.map((w) => [w.label, w.emoji])
);
