# 🎧 Spotify
> Spotify Web API를 활용한 감정과 날씨로 찾는 나만의 플레이리스트

<!-- ![demo](./public/demo.gif) -->

<br>

# 목차

[1-프로젝트 소개](#1-프로젝트-소개)

- [1-1 개요](#1-1-개요)
- [1-2 주요목표](#1-2-주요목표)
- [1-3 개발환경](#1-3-개발환경)
- [1-4 구동방법](#1-4-구동방법)

[2-Architecture](#2-architecture)
- [2-1 구조도](#2-1-구조도)
- [2-2 파일 디렉토리](#2-2-파일-디렉토리)

[3-프로젝트 특징](#3-프로젝트-특징)

[4-프로젝트 세부과정](#4-프로젝트-세부과정)

[5-업데이트 및 리팩토링 사항](#5-업데이트-및-리팩토링-사항)

---

## 1-프로젝트 소개

### 1-1 개요
> 현재 기분과 날씨를 선택하면 Spotify API를 통해 어울리는 플레이리스트를 추천해주는 웹앱
- **개발기간** : 2026.02.14 ~ 2026.02.24 (약 2주)
- **참여인원** : 1인 (개인 프로젝트)
- **주요특징**
  - 6가지 감정(우울함, 신남, 나른함, 화남, 설렘, 평온함)과 4가지 날씨(맑음, 비, 흐림, 눈) 조합으로 맞춤 플레이리스트 추천
  - Spotify OAuth 2.0 로그인을 통한 개인화된 음악 추천 및 히스토리 관리
  - Spotify 디자인 언어를 차용한 다크 테마 기반 모바일 퍼스트 반응형 UI

### 1-2 주요목표
- OAuth 2.0 Authorization Code Flow의 동작 메커니즘 이해 및 구현
- Spotify Web API를 활용한 키워드 기반 플레이리스트 검색 로직 설계
- Next.js App Router 기반 풀스택 웹앱 아키텍처 구성
- HttpOnly Cookie를 활용한 보안 토큰 관리

### 1-3 개발환경
- **활용기술 외 키워드**
  - **Framework** : Next.js 16 (App Router), React 19, TypeScript 5
  - **Styling** : Tailwind CSS 4, PostCSS
  - **API** : Spotify Web API, OAuth 2.0 (Authorization Code Flow)
  - **인증** : HttpOnly Cookie 기반 토큰 저장, CSRF State 검증

- **라이브러리**

  라이브러리  | 버전  | 용도
  ----| ----- | -----
  lucide-react | 0.575.0 | 아이콘 컴포넌트
  recharts | 3.7.0 | 히스토리 차트 시각화

### 1-4 구동방법

순서  | 내용  | 비고
----| ----- | -----
1 | `npm install` 로 패키지를 설치합니다 | -
2 | [Spotify Developer Dashboard](https://developer.spotify.com/)에서 앱을 생성합니다 | Spotify 계정 필요
3 | 앱 Settings에서 Redirect URI를 `http://127.0.0.1:3000/api/auth/callback` 으로 등록합니다 | -
4 | 프로젝트 루트에 `.env.local` 파일을 생성하고 아래 환경 변수를 입력합니다 | -
5 | `npm run dev` 로 개발 서버를 실행합니다 | -
6 | 브라우저에서 `http://127.0.0.1:3000` 으로 접속합니다 | `localhost` 가 아닌 `127.0.0.1` 사용

```env
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/auth/callback
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000
```

<br>

## 2-Architecture
### 2-1 구조도

<br>

> Client-Server Architecture (Next.js App Router)
- Next.js의 App Router를 활용하여 클라이언트 컴포넌트와 서버 API Route를 단일 프로젝트 내에서 관리
- 클라이언트 컴포넌트에서 API Route를 호출하고, API Route에서 Spotify Web API와 통신하는 구조
- 인증 토큰은 HttpOnly Cookie로 관리하여 클라이언트 JavaScript에서 접근 불가하도록 보안 처리

```
[Client]                    [Server (API Routes)]              [Spotify]
  │                               │                               │
  ├─ HomeScreen ──────────────── /api/auth/login ──────────────► OAuth 인증
  │                               │                               │
  ├─ (callback) ◄──────────────── /api/auth/callback ◄──────── Token 발급
  │                               │  (HttpOnly Cookie 저장)       │
  ├─ MoodSelectionScreen          │                               │
  │   └─ 감정 + 날씨 선택         │                               │
  │                               │                               │
  ├─ ResultScreen ────────────── /api/spotify/playlists ──────► Search API
  │   └─ 추천 플레이리스트 표시    │  (2회 병렬 검색 + 병합)        │
  │                               │                               │
  └─ HistoryScreen                │                               │
      └─ 감정 진단 히스토리       /api/auth/me ────────────────► User Profile
```

<br>

> 화면 전환 흐름
- `page.tsx`에서 `useState`로 현재 화면 상태를 관리하며, 4개의 화면 컴포넌트를 조건부 렌더링
- 하단 네비게이션 바를 통해 홈/히스토리 간 이동 (히스토리는 로그인 시에만 접근 가능)

```
HomeScreen ──► MoodSelectionScreen ──► ResultScreen
    │                                      │
    │              ◄── 다시 진단하기 ────────┘
    │
    └──► HistoryScreen (로그인 필수)
```

<br>

### 2-2 파일 디렉토리
```
vibe-check
 ┣ 📂app
 ┃ ┣ 📂api
 ┃ ┃ ┣ 📂auth
 ┃ ┃ ┃ ┣ 📂callback
 ┃ ┃ ┃ ┃ ┗ 📜route.ts          # OAuth 콜백 처리, 토큰 교환 및 쿠키 저장
 ┃ ┃ ┃ ┣ 📂login
 ┃ ┃ ┃ ┃ ┗ 📜route.ts          # Spotify OAuth 로그인 리다이렉트
 ┃ ┃ ┃ ┣ 📂logout
 ┃ ┃ ┃ ┃ ┗ 📜route.ts          # 로그아웃 및 쿠키 삭제
 ┃ ┃ ┃ ┗ 📂me
 ┃ ┃ ┃   ┗ 📜route.ts          # 현재 유저 프로필 조회
 ┃ ┃ ┗ 📂spotify
 ┃ ┃   ┣ 📂playlists
 ┃ ┃   ┃ ┗ 📜route.ts          # 기분/날씨 기반 플레이리스트 검색
 ┃ ┃   ┗ 📂recommendations
 ┃ ┃     ┗ 📜route.ts          # 기분/날씨 기반 트랙 추천
 ┃ ┣ 📂components
 ┃ ┃ ┣ 📜HomeScreen.tsx         # 랜딩 페이지 (로그인/시작)
 ┃ ┃ ┣ 📜MoodSelectionScreen.tsx # 감정 및 날씨 선택 화면
 ┃ ┃ ┣ 📜ResultScreen.tsx       # 추천 플레이리스트 결과 화면
 ┃ ┃ ┗ 📜HistoryScreen.tsx      # 감정 진단 히스토리 화면
 ┃ ┣ 📂lib
 ┃ ┃ ┣ 📜spotify.ts             # Spotify 토큰 관리 및 재시도 fetch 유틸
 ┃ ┃ ┣ 📜supabase.ts            # Supabase 클라이언트
 ┃ ┃ ┣ 📜history.ts             # 히스토리 데이터 레이어
 ┃ ┃ ┣ 📜constants.ts           # 감정/날씨 공유 상수
 ┃ ┃ ┗ 📜theme.tsx              # 다크/라이트 모드 ThemeProvider
 ┃ ┣ 📜page.tsx                 # 메인 페이지 (화면 상태 관리)
 ┃ ┣ 📜layout.tsx               # 루트 레이아웃
 ┃ ┣ 📜globals.css              # 글로벌 스타일
 ┃ ┗ 📜favicon.ico
 ┣ 📂public
 ┃ ┗ 📜demo.gif                 # 데모 이미지
 ┣ 📜package.json
 ┣ 📜tsconfig.json
 ┣ 📜next.config.ts
 ┗ 📜.env.local                 # 환경 변수 (Spotify 크레덴셜)
```

<br>

## 3-프로젝트 특징
### 3-1 Spotify OAuth 2.0 로그인 및 보안 토큰 관리
- Authorization Code Flow를 통한 Spotify 인증 구현
- `State` 파라미터를 활용한 CSRF 공격 방지
- `HttpOnly Cookie`로 Access Token / Refresh Token 저장하여 XSS 방지
- Production 환경에서 `Secure` 플래그 활성화

```typescript
// callback/route.ts - 토큰을 HttpOnly Cookie로 안전하게 저장
response.cookies.set('spotify_access_token', tokens.access_token, {
  httpOnly: true,
  maxAge: tokens.expires_in,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
});
```

<br>

---

### 3-2 감정 + 날씨 기반 플레이리스트 추천 (MoodSelection → Result)
- 6가지 감정과 4가지 날씨를 키워드로 매핑하여 Spotify Search API 호출
- 2회 병렬 검색(감정 단독 / 날씨+감정 조합) 후 결과를 병합하여 다양성 확보
- 중복 제거 후 최대 10개의 플레이리스트 반환, 한국 마켓(KR) 기준 검색

```typescript
// playlists/route.ts - 키워드 매핑 및 병렬 검색
const moodKeywords: Record<string, string> = {
  '우울함': 'sad melancholic heartbreak emotional',
  '신남': 'energetic upbeat party dance',
  '나른함': 'lofi chill relax study',
  '화남': 'angry intense aggressive rock',
  '설렘': 'romantic hopeful love exciting',
  '평온함': 'peaceful calm ambient serene',
};

const [moodRes, combinedRes] = await Promise.all([
  fetch(`...?q=${moodQuery}&type=playlist&limit=6&market=KR`, { headers }),
  fetch(`...?q=${combinedQuery}&type=playlist&limit=6&market=KR`, { headers }),
]);
```

<br>

---

### 3-3 감정 진단 히스토리 시각화 (HistoryScreen)
- `recharts` 라이브러리를 활용한 월별 감정 진단 차트 (BarChart)
- 최근 감정 기록을 리스트 형태로 표시 (감정, 날짜, 추천 플레이리스트 수)
- 로그인 유저만 접근 가능하도록 하단 네비게이션에서 제어

<br>

---

### 3-4 Spotify 디자인 언어 기반 UI/UX
- Spotify의 다크 테마 색상 체계 차용 (`#121212`, `#282828`, `#1DB954`)
- 모바일 퍼스트 반응형 디자인 (모바일: 풀스크린 / 데스크탑: 카드형 레이아웃)
- 하단 탭 네비게이션으로 모바일 앱과 유사한 사용자 경험 제공
- 감정/날씨 선택 시 `Chip(Tag)` 형태의 토글 UI 활용

```typescript
// page.tsx - 화면 상태 관리 및 조건부 렌더링
type Screen = 'home' | 'mood-selection' | 'result' | 'history';

const [currentScreen, setCurrentScreen] = useState<Screen>('home');

{currentScreen === 'home' && <HomeScreen ... />}
{currentScreen === 'mood-selection' && <MoodSelectionScreen ... />}
{currentScreen === 'result' && <ResultScreen ... />}
{currentScreen === 'history' && <HistoryScreen ... />}
```

<br>

## 4-프로젝트 세부과정
### 4-1 [Feature 1] Spotify OAuth 2.0 인증 구현

> Authorization Code Flow를 활용한 사용자 인증 및 토큰 관리
- Spotify Developer Dashboard에서 앱 등록 후 Client ID, Client Secret 발급
- 로그인 요청 → Spotify 인증 페이지 리다이렉트 → Auth Code 발급 → Token 교환 → HttpOnly Cookie 저장
- State 파라미터를 통한 CSRF 검증으로 보안 강화

```typescript
// login/route.ts - OAuth 로그인 흐름 시작
const params = new URLSearchParams({
  response_type: 'code',
  client_id: clientId,
  scope: 'user-read-private user-read-email',
  redirect_uri: redirectUri,
  state: state,  // CSRF 방지용 랜덤 문자열
});
```

<br>

### 4-2 [Feature 2] 감정/날씨 키워드 매핑 및 검색 로직 설계

> 사용자 입력을 Spotify 검색 키워드로 변환하는 추천 엔진 구현
- 감정(6종)과 날씨(4종) 각각에 대해 영문 키워드 세트를 매핑
- `Promise.all`을 활용한 2회 병렬 API 호출로 응답 속도 최적화
- 날씨+감정 결과를 우선 배치하고 감정 단독 결과로 보충, `Set`을 통한 중복 제거

```typescript
// 병합 로직 - 날씨+감정 결과 우선, 중복 제거
const seenIds = new Set<string>();
const merged = [];

for (const playlist of [...combinedPlaylists, ...moodPlaylists]) {
  if (!seenIds.has(playlist.id)) {
    seenIds.add(playlist.id);
    merged.push(playlist);
  }
  if (merged.length >= 10) break;
}
```

<br>

### 4-3 [Feature 3] 화면별 UI 컴포넌트 설계

> 4개의 화면 컴포넌트를 조건부 렌더링으로 전환하는 SPA 구조
- **HomeScreen** : Spotify 로고, 유저 프로필(로그인 시), 로그인/시작 버튼
- **MoodSelectionScreen** : 감정 6종 + 날씨 4종 Chip 선택 UI, 양쪽 모두 선택 시 CTA 활성화
- **ResultScreen** : 감정/날씨 뱃지, 추천 플레이리스트 리스트, Spotify 외부 링크 연결
- **HistoryScreen** : recharts BarChart를 활용한 월별 통계, 최근 기록 리스트

```typescript
// MoodSelectionScreen.tsx - Chip 형태의 선택 UI
const emotions = [
  { emoji: '😔', label: '우울함' },
  { emoji: '🔥', label: '신남' },
  { emoji: '😴', label: '나른함' },
  { emoji: '😤', label: '화남' },
  { emoji: '🥰', label: '설렘' },
  { emoji: '😌', label: '평온함' },
];
```

<br>

## 5-업데이트 및 리팩토링 사항
### 5-1 우선 순위별 개선항목

1) 히스토리 기능 고도화
- [x] 현재 mock 데이터로 표시되는 히스토리를 실제 데이터베이스 연동으로 전환
- [x] 감정 진단 결과를 저장하고 월별/감정별 통계 데이터 집계 기능 구현
- [x] 월별 진단 횟수를 월별/주별/일별 선택해 조회되게 전환

2) Token Refresh 로직 구현
- [x] Access Token 만료 시 Refresh Token을 활용한 자동 갱신 로직 추가
- [x] 토큰 만료 감지 및 사용자에게 재로그인 안내 UX 개선

3) 추천 알고리즘 개선
- [x] 현재 키워드 기반 검색을 Spotify Recommendations API로 확장하여 정밀도 향상
- [x] 사용자 청취 이력 기반 개인화된 추천 로직 추가

4) 에러 핸들링 강화
- [x] Spotify API 응답 실패 시 재시도 로직 및 사용자 친화적 에러 메시지 개선
- [x] 네트워크 오류, 토큰 만료 등 케이스별 분기 처리

### 5-2 그 외 항목

1) UI 개선
- [x] 플레이리스트 미리듣기(Preview) 기능 추가
- [x] 다크/라이트 모드 토글 지원
- [x] 로딩 시 Skeleton UI 적용

2) 기능 확장
- [ ] 추천 결과를 Spotify 플레이리스트로 직접 저장하는 기능
- [ ] 소셜 공유 기능 (감정 진단 결과 + 추천 플레이리스트)
