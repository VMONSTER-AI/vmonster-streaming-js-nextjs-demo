// useAIAvatar.ts
// - VMonster AI Avatar와의 실시간 화상/음성 대화 세션을 관리하는 핵심 Hook입니다.
// - Stream 요청, Room 입장, 이벤트 콜백 함수 등록과 Room 관련 메서드를 제공합니다.

import { useState, useCallback, useRef, useEffect } from "react";
import Room, { ErrorData } from "vmonster-streaming-js";
import { requestNewStreamLivekit } from "../utils/stream-query-utils";
import { AvatarMessage, MessageRole, UserMessage } from "./video-chat-types";

type STTData = {
  text: string;
  eventType: STTDataEventType;
  type: "stt-data";
};
type STTDataEventType =
  | "transcript"
  | "partial_transcript"
  | "start_of_speech"
  | "end_of_speech";

interface UseAIAvatarProps {
  aiAvatarId: string;
  onJoined: () => void;
  unmuteUserAudioOnJoined?: boolean;
  onAiAvatarStartSpeaking?: () => void;
  onAiAvatarStopSpeaking?: () => void;
  onAiAvatarMessage?: (text: string) => void;
  onUserStartSpeaking?: () => void;
  onUserStopSpeaking?: () => void;
  onUserSTTTranscript?: (text: string) => void;
  onLeft?: () => void;
  firstMessageTimeRef?: React.RefObject<number | null>;
  onError?: (error: ErrorData) => void;
  maxDurationS?: number; // 세션 지속시간(초), 양의 정수 값.
}

export const useAIAvatar = ({
  aiAvatarId,
  onJoined,
  unmuteUserAudioOnJoined = true,
  onAiAvatarStartSpeaking,
  onAiAvatarStopSpeaking,
  onAiAvatarMessage,
  onUserStartSpeaking,
  onUserStopSpeaking,
  onUserSTTTranscript,
  onLeft,
  firstMessageTimeRef,
  onError,
  maxDurationS = 300, // 세션 지속시간(초), 양의 정수 값.
}: UseAIAvatarProps) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [avatarMessages, setAvatarMessages] = useState<AvatarMessage[]>([]);
  const [userMessages, setUserMessages] = useState<UserMessage[]>([]);

  const lastMessageRef = useRef<string | null>(null); // 마지막 메세지는 ref로 관리 - useCallback & state만으로는 문제있음
  const lastMessageTimestampRef = useRef<string | null>(null);

  const updateMessageOnStopSpeaking = useCallback(() => {
    const lastMessage = lastMessageRef.current;
    const lastMessageTimestamp = lastMessageTimestampRef.current;

    if (lastMessage !== null) {
      setAvatarMessages((prev) => [
        ...prev.filter((message) => message.isFinal === true),
        {
          isFinal: true,
          role: MessageRole.AI,
          content: lastMessage,
          timestamp: lastMessageTimestamp || "",
        },
      ]);
      lastMessageRef.current = null;
      lastMessageTimestampRef.current = null;
    }
  }, []);
  const updateMessage = useCallback(
    (text: string) => {
      if (lastMessageRef.current === null) {
        lastMessageRef.current = text;
      } else {
        lastMessageRef.current = lastMessageRef.current + text;
      }

      if (
        avatarMessages.length > 0 &&
        avatarMessages[avatarMessages.length - 1].isFinal === false
      ) {
        // 이전 메세지를 업데이트
        const newMessage = lastMessageRef.current;
        setAvatarMessages((prev) => [
          ...prev.filter((message) => message.isFinal === true),
          {
            isFinal: false,
            role: MessageRole.AI,
            content: newMessage,
            timestamp: lastMessageTimestampRef.current || "",
          },
        ]);
      } else {
        // 새 메세지 추가
        lastMessageTimestampRef.current = new Date().toISOString();

        setAvatarMessages((prev) => [
          ...prev.filter((message) => message.isFinal === true),
          {
            isFinal: false,
            role: MessageRole.AI,
            content: lastMessageRef.current || "",
            timestamp: lastMessageTimestampRef.current || "",
          },
        ]);
      }
    },
    [avatarMessages]
  );

  const sttDataHandler = useCallback(
    (data: STTData) => {
      if (data.eventType === "start_of_speech") {
        onUserStartSpeaking?.();

        // [옵션] VAD 시작 시간을 유저 메시지에 추가
        // const timestamp = firstMessageTimeRef?.current
        //   ? (Date.now() - firstMessageTimeRef.current) / 1000
        //   : 0;
        // setUserSTTMessage((prev) => [
        //   ...prev,
        //   {
        //     type: "VAD-start",
        //     content: "",
        //     timestamp: timestamp.toFixed(3) + "s",
        //   },
        // ]);
      } else if (data.eventType === "end_of_speech") {
        onUserStopSpeaking?.();

        // [옵션] VAD 종료 시간을 유저 메시지에 추가
        // const timestamp = firstMessageTimeRef?.current
        //   ? (Date.now() - firstMessageTimeRef.current) / 1000
        //   : 0;
        // setUserSTTMessage((prev) => [
        //   ...prev,
        //   {
        //     type: "VAD-end",
        //     content: "",
        //     timestamp: timestamp.toFixed(3) + "s",
        //   },
        // ]);
      } else if (data.eventType === "transcript") {
        setUserMessages((prev) => [
          ...prev,
          {
            role: MessageRole.HUMAN,
            content: data.text,
            timestamp: new Date().toISOString(),
          },
        ]);
        onUserSTTTranscript?.(data.text);
      }
    },
    [onUserStartSpeaking, onUserStopSpeaking, onUserSTTTranscript]
  );

  // 핸들러들을 ref로 참조 - 변경되는 props들에 대해 Room에서 최신 핸들러를 참조할 수 있도록 함
  const handlersRef = useRef({
    // 외부 핸들러(props로 받는 핸들러)
    onJoined,
    onAiAvatarStartSpeaking,
    onAiAvatarStopSpeaking,
    onAiAvatarMessage,
    onLeft,
    onError,
    // 내부 핸들러
    updateMessageOnStopSpeaking,
    updateMessage,
    sttDataHandler,
  });

  // props가 변경될 때마다 ref 업데이트
  useEffect(() => {
    handlersRef.current = {
      onJoined,
      onAiAvatarStartSpeaking,
      onAiAvatarStopSpeaking,
      onAiAvatarMessage,
      onLeft,
      onError,
      // 내부 핸들러
      updateMessageOnStopSpeaking,
      updateMessage,
      sttDataHandler,
    };
  }, [
    onJoined,
    onAiAvatarStartSpeaking,
    onAiAvatarStopSpeaking,
    onAiAvatarMessage,
    onLeft,
    updateMessageOnStopSpeaking,
    updateMessage,
    sttDataHandler,
    onError,
  ]);

  //오디오 연결
  const connectUserAudio = useCallback(() => {
    if (!room) {
      throw new Error("Room is not initialized");
    }
    room.unmuteUserAudio();
  }, [room]);

  const muteUserAudio = useCallback(() => {
    if (!room) {
      throw new Error("Room is not initialized");
    }
    room.muteUserAudio();
  }, [room]);

  const disconnectUserAudio = useCallback(() => {
    if (!room) {
      throw new Error("Room is not initialized");
    }
    room.muteUserAudio();
  }, [room]);

  // 등록 핸들러 - handlersRef 참조
  // 외부 핸들러(props로 받는 핸들러)
  const handleJoined = useCallback(() => {
    handlersRef.current.onJoined?.();
  }, []);

  const handleAiAvatarStartSpeaking = useCallback(() => {
    handlersRef.current.onAiAvatarStartSpeaking?.();
  }, []);

  const handleAiAvatarStopSpeaking = useCallback(() => {
    handlersRef.current.onAiAvatarStopSpeaking?.();
    handlersRef.current.updateMessageOnStopSpeaking?.();
  }, []);

  const handleAgentMessage = useCallback((text: string) => {
    handlersRef.current.onAiAvatarMessage?.(text);
    handlersRef.current.updateMessage?.(text);
  }, []);

  const handleSttData = useCallback((data: STTData) => {
    handlersRef.current.sttDataHandler?.(data);
  }, []);

  const handleError = useCallback((error: ErrorData) => {
    handlersRef.current.onError?.(error);
  }, []);

  const handleLeft = useCallback(() => {
    handlersRef.current.onLeft?.();
  }, []);

  const joinRoom = async () => {
    console.log("VMONSTER_API_URL", process.env.NEXT_PUBLIC_VMONSTER_API_URL);
    const room = new Room({
      serverUrl: process.env.NEXT_PUBLIC_VMONSTER_API_URL || "",
    });
    setRoom(room);

    const streamData = await requestNewStreamLivekit({
      aiAvatarId: aiAvatarId,
      language: "ko", // 아바타가 이 언어 억양으로 발화합니다.
      maxDurationS: maxDurationS, // 세션 지속시간(초), 양의 정수 값.
    });

    setSessionId(streamData.session_id);
    // join room
    await room.join({
      sessionId: streamData.session_id,
      token: streamData.token,
      streamId: streamData.stream_id,
      config: {
        unmuteUserAudioOnJoined: unmuteUserAudioOnJoined,
        stt: {
          language: "ko",
        },
      },
    });

    room.on("joined", handleJoined);
    room.on("aiavatar-start-speaking", handleAiAvatarStartSpeaking);
    room.on("aiavatar-stop-speaking", handleAiAvatarStopSpeaking);
    room.on("aiavatar-message", handleAgentMessage);
    room.on("left", handleLeft);
    room.on("stt-data", (data: STTData) => handleSttData(data));
    room.on("error", (error: ErrorData) => handleError(error));
  };

  const speakAIAvatar = useCallback(
    ({text, disableInterrupt = false}: {text: string | AsyncIterable<string>, disableInterrupt?: boolean}) => {
      if (!room) {
        console.error("Room is not initialized");
        return;
      }
      if (typeof text !== "string") {
        room?.speak({
          stream: text,
          isStream: true,
          disableInterrupt: disableInterrupt,
        });
      } else {
        room?.speak({
          text: text as string,
          isStream: false,
          disableInterrupt: disableInterrupt,
        });
      }
    },
    [room]
  );

  const stopAIAvatarSpeaking = useCallback(() => {
    if (!room) {
      throw new Error("Room is not initialized");
    }
    room.stopSpeaking();
  }, [room]);

  const leaveRoom = useCallback(() => {
    if (!room) {
      throw new Error("Room is not initialized");
    }
    room.leave();
    setRoom(null); // room 상태 초기화
    setSessionId(null); // sessionId 상태 초기화
  }, [room]);

  const addAIAvatarVideo = useCallback(
    (style?: Partial<CSSStyleDeclaration>) => {
      if (!room) {
        throw new Error("Room is not initialized");
      }
      // 스타일이 있으면 전달, 없으면 SDK 기본값 사용
      if (style) {
        room.addVideo(style);
      } else {
        room.addVideo();
      }
    },
    [room]
  );

  const resetMessages = useCallback(() => {
    setAvatarMessages([]);
    setUserMessages([]);
    // ref 초기화 - 이전 세션의 메시지가 누적되는 것을 방지
    lastMessageRef.current = null;
    // lastMessageTimestampRef.current = null;
  }, []);

  return {
    room,
    sessionId,
    speakAIAvatar,
    joinRoom,
    leaveRoom,
    addAIAvatarVideo,
    connectUserAudio,
    muteUserAudio,
    disconnectUserAudio,
    avatarMessages,
    userMessages,
    resetMessages,
    stopAIAvatarSpeaking,
  };
};
