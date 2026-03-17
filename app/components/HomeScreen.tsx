'use client';

interface SpotifyUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface HomeScreenProps {
  onStart: () => void;
  user: SpotifyUser | null;
  authLoading: boolean;
}

export function HomeScreen({ onStart, user, authLoading }: HomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 md:px-8 text-center relative overflow-hidden bg-sp-dark">
      {/* Background glow */}
      <div className="absolute top-[-80px] left-[-80px] w-[300px] h-[300px] rounded-full blur-[120px] opacity-20 bg-sp-green" />
      <div className="absolute bottom-[-60px] right-[-60px] w-[250px] h-[250px] rounded-full blur-[100px] opacity-10 bg-sp-green" />

      {/* Logo */}
      <div className="mb-8 relative z-10">
        <div className="flex items-center justify-center gap-2 mb-3">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#1DB954">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-sp-white">
            VIBE CHECK
          </h1>
        </div>
        <p className="text-xs font-semibold tracking-widest uppercase text-sp-green">
          powered by Spotify
        </p>
      </div>

      <h2 className="text-2xl md:text-3xl font-semibold mb-3 relative z-10 text-sp-white">
        지금 기분이 어때?
      </h2>

      <p className="text-base mb-10 max-w-xs leading-relaxed relative z-10 text-sp-sub">
        감정을 분석하고 완벽한 플레이리스트를 추천해드릴게요
      </p>

      <div className="relative z-10 w-full max-w-xs">
        {authLoading ? (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-sp-green border-t-transparent animate-spin" />
          </div>
        ) : user ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl w-full border bg-sp-elevated border-sp-disabled">
              {user.image ? (
                <img src={user.image} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-sp-green/15">
                  🎵
                </div>
              )}
              <div className="text-left flex-1 min-w-0">
                <p className="font-semibold text-sm truncate text-sp-white">{user.name}</p>
                <p className="text-xs truncate text-sp-sub">{user.email}</p>
              </div>
              <a
                href="/api/auth/logout"
                className="text-xs whitespace-nowrap transition-colors text-sp-muted hover:opacity-80"
              >
                로그아웃
              </a>
            </div>
            <button
              onClick={onStart}
              className="w-full py-4 rounded-full font-bold text-base transition-all duration-200 active:scale-95 bg-sp-green hover:bg-sp-green-light text-black"
            >
              기분 진단 시작하기
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <a
              href="/api/auth/login"
              className="flex items-center justify-center gap-3 w-full py-4 rounded-full font-bold text-base transition-all duration-200 active:scale-95 bg-sp-green hover:bg-sp-green-light text-black"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
              </svg>
              Spotify로 로그인
            </a>
            <p className="text-xs text-sp-muted">
              로그인하면 맞춤 플레이리스트를 추천받을 수 있어요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
