# Vmonster 비디오 챗 데모

Vmonster AI Avatar 비디오 챗 데모 프로젝트입니다.

## 개요

이 프로젝트는 Vmonster의 AI Avatar와 실시간 비디오 채팅 기능을 구현한 Next.js 기반 데모 애플리케이션입니다. `vmonster-streaming-js` 패키지를 활용하여 AI 아바타와의 자연스러운 대화 및 음성 인터랙션을 제공합니다.

## 주요 기능

- 실시간 AI Avatar 비디오 스트리밍
- 음성 인식 및 VAD (Voice Activity Detection)
- 텍스트 및 음성 기반 대화
- 타임아웃 로직(클라이언트 사이드)
- 대화 기록 추적

## 기술 스택 선정 이유 (Next.js)

이 데모 프로젝트는 **VMonster API Key의 보안**을 위해 Next.js를 사용했습니다.

- **API Key 보호**: VMonster API Key는 클라이언트(브라우저)에 노출되어서는 안 되는 민감한 정보입니다. Next.js의 API Routes(서버 사이드)를 통해 API 호출을 중계함으로써, 개발자 도구 등에서 Key가 노출되는 것을 방지했습니다.
- **참고 사항**: 고객사(또는 개발자)가 별도의 백엔드 서버를 보유하고 있다면, 해당 서버에서 API Key를 관리하고 프론트엔드는 **React.js**만 사용하여 구성하는 것도 가능합니다. 이 데모는 별도의 백엔드 구축 없이 빠르고 간편하게 안전한 환경을 구성하기 위해 Next.js를 선택했습니다.

## 핵심 훅 및 구현 상세

이 데모는 `vmonster-streaming-js` 패키지를 React/Next.js 환경에서 효율적으로 사용하기 위해 두 가지 주요 Custom Hook으로 기능을 모듈화했습니다.

### 1. `useAIAvatar.ts` (Core Hook)
- **기반**: `vmonster-streaming-js` 패키지를 기반으로 작성되었습니다.
- **역할**: React 및 Next.js에서 VMonster SDK를 간편하게 사용할 수 있도록 만든 핵심 훅입니다.
- **기능**: 아바타 연결(Join), 스트림 생성, 발화(Speak), 중단(Stop), 이벤트 처리 등 **VMonster의 모든 메인 기능**이 이 훅에서 제공됩니다.

### 2. `useVideoChat.ts` (Demo Implementation)
- **역할**: `useAIAvatar` 훅을 포함하여, 실제 데모 서비스에 필요한 비즈니스 로직과 부가 기능을 통합 구현한 훅입니다.
- **기능**:
  - **기본 기능 통합**: `useAIAvatar`의 모든 기능을 상속받아 사용합니다.
  - **오디오 권한 관리**: 브라우저 마이크 접근 권한을 요청하고 관리합니다 (`useAskUserAudioPermission`).
  - **데모 유틸리티**: 체험 시간 제한을 위한 타이머 설정 (`useTimer`), 타이핑 효과 등 데모에 필요한 구체적인 UX 로직을 포함합니다.

## 시작하기

### 설치

```bash
npm install
```

### 환경 변수 설정

**⚠️ 중요: API 키 보안**

프로젝트 루트에 `.env` 파일을 생성하고 아래 환경 변수를 설정하세요:

```env
NEXT_PUBLIC_VMONSTER_API_URL=your_api_url
NEXT_PUBLIC_AI_AVATAR_ID=your_avatar_id
VMONSTER_API_KEY=your_api_key
```

**보안 주의사항:**

- `VMONSTER_API_KEY`는 반드시 서버 사이드에서만 사용되어야 합니다
- 이 API 키는 `app/api/streams/route.ts`에서 스트림 생성 요청 시에만 사용됩니다
- 클라이언트에 노출되지 않도록 `NEXT_PUBLIC_` 접두사를 사용하지 마세요
- API 키가 클라이언트 번들에 포함되지 않도록 주의하세요

### 실행

개발 서버 실행:

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 데모를 확인하세요.

프로덕션 빌드:

```bash
npm run build
npm start
```

## 프로젝트 구조

```
.
├── app/
│   ├── api/
│   │   └── streams/
│   │       └── route.ts           # 서버 사이드 스트림 생성 API (Key 보안 처리)
│   ├── hooks/                     # 커스텀 훅 모음
│   │   ├── useAIAvatar.ts        # vmonster-streaming-js 래퍼 (메인 기능)
│   │   ├── useVideoChat.ts       # 데모용 통합 훅 (권한, 타이머 등 포함)
│   │   ├── utils/                # 유틸리티 훅
│   │   │   ├── useAskUserAudioPermission.ts
│   │   │   ├── useTimer.ts
│   │   │   └── ...
│   │   ├── video-chat-types.ts   # TypeScript 타입 정의
│   │   └── constants.ts
│   └── page.tsx                  # 메인 데모 UI
├── public/
├── .env                          # 환경 변수 (생성 필요)
├── next.config.js
├── package.json
└── tsconfig.json
```

## 주요 상태 및 기능 (useVideoChat)

### 상태
- `joinRoomStatus`: 방 입장 상태 (idle, joining, joined, leaving, left)
- `communicationStatus`: 통신 상태 (idle, speaking, listening)
- `isUserSpeaking`: 사용자 음성 감지 상태 (VAD)
- `remainingTime`: 세션 남은 시간

### 메서드
- `join()`: VmonsterRoom 입장
- `leave()`: VmonsterRoom 퇴장
- `speakAIAvatar(text)`: AI Avatar에게 텍스트에 대한 발화 요청
- `toggleUserAudio()`: 사용자 마이크 on/off

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Avatar**: vmonster-streaming-js v2.4.0
- **UI Components**: @aws-amplify/ui-react
