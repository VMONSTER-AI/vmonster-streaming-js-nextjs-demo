export type CommunicationStatus =
  | "default"
  | "llm-loading"
  | "agent-loading"
  | "agent-speaking"
  | "disconnected"
  | "error";

export type JoinRoomStatus = "idle" | "joining" | "joined";

export const MessageRole = {
  HUMAN: "human",
  AI: "ai",
} as const;

export type MessageRole = (typeof MessageRole)[keyof typeof MessageRole];

type BaseMessage = {
  content: string;
  timestamp: string;
};

export type AvatarMessage = BaseMessage & {
  role: typeof MessageRole.AI;
  isFinal?: boolean;
};

export type UserMessage = BaseMessage & {
  role: typeof MessageRole.HUMAN;
};

export type Message = AvatarMessage | UserMessage;

type UIBaseMessage = {
  id: number;
  content: string;
  timestamp: string;
};

export type UIAvatarMessage = UIBaseMessage & {
  role: typeof MessageRole.AI;
  isFinal?: boolean;
};

export type UIUserMessage = UIBaseMessage & {
  role: typeof MessageRole.HUMAN;
};

export type UIMessage = UIAvatarMessage | UIUserMessage;
