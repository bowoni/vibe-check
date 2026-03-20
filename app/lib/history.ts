export interface HistoryEntry {
  id: string;
  mood: string;
  emoji: string;
  weather: string;
  weatherEmoji: string;
  createdAt: string;
  trackCount: number;
}

interface FetchHistoryResult {
  history: HistoryEntry[];
  unauthorized: boolean;
}

export async function fetchHistory(): Promise<FetchHistoryResult> {
  try {
    const res = await fetch('/api/history');
    if (res.status === 401) return { history: [], unauthorized: true };
    if (!res.ok) return { history: [], unauthorized: false };
    const data = await res.json();
    return { history: data.history || [], unauthorized: false };
  } catch {
    return { history: [], unauthorized: false };
  }
}

export async function addHistory(entry: {
  mood: string;
  emoji: string;
  weather: string;
  weatherEmoji: string;
  trackCount: number;
}) {
  await fetch('/api/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
}

export function getMonthlyStats(history: HistoryEntry[], year: number) {
  const result: { label: string; count: number }[] = [];

  for (let month = 0; month < 12; month++) {
    const count = history.filter((h) => {
      const hd = new Date(h.createdAt);
      return hd.getFullYear() === year && hd.getMonth() === month;
    }).length;

    result.push({ label: `${month + 1}`, count });
  }

  return result;
}

export function getWeeklyStats(history: HistoryEntry[], year: number, month: number) {
  const lastDate = new Date(year, month + 1, 0).getDate();
  const weekRanges: [number, number][] = [
    [1, 7], [8, 14], [15, 21], [22, 28],
  ];
  if (lastDate > 28) weekRanges.push([29, lastDate]);

  return weekRanges.map(([start, end], i) => {
    const rangeStart = new Date(year, month, start, 0, 0, 0, 0);
    const rangeEnd = new Date(year, month, Math.min(end, lastDate) + 1, 0, 0, 0, 0);

    const count = history.filter((h) => {
      const hd = new Date(h.createdAt);
      return hd >= rangeStart && hd < rangeEnd;
    }).length;

    return { label: `${i + 1}주`, count };
  });
}

export function getDailyStats(history: HistoryEntry[], offset: number) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const result: { label: string; count: number }[] = [];

  const baseDate = new Date(now);
  baseDate.setDate(now.getDate() - offset * 7);

  for (let i = 6; i >= 0; i--) {
    const day = new Date(baseDate);
    day.setDate(baseDate.getDate() - i);
    const nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);

    const count = history.filter((h) => {
      const hd = new Date(h.createdAt);
      return hd >= day && hd < nextDay;
    }).length;

    result.push({
      label: `${day.getMonth() + 1}/${day.getDate()}`,
      count,
    });
  }

  return result;
}

export function getEmotionStats(history: HistoryEntry[]) {
  const map = new Map<string, { emoji: string; count: number }>();

  for (const h of history) {
    const existing = map.get(h.mood);
    if (existing) {
      existing.count++;
    } else {
      map.set(h.mood, { emoji: h.emoji, count: 1 });
    }
  }

  return Array.from(map.entries())
    .map(([mood, { emoji, count }]) => ({ mood, emoji, count }))
    .sort((a, b) => b.count - a.count);
}
