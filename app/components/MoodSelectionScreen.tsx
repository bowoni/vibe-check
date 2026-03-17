'use client';

import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { emotions, weathers } from '../lib/constants';

interface MoodSelectionScreenProps {
  onBack: () => void;
  onSubmit: (mood: string, weather: string) => void;
}

export function MoodSelectionScreen({ onBack, onSubmit }: MoodSelectionScreenProps) {
  const [selectedMood, setSelectedMood] = useState('');
  const [selectedWeather, setSelectedWeather] = useState('');

  const handleSubmit = () => {
    if (selectedMood && selectedWeather) {
      onSubmit(selectedMood, selectedWeather);
    }
  };

  const canSubmit = selectedMood && selectedWeather;

  return (
    <div className="flex flex-col h-full p-5 md:p-7 bg-sp-dark">
      {/* Header */}
      <div className="flex items-center mb-7">
        <button
          onClick={onBack}
          className="p-2 rounded-full transition-colors text-sp-sub hover:text-sp-white"
        >
          <ArrowLeft size={22} />
        </button>
      </div>

      {/* Title */}
      <h2 className="text-2xl md:text-3xl font-bold mb-8 text-sp-white">
        지금 기분을 골라봐
      </h2>

      {/* Emotion Tags */}
      <div className="mb-8">
        <h3 className="text-xs font-bold tracking-widest uppercase mb-4 text-sp-sub">
          감정
        </h3>
        <div className="flex flex-wrap gap-2.5">
          {emotions.map((emotion) => {
            const isSelected = selectedMood === emotion.label;
            return (
              <button
                key={emotion.label}
                onClick={() => setSelectedMood(emotion.label)}
                className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-150 active:scale-95 border ${
                  isSelected
                    ? 'bg-sp-green text-black border-sp-green'
                    : 'bg-sp-elevated text-sp-white border-sp-disabled'
                }`}
              >
                <span className="mr-1.5">{emotion.emoji}</span>
                {emotion.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Weather Tags */}
      <div className="mb-auto">
        <h3 className="text-xs font-bold tracking-widest uppercase mb-4 text-sp-sub">
          날씨
        </h3>
        <div className="flex flex-wrap gap-2.5">
          {weathers.map((weather) => {
            const isSelected = selectedWeather === weather.label;
            return (
              <button
                key={weather.label}
                onClick={() => setSelectedWeather(weather.label)}
                className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-150 active:scale-95 border ${
                  isSelected
                    ? 'bg-sp-green text-black border-sp-green'
                    : 'bg-sp-elevated text-sp-white border-sp-disabled'
                }`}
              >
                <span className="mr-1.5">{weather.emoji}</span>
                {weather.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`w-full py-4 rounded-full font-bold text-base transition-all duration-200 active:scale-95 ${
          canSubmit
            ? 'bg-sp-green text-black cursor-pointer'
            : 'bg-sp-elevated text-sp-muted cursor-not-allowed'
        }`}
      >
        음악 찾아줘 🎵
      </button>
    </div>
  );
}
