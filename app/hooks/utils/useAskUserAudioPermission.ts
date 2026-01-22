// useAskUserAudioPermission.ts
// 진입시 미리 오디오 권한을 요청하고, joined 시점에 곧바로 오디오 트랙을 연결하기 위한 훅
// 미리 연결한 오디오 트랙은 즉시 중지합니다.

import { useEffect, useState } from "react";

export const useAskUserAudioPermission = () => {
  const [isUserAudioAllowed, setIsUserAudioAllowed] = useState<
    boolean | undefined
  >(undefined);

  useEffect(() => {
    const askForAudioPermission = async () => {
      try {
        const newMediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

        newMediaStream.getAudioTracks().forEach((track) => {
          track.stop();
        });

        setIsUserAudioAllowed(true);
      } catch (error) {
        setIsUserAudioAllowed(false);
      }
    };

    askForAudioPermission();
  }, []);

  return {
    isUserAudioAllowed,
  };
};
