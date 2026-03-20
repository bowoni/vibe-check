'use client';

import { useState, useEffect } from 'react';
import { Home, Clock, Sun, Moon } from 'lucide-react';
import { useTheme } from './lib/theme';
import { HomeScreen } from './components/HomeScreen';
import { MoodSelectionScreen } from './components/MoodSelectionScreen';
import { ResultScreen } from './components/ResultScreen';
import { HistoryScreen } from './components/HistoryScreen';

type Screen = 'home' | 'mood-selection' | 'result' | 'history';

interface SpotifyUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedWeather, setSelectedWeather] = useState('');
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => setUser(data.user || null))
      .catch(() => setUser(null))
      .finally(() => setAuthLoading(false));
  }, []);

  const handleStart = () => setCurrentScreen('mood-selection');

  const handleMoodSubmit = (mood: string, weather: string) => {
    setSelectedMood(mood);
    setSelectedWeather(weather);
    setCurrentScreen('result');
  };

  const handleRetry = () => setCurrentScreen('mood-selection');
  const handleBackToHome = () => setCurrentScreen('home');

  const isHome = currentScreen === 'home' || currentScreen === 'mood-selection' || currentScreen === 'result';

  return (
    <div className="min-h-screen flex items-center justify-center p-2 md:p-4 bg-sp-black font-sans">
      <div className="relative w-full max-w-[440px] h-[calc(100dvh-1rem)] md:h-[calc(100dvh-2rem)] md:max-h-[850px] rounded-2xl md:rounded-3xl overflow-hidden border border-sp-elevated bg-sp-dark">
        <div className="h-full pb-16 overflow-hidden">
          {currentScreen === 'home' && (
            <HomeScreen onStart={handleStart} user={user} authLoading={authLoading} />
          )}
          {currentScreen === 'mood-selection' && (
            <MoodSelectionScreen onBack={handleBackToHome} onSubmit={handleMoodSubmit} />
          )}
          {currentScreen === 'result' && (
            <ResultScreen
              onBack={handleBackToHome}
              onRetry={handleRetry}
              mood={selectedMood}
              weather={selectedWeather}
            />
          )}
          {currentScreen === 'history' && <HistoryScreen onBack={handleBackToHome} />}
        </div>

        {/* Bottom Navigation */}
        <div className="absolute bottom-0 left-0 right-0 border-t bg-sp-dark border-sp-elevated pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around h-16 px-8">
            <button
              onClick={() => setCurrentScreen('home')}
              className={`flex flex-col items-center gap-1 transition-colors ${isHome ? 'text-sp-green' : 'text-sp-muted'}`}
            >
              <Home size={24} />
              <span className="text-xs font-medium">홈</span>
            </button>
            <button
              onClick={() => user && setCurrentScreen('history')}
              disabled={!user}
              className={`flex flex-col items-center gap-1 transition-colors ${
                !user ? 'text-sp-disabled cursor-not-allowed' : currentScreen === 'history' ? 'text-sp-green' : 'text-sp-muted cursor-pointer'
              }`}
            >
              <Clock size={24} />
              <span className="text-xs font-medium">히스토리</span>
            </button>
            <button
              onClick={toggleTheme}
              className="flex flex-col items-center gap-1 transition-colors text-sp-muted"
            >
              {theme === 'dark' ? <Sun size={24} /> : <Moon size={24} />}
              <span className="text-xs font-medium">{theme === 'dark' ? '라이트' : '다크'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
