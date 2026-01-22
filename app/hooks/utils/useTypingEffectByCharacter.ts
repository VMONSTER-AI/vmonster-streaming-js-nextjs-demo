import { SetStateAction, useEffect, useRef, useState } from "react";

import { UIMessage, MessageRole } from "../video-chat-types";

export const TYPING_SPEED_MS = 40;

export const useTypingEffectByCharacter = () => {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const isTyping = useRef(false);
  const [agentMessageBuffer, setAgentMessageBuffer] = useState<string>();
  const typingIndex = useRef(0);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (agentMessageBuffer) {
      const isTargetLastMessage =
        messages.length > 0 &&
        messages[messages.length - 1].role === MessageRole.AI &&
        isTyping.current === true;

      if (!isTargetLastMessage) {
        const newMessageId =
          messages.length > 0 ? messages[messages.length - 1]?.id + 1 : 0;
        setMessages((prev) => [
          ...prev,
          {
            id: newMessageId,
            role: MessageRole.AI,
            content: "",
            isFinal: false,
            timestamp: new Date().toISOString(),
          },
        ]);
        isTyping.current = true;
      }

      // 타이핑 효과 함수
      const typeNextCharacter = () => {
        if (typingIndex.current < agentMessageBuffer.length) {
          setMessages((prev) => {
            const updatedMessages = [...prev];
            const lastMessage = updatedMessages[updatedMessages.length - 1];

            const updatedMessage = {
              ...lastMessage,
              content: agentMessageBuffer.substring(0, typingIndex.current + 1),
            };

            // 마지막 메시지 업데이트
            if (lastMessage.role === "ai") {
              updatedMessages[updatedMessages.length - 1] = updatedMessage;
            }
            return updatedMessages;
          });

          typingIndex.current++;
          typingTimer.current = setTimeout(typeNextCharacter, TYPING_SPEED_MS);
        }
      };

      typeNextCharacter();

      return () => {
        if (typingTimer.current) {
          clearTimeout(typingTimer.current);
        }
      };
    }
  }, [agentMessageBuffer]);

  const clearTypingContents = () => {
    setAgentMessageBuffer(undefined);
    typingIndex.current = 0;
    isTyping.current = false;
  };

  const handleAgentMessage = (text: string) => {
    setAgentMessageBuffer((prev) => {
      if (prev) {
        return prev + text;
      }
      return text;
    });
  };

  return {
    clearTypingContents,
    handleAgentMessage,
    currentAvatarMessage:
      messages.length > 0 ? messages[messages.length - 1] : null,
  };
};
