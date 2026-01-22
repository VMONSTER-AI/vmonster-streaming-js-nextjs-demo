import { useRef, useState } from "react";

import { UIMessage, MessageRole } from "./video-chat-types";

const SENTENCE_DELAY_MS = 500; // 문장 간 지연 시간
const TYPING_SPEED_MS = 110; // 타이핑 속도

export const useTypingEffectBySentence = () => {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const isTyping = useRef(false);
  const typingIndex = useRef(0);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);

  const sentenceQueueRef = useRef<string[]>([]);
  const residualBufferRef = useRef<string>("");
  const currentSentenceRef = useRef<string>("");

  const extractCompleteSentences = (text: string) => {
    const sentences: string[] = [];
    const regex = /([^.!?]+[.!?]+)/g;
    let match: RegExpExecArray | null;
    let lastIndex = 0;

    while ((match = regex.exec(text)) !== null) {
      sentences.push(match[1].trim());
      lastIndex = regex.lastIndex;
    }

    return {
      sentences,
      remainder: text.slice(lastIndex),
    };
  };

  const ensureAiMessage = () => {
    const lastMessage = messages[messages.length - 1];
    const lastIsAi = lastMessage && lastMessage.role === MessageRole.AI;
    if (!lastIsAi) {
      const newMessageId =
        messages.length > 0 ? messages[messages.length - 1].id + 1 : 0;
      setMessages((prev) => [
        ...prev,
        {
          id: newMessageId,
          role: MessageRole.AI,
          content: "",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  const typeNextSentence = () => {
    if (isTyping.current) return;
    if (sentenceQueueRef.current.length === 0) return;

    ensureAiMessage();

    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last && last.role === MessageRole.AI && last.content) {
        updated[updated.length - 1] = { ...last, content: "" };
      }
      return updated;
    });

    currentSentenceRef.current = sentenceQueueRef.current.shift() || "";
    isTyping.current = true;
    typingIndex.current = 0;

    const typeNextCharacter = () => {
      if (typingIndex.current < currentSentenceRef.current.length) {
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === MessageRole.AI) {
            updated[updated.length - 1] = {
              ...last,
              content: currentSentenceRef.current,
            };
          }
          return updated;
        });
        typingIndex.current++;
        typingTimer.current = setTimeout(typeNextCharacter, TYPING_SPEED_MS);
      } else {
        isTyping.current = false;
        setTimeout(() => {
          typeNextSentence();
        }, SENTENCE_DELAY_MS);
      }
    };

    typeNextCharacter();
  };

  const clearTypingContents = () => {
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
      typingTimer.current = null;
    }
    isTyping.current = false;
    typingIndex.current = 0;
    currentSentenceRef.current = "";
    sentenceQueueRef.current = [];
    residualBufferRef.current = "";
  };

  const handleAgentMessage = (chunk: string) => {
    const merged = residualBufferRef.current + chunk;
    const { sentences, remainder } = extractCompleteSentences(merged);
    if (sentences.length > 0) {
      sentenceQueueRef.current.push(
        ...sentences.map((s) => s.replace(/\s+/g, " ").trim())
      );
      residualBufferRef.current = remainder;
      if (!isTyping.current) {
        typeNextSentence();
      }
    } else {
      residualBufferRef.current = merged;
    }
  };

  return {
    messages,
    clearTypingContents,
    handleAgentMessage,
    currentAvatarMessage:
      messages.length > 0 ? messages[messages.length - 1] : null,
  };
};
