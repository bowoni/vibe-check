'use client';

import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { fetchHistory, getMonthlyStats, getWeeklyStats, getDailyStats, getEmotionStats, type HistoryEntry } from '../lib/history';

interface HistoryScreenProps {
  onBack: () => void;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function HistoryScreen({}: HistoryScreenProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [error, setError] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [chartPeriod, setChartPeriod] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());
  const [weeklyYear, setWeeklyYear] = useState(new Date().getFullYear());
  const [weeklyMonth, setWeeklyMonth] = useState(new Date().getMonth());
  const [dailyOffset, setDailyOffset] = useState(0);

  const handleRetry = () => {
    setLoading(true);
    setError(false);
    fetchHistory()
      .then((result) => {
        setHistory(result.history);
        setUnauthorized(result.unauthorized);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;

    fetchHistory()
      .then((result) => {
        if (cancelled) return;
        setHistory(result.history);
        setUnauthorized(result.unauthorized);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const chartData = useMemo(() => {
    if (chartPeriod === 'monthly') return getMonthlyStats(history, monthlyYear);
    if (chartPeriod === 'weekly') return getWeeklyStats(history, weeklyYear, weeklyMonth);
    return getDailyStats(history, dailyOffset);
  }, [history, chartPeriod, monthlyYear, weeklyYear, weeklyMonth, dailyOffset]);

  const navLabel = useMemo(() => {
    if (chartPeriod === 'monthly') return `${monthlyYear}년`;
    if (chartPeriod === 'weekly') return `${weeklyYear}년 ${weeklyMonth + 1}월`;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setDate(now.getDate() - dailyOffset * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    return `${start.getMonth() + 1}/${start.getDate()} ~ ${end.getMonth() + 1}/${end.getDate()}`;
  }, [chartPeriod, monthlyYear, weeklyYear, weeklyMonth, dailyOffset]);

  const canGoNext =
    chartPeriod === 'monthly'
      ? monthlyYear < new Date().getFullYear()
      : chartPeriod === 'weekly'
        ? !(weeklyYear === new Date().getFullYear() && weeklyMonth === new Date().getMonth())
        : dailyOffset > 0;

  const handlePrev = () => {
    if (chartPeriod === 'monthly') {
      setMonthlyYear((y) => y - 1);
    } else if (chartPeriod === 'weekly') {
      if (weeklyMonth === 0) { setWeeklyYear((y) => y - 1); setWeeklyMonth(11); }
      else setWeeklyMonth((m) => m - 1);
    } else {
      setDailyOffset((o) => o + 1);
    }
  };

  const handleNext = () => {
    if (chartPeriod === 'monthly') {
      setMonthlyYear((y) => y + 1);
    } else if (chartPeriod === 'weekly') {
      if (weeklyMonth === 11) { setWeeklyYear((y) => y + 1); setWeeklyMonth(0); }
      else setWeeklyMonth((m) => m + 1);
    } else {
      setDailyOffset((o) => Math.max(0, o - 1));
    }
  };

  const emotionStats = getEmotionStats(history);
  const maxEmotionCount = emotionStats.length > 0 ? emotionStats[0].count : 0;

  if (loading) {
    return (
      <div className="flex flex-col h-full p-5 md:p-7 bg-sp-dark">
        <div className="h-8 w-32 skeleton mb-6" />
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="h-20 rounded-xl skeleton" />
          <div className="h-20 rounded-xl skeleton" />
        </div>
        <div className="h-48 rounded-xl skeleton mb-6" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3.5">
              <div className="w-11 h-11 rounded skeleton flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-1/2 skeleton" />
                <div className="h-3 w-2/3 skeleton" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (unauthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-5 bg-sp-dark">
        <p className="text-4xl mb-4">🔒</p>
        <p className="font-bold text-lg mb-2 text-sp-white">세션이 만료되었어요</p>
        <p className="text-sm text-center mb-6 text-sp-sub">
          다시 로그인하면 기록을 확인할 수 있어요
        </p>
        <a
          href="/api/auth/login"
          className="px-6 py-3 rounded-full font-bold text-sm bg-sp-green text-black"
        >
          다시 로그인하기
        </a>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-5 bg-sp-dark">
        <p className="text-4xl mb-4">😅</p>
        <p className="font-bold text-lg mb-2 text-sp-white">기록을 불러오지 못했어요</p>
        <p className="text-sm text-center mb-6 text-sp-sub">
          네트워크 연결을 확인하고 다시 시도해주세요
        </p>
        <button
          onClick={handleRetry}
          className="px-6 py-3 rounded-full font-bold text-sm bg-sp-green text-black"
        >
          다시 시도하기
        </button>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-5 bg-sp-dark">
        <p className="text-4xl mb-4">📊</p>
        <p className="font-bold text-lg mb-2 text-sp-white">아직 기록이 없어요</p>
        <p className="text-sm text-center text-sp-sub">
          감정 진단을 시작하면<br />여기에 기록이 쌓여요
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-5 md:p-7 overflow-y-auto bg-sp-dark scrollbar-none">
      {/* Title */}
      <h2 className="text-2xl font-bold mb-6 text-sp-white">My Vibes</h2>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-4 rounded-xl bg-sp-card">
          <p className="text-xs font-bold tracking-widest uppercase mb-1 text-sp-sub">총 진단</p>
          <p className="text-2xl font-bold text-sp-green">{history.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-sp-card">
          <p className="text-xs font-bold tracking-widest uppercase mb-1 text-sp-sub">최다 감정</p>
          <p className="text-2xl font-bold text-sp-white">
            {emotionStats[0]?.emoji || '-'}{' '}
            <span className="text-sm font-semibold text-sp-sub">
              {emotionStats[0]?.mood || ''}
            </span>
          </p>
        </div>
      </div>

      {/* 진단 횟수 차트 */}
      <div className="mb-6 p-4 rounded-xl border bg-sp-card border-sp-elevated">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold tracking-widest uppercase text-sp-sub">
            진단 횟수
          </h3>
          <div className="flex gap-1">
            {([['monthly', '월별'], ['weekly', '주별'], ['daily', '일별']] as const).map(
              ([key, label]) => (
                <button
                  key={key}
                  onClick={() => setChartPeriod(key)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                    chartPeriod === key
                      ? 'bg-sp-green text-black'
                      : 'text-sp-sub hover:text-sp-white'
                  }`}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 mb-3">
          <button
            onClick={handlePrev}
            className="p-1 rounded-md transition-colors text-sp-sub hover:text-sp-white"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-semibold text-sp-white min-w-[100px] text-center">
            {navLabel}
          </span>
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className={`p-1 rounded-md transition-colors ${
              canGoNext ? 'text-sp-sub hover:text-sp-white' : 'text-sp-disabled cursor-default'
            }`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData} barCategoryGap="30%">
            <XAxis
              dataKey="label"
              tick={{ fill: '#6A6A6A', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fill: '#6A6A6A', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={24}
              allowDecimals={false}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#1DB954" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 감정별 통계 */}
      <div className="mb-6 p-4 rounded-xl border bg-sp-card border-sp-elevated">
        <h3 className="text-xs font-bold tracking-widest uppercase mb-4 text-sp-sub">
          감정별 통계
        </h3>
        <div className="space-y-3">
          {emotionStats.map((stat) => (
            <div key={stat.mood} className="flex items-center gap-3">
              <span className="text-lg w-7 text-center flex-shrink-0">{stat.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-sp-white">{stat.mood}</span>
                  <span className="text-xs text-sp-sub">{stat.count}회</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-sp-elevated">
                  <div
                    className="h-full rounded-full transition-all duration-300 bg-sp-green"
                    style={{
                      width: `${maxEmotionCount > 0 ? (stat.count / maxEmotionCount) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 기록 */}
      <div>
        <h3 className="text-xs font-bold tracking-widest uppercase mb-4 text-sp-sub">
          최근 기록
        </h3>
        <div className="space-y-2">
          {history.slice(0, visibleCount).map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3.5 rounded-lg transition-colors bg-sp-card hover:bg-sp-elevated"
            >
              <div className="w-11 h-11 rounded flex items-center justify-center text-xl flex-shrink-0 bg-sp-elevated">
                {item.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-sp-white">{item.mood}</p>
                <p className="text-xs mt-0.5 text-sp-sub">
                  {formatDate(item.createdAt)} · {item.weatherEmoji} {item.weather}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-sm text-sp-green">{item.trackCount}</p>
                <p className="text-xs text-sp-muted">tracks</p>
              </div>
            </div>
          ))}
        </div>
        {history.length > visibleCount && (
          <button
            onClick={() => setVisibleCount((prev) => prev + 5)}
            className="w-full mt-3 py-2.5 rounded-lg text-sm font-semibold transition-colors bg-sp-elevated text-sp-sub hover:text-sp-white"
          >
            더보기 ({history.length - visibleCount}개)
          </button>
        )}
      </div>
    </div>
  );
}
