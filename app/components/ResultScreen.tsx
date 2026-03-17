'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ExternalLink, Music, Play, Pause } from 'lucide-react';
import { addHistory } from '../lib/history';
import { moodEmoji, weatherEmoji } from '../lib/constants';

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks: { total: number };
  external_urls: { spotify: string };
  owner: { display_name: string };
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  external_urls: { spotify: string };
  duration_ms: number;
  preview_url: string | null;
}

interface ResultScreenProps {
  onBack: () => void;
  onRetry: () => void;
  mood: string;
  weather: string;
}

type Tab = 'tracks' | 'playlists';

function formatDuration(ms: number) {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function ResultScreen({ onBack, onRetry, mood, weather }: ResultScreenProps) {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('tracks');
  const historySaved = useRef(false);
  const [fetchKey, setFetchKey] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePreview = (trackId: string, previewUrl: string) => {
    if (playingId === trackId) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(previewUrl);
    audio.volume = 0.5;
    audio.play();
    audio.onended = () => setPlayingId(null);
    audioRef.current = audio;
    setPlayingId(trackId);
  };

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    historySaved.current = false;
    setLoading(true);
    setErrorType('');
    setErrorMessage('');

    const params = `mood=${encodeURIComponent(mood)}&weather=${encodeURIComponent(weather)}`;

    Promise.all([
      fetch(`/api/spotify/playlists?${params}`)
        .then(async (res) => {
          if (res.ok) return res.json();
          const body = await res.json().catch(() => ({}));
          throw { type: body.error || 'unknown', message: body.message || '오류가 발생했어요' };
        }),
      fetch(`/api/spotify/recommendations?${params}`)
        .then(async (res) => {
          if (res.ok) return res.json();
          return { tracks: [] };
        }),
    ])
      .then(([playlistData, trackData]) => {
        const lists = playlistData.playlists || [];
        const recTracks = trackData.tracks || [];
        setPlaylists(lists);
        setTracks(recTracks);

        const totalCount = lists.length + recTracks.length;
        if (totalCount > 0 && !historySaved.current) {
          historySaved.current = true;
          addHistory({
            mood,
            emoji: moodEmoji[mood] || '🎵',
            weather,
            weatherEmoji: weatherEmoji[weather] || '🌤️',
            trackCount: totalCount,
          });
        }
      })
      .catch((err) => {
        if (err && err.type) {
          setErrorType(err.type);
          setErrorMessage(err.message);
        } else {
          setErrorType('network_error');
          setErrorMessage('네트워크 연결을 확인해주세요');
        }
      })
      .finally(() => setLoading(false));
  }, [mood, weather, fetchKey]);

  const handleRefetch = () => setFetchKey((k) => k + 1);

  const hasError = errorType !== '';
  const hasResults = playlists.length > 0 || tracks.length > 0;
  const isAuthError = errorType === 'unauthorized' || errorType === 'token_expired';
  const isRetryable = errorType === 'network_error' || errorType === 'rate_limit' || errorType === 'spotify_error';

  return (
    <div className="flex flex-col h-full p-5 md:p-7 bg-sp-dark">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-full transition-colors text-sp-sub hover:text-sp-white"
        >
          <ArrowLeft size={22} />
        </button>
      </div>

      {/* Mood Badge */}
      <div className="flex items-center mb-6">
        <div className="inline-flex items-center gap-2.5 px-4 py-3 rounded-xl bg-sp-elevated">
          <span className="text-2xl">{moodEmoji[mood] || '🎵'}</span>
          <div>
            <p className="font-bold text-sm text-sp-white">{mood}</p>
            <p className="text-xs text-sp-sub">{weather} 날씨</p>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      {!loading && !hasError && hasResults && (
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setActiveTab('tracks')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeTab === 'tracks'
                ? 'bg-sp-green text-black'
                : 'bg-sp-elevated text-sp-sub hover:text-sp-white'
            }`}
          >
            추천 트랙 {tracks.length > 0 && `(${tracks.length})`}
          </button>
          <button
            onClick={() => setActiveTab('playlists')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeTab === 'playlists'
                ? 'bg-sp-green text-black'
                : 'bg-sp-elevated text-sp-sub hover:text-sp-white'
            }`}
          >
            플레이리스트 {playlists.length > 0 && `(${playlists.length})`}
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto mb-4 scrollbar-none">
        {loading && (
          <div className="space-y-3 pt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5">
                <div className="w-5 h-3 skeleton" />
                <div className="w-11 h-11 rounded skeleton flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-3/4 skeleton" />
                  <div className="h-3 w-1/2 skeleton" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && hasError && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
            <p className="text-3xl">{isAuthError ? '🔒' : '😅'}</p>
            <p className="font-semibold text-sp-white">{errorMessage}</p>
            {isAuthError && (
              <a
                href="/api/auth/login"
                className="px-6 py-3 rounded-full font-bold text-sm transition-all bg-sp-green text-black"
              >
                다시 로그인하기
              </a>
            )}
            {isRetryable && (
              <button
                onClick={handleRefetch}
                className="px-6 py-3 rounded-full font-bold text-sm transition-all bg-sp-green text-black"
              >
                다시 시도하기
              </button>
            )}
          </div>
        )}

        {!loading && !hasError && !hasResults && (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <p className="text-3xl">🎵</p>
            <p className="text-sm text-sp-sub">추천 결과가 없어요</p>
          </div>
        )}

        {/* 추천 트랙 탭 */}
        {!loading && !hasError && hasResults && activeTab === 'tracks' && (
          <div className="space-y-1">
            {tracks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Music size={24} className="text-sp-muted" />
                <p className="text-sm text-sp-sub">추천 트랙이 없어요</p>
              </div>
            ) : (
              tracks.map((track, idx) => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg transition-all duration-150 group hover:bg-sp-elevated"
                >
                  <span className="w-5 text-right text-xs text-sp-muted flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="relative flex-shrink-0">
                    {track.album.images?.[0]?.url ? (
                      <img
                        src={track.album.images[track.album.images.length > 2 ? 2 : 0].url}
                        alt={track.album.name}
                        className="w-11 h-11 rounded object-cover"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded flex items-center justify-center text-sm bg-sp-elevated">
                        🎵
                      </div>
                    )}
                    {track.preview_url && (
                      <button
                        onClick={() => togglePreview(track.id, track.preview_url!)}
                        className={`absolute inset-0 flex items-center justify-center rounded bg-black/50 transition-opacity ${
                          playingId === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {playingId === track.id ? (
                          <Pause size={18} className="text-white" fill="white" />
                        ) : (
                          <Play size={18} className="text-white" fill="white" />
                        )}
                      </button>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate text-sp-white">{track.name}</p>
                    <p className="text-xs truncate mt-0.5 text-sp-sub">
                      {track.artists.map((a) => a.name).join(', ')}
                    </p>
                  </div>
                  <span className="text-xs text-sp-muted flex-shrink-0">
                    {formatDuration(track.duration_ms)}
                  </span>
                  <a
                    href={track.external_urls.spotify}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink
                      size={14}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-sp-green"
                    />
                  </a>
                </div>
              ))
            )}
          </div>
        )}

        {/* 플레이리스트 탭 */}
        {!loading && !hasError && hasResults && activeTab === 'playlists' && (
          <div className="space-y-2">
            {playlists.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Music size={24} className="text-sp-muted" />
                <p className="text-sm text-sp-sub">추천 플레이리스트가 없어요</p>
              </div>
            ) : (
              playlists.map((playlist) => (
                <a
                  key={playlist.id}
                  href={playlist.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg transition-all duration-150 group bg-sp-card hover:bg-sp-elevated"
                >
                  {playlist.images?.[0]?.url ? (
                    <img
                      src={playlist.images[0].url}
                      alt={playlist.name}
                      className="w-14 h-14 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded flex items-center justify-center text-xl flex-shrink-0 bg-sp-elevated">
                      🎵
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate text-sp-white">{playlist.name}</p>
                    <p className="text-xs truncate mt-0.5 text-sp-sub">
                      {playlist.owner?.display_name} · {playlist.tracks?.total}곡
                    </p>
                  </div>
                  <ExternalLink
                    size={15}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-sp-green"
                  />
                </a>
              ))
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={onRetry}
          className="w-full py-3.5 rounded-full font-bold text-sm transition-all duration-200 active:scale-95 border border-sp-disabled text-sp-white bg-transparent hover:border-sp-white"
        >
          다시 진단하기
        </button>
      </div>
    </div>
  );
}
