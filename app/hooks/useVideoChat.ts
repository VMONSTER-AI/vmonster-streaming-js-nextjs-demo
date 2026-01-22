// useVideoChat.ts
// 비디오 챗 데모 훅입니다. 
// - useAIAvatar 훅을 연결하여 Room 관련 메서드를 제공합니다.(joinRoom, leaveRoom, addAIAvatarVideo, speakAIAvatar, stopAIAvatarSpeaking, avatarMessages, userMessages, resetMessages, sessionId)
// - hooks/utils/ 의 유틸리티 훅들(useTimer, useAskUserAudioPermission, useTypingEffectBy~)을 사용하여 제한시간(remainingTime) 설정, 타이핑 효과(TypingEffect) 적용, 유저 오디오 권한 요청, 유저 오디오 토글을 합니다.
// - UI에 표시하는 유틸 state를 제공합니다. (joinRoomStatus, communicationStatus, currentAvatarMessage, remainingTime, isUserSpeaking, isUserAudioRecording, isUserAudioAllowed)


"use client";

import { useCallback, useEffect, useState } from "react";

import { CommunicationStatus, JoinRoomStatus } from "./video-chat-types";
import { useAskUserAudioPermission } from "./utils/useAskUserAudioPermission";
import useTimer from "./utils/useTimer";
import { useAIAvatar } from "./useAIAvatar";
import { ErrorData } from "vmonster-streaming-js";
import { UNMUTE_USER_AUDIO_ON_JOINED, WELCOME_MESSAGE } from "./constants";
import { useTypingEffectBySentence } from "./utils/useTypingEffectBySentence";
import { useTypingEffectByCharacter } from "./utils/useTypingEffectByCharacter";

interface useVideoChatProps {
  aiAvatarId: string;
  userId: string;
}

const useVideoChat = ({ aiAvatarId }: useVideoChatProps) => {
  const [communicationStatus, setCommunicationStatus] =
    useState<CommunicationStatus>("default");
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);

  const handleUserSTTTranscript = async (text: string) => {
    if (communicationStatus === "default" && text.trim() !== "") {
      console.log("handleUserSTTTranscript", text);
    } else {
      console.log("handleUserSTTTranscript", text, "skip");
    }
  };

  const [joinRoomStatus, setJoinRoomStatus] = useState<JoinRoomStatus>("idle");

  const join = () => {
    setJoinRoomStatus("joining");
    joinRoom();
  };

  const leave = () => {
    setJoinRoomStatus("idle");
    leaveRoom();
  };

  const {
    room,
    joinRoom,
    addAIAvatarVideo,
    speakAIAvatar,
    leaveRoom,
    stopAIAvatarSpeaking,
    avatarMessages,
    userMessages,
    resetMessages,
    sessionId,
  } = useAIAvatar({
    aiAvatarId: aiAvatarId,
    unmuteUserAudioOnJoined: UNMUTE_USER_AUDIO_ON_JOINED,
    maxDurationS: 300, // 세션 지속시간(초), 양의 정수 값. 서버측 타임아웃 시간을 설정합니다.
    onJoined: async () => {
      // [제한시간 타이머 설정] 300초 제한시간 타이머를 설정합니다.(클라이언트측) useTimer 훅에 등록된 callback이 실행됩니다.
      setTimer(300);
      console.log("onJoined");

      // [AIAvatar 비디오 추가] Joined 시점에 AIAvatar 비디오를 추가합니다.
      addAIAvatarVideo({ width: "100%", height: "100%" });

      // [상태 업데이트]
      setJoinRoomStatus("joined");
      setCommunicationStatus("default");
      console.log("UNMUTE_USER_AUDIO_ON_JOINED", UNMUTE_USER_AUDIO_ON_JOINED);
      setIsUserAudioRecording(UNMUTE_USER_AUDIO_ON_JOINED);

      // [Welcome Message 발화] Joined 시점에 아바타에 Welcome Message를 발화를 요청합니다.
      speakAIAvatar({ text: WELCOME_MESSAGE, disableInterrupt: true });
    },  
    onAiAvatarStartSpeaking: () => {
      console.log("onAiAvatarStartSpeaking");
      setCommunicationStatus("agent-speaking");
    },
    onAiAvatarStopSpeaking: () => {
      console.log("onAiAvatarStopSpeaking");
      setCommunicationStatus("default");
      clearTypingContents();
    },
    onAiAvatarMessage: (text) => {
      console.log("onAiAvatarMessage", text);
      handleAgentMessage(text);
    },
    onLeft: () => {
      console.log("onLeft");
      setJoinRoomStatus("idle");
      setCommunicationStatus("disconnected");
      resetMessages();
      // [권장] 확실한 연결 종료를 위해 페이지를 리로드하는 것을 권장합니다.
      window.location.reload();
    },
    onUserStartSpeaking: () => {
      setIsUserSpeaking(true);
      console.log("onUserStartSpeaking");
    },
    onUserStopSpeaking: () => {
      setIsUserSpeaking(false);
      console.log("onUserStopSpeaking");
    },
    onUserSTTTranscript: handleUserSTTTranscript,
    onError: (error: ErrorData) => {
      console.error(error);
      if (error.code === "AVATAR_ALLOCATION_FAILED") {
        alert("Failed to allocate AI avatar");
      } else if (error.code === "AVATAR_CONNECTION_FAILED") {
        alert("Failed to connect to AI avatar");
      } else if (error.code === "LLM_CONNECTION_FAILED") {
        alert("Failed to connect to LLM");
      }
    },
  });

  // [타이핑 효과] Option1 - 문장 단위로 타이핑 효과를 줍니다.
  // const { clearTypingContents, handleAgentMessage, currentAvatarMessage } =
  //   useTypingEffectBySentence();
  // [타이핑 효과] Option2 - 글자 단위로 타이핑 효과를 줍니다.
  const { clearTypingContents, handleAgentMessage, currentAvatarMessage } =
    useTypingEffectByCharacter();

  const handleLeave = useCallback(async () => {
    try {
      if (joinRoomStatus === "joined") {
        leaveRoom();
        // joined 된 이후 leave가 되었을 때 아래가 실행된다.
        setCommunicationStatus("disconnected");
      }
    } catch (error) {
      console.error(error);
    }
  }, [joinRoomStatus, leaveRoom]);

  const { remainingTime, setTimer } = useTimer({
    callback: () => handleLeave(),
  });

  // ---- 유저 인터랙션 모드 관련 ----
  const { isUserAudioAllowed } = useAskUserAudioPermission(); // 진입 시 오디오 권한 요청
  const [isUserAudioRecording, setIsUserAudioRecording] = useState<
    boolean | undefined
  >(undefined);

  useEffect(() => {
    if (!isUserAudioAllowed !== undefined) {
      setIsUserAudioRecording(false);
    }
  }, [isUserAudioAllowed]);

  // 유저 오디오 토글 함수
  const toggleUserAudio = async () => {
    if (!room) {
      return;
    }
    if (
      isUserAudioRecording === undefined ||
      isUserAudioAllowed === undefined ||
      !isUserAudioAllowed
    ) {
      return;
    }
    const recording = isUserAudioRecording;
    try {
      if (recording) {
        setIsUserAudioRecording(false);
        // 유저 오디오 뮤트 - 추후 빠른 오디오 연결을 위해 트랙만 mute합니다.
        await room.muteUserAudio();
        // [옵션] 오디오 트랙 unpublish - 오디오 트랙 연결 자체를 끊습니다.
        // await room.unpublishUserAudio();
      } else {
        setIsUserAudioRecording(true);
        await room?.unmuteUserAudio();
      }
    } catch (error) {
      setIsUserAudioRecording(recording);
      console.error(error);
    }
  };

  return {
    joinRoomStatus,
    communicationStatus,
    currentAvatarMessage,
    remainingTime,
    isUserSpeaking,
    setIsUserSpeaking,
    isUserAudioRecording,
    setIsUserAudioRecording,
    isUserAudioAllowed,
    join,
    leave,
    toggleUserAudio,
    speakAIAvatar,
    stopAIAvatarSpeaking,
    userMessages,
    avatarMessages,
    sessionId,
  };
};
export default useVideoChat;
