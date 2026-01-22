"use client";
import useVideoChat from "./hooks/useVideoChat";
import { useState } from "react";

export default function App() {
  const { joinRoomStatus,
    communicationStatus,
    currentAvatarMessage,
    remainingTime,
    isUserSpeaking,
    isUserAudioRecording,
    isUserAudioAllowed,
    join,
    leave,
    stopAIAvatarSpeaking,
    toggleUserAudio,
    speakAIAvatar,
    userMessages,
    avatarMessages,
    sessionId } = useVideoChat({
      aiAvatarId: process.env.NEXT_PUBLIC_AI_AVATAR_ID || "",
      userId: process.env.NEXT_PUBLIC_USER_ID || "",
    })

  const allMessages = [...userMessages, ...avatarMessages].sort((a, b) =>
    a.timestamp?.localeCompare(b.timestamp || "") || 0
  );

  const [input, setInput] = useState("");

  return <div className="container mx-auto">
    <h1 className="text-2xl font-bold">Vmonster Avatar Video Chat</h1>
    <div id="aiavatar-video-parent" className="w-full aspect-video bg-gray-100 rounded-lg overflow-hidden"></div>
    <button onClick={join} className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md">Join</button>
    <button onClick={leave} className="cursor-pointer bg-red-500 text-white px-4 py-2 rounded-md">Leave</button>
    <input type="text" className="border-2 border-gray-300 rounded-md p-2" value={input} onChange={(e) => setInput(e.target.value)} />
    <button onClick={() => speakAIAvatar({ text: input, disableInterrupt: false })} className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md">Speak AIAvatar</button>
    <button onClick={stopAIAvatarSpeaking} className="cursor-pointer bg-red-500 text-white px-4 py-2 rounded-md">Stop AIAvatar</button>
    <button onClick={toggleUserAudio} className="cursor-pointer bg-gray-500 text-white px-4 py-2 rounded-md">Toggle User Audio</button>
    <div>Join Room Status: {joinRoomStatus}</div>
    <div>Communication Status: {communicationStatus}</div>
    <div>Remaining Time: {remainingTime}</div>
    <div>Is User Speaking (VAD detected): {isUserSpeaking.toString()}</div>
    <div>Is User Audio Recording: {isUserAudioRecording?.toString()}</div>
    <div>Is User Audio Allowed: {isUserAudioAllowed?.toString()}</div>
    <div>Current Avatar Message:</div>
    <div className="flex flex-col gap-2 bg-gray-100 p-4 rounded-md min-h-10"> {currentAvatarMessage && <div className="ml-5">{currentAvatarMessage.role}: {currentAvatarMessage.content}</div>}</div>
    <div>All Messages:</div>
    <div className="flex flex-col gap-2 bg-gray-100 p-4 rounded-md min-h-40"> {allMessages.map((message, index) => {
      return <div key={index} className="ml-5">message: {JSON.stringify(message)}</div>
    })}</div>
    <div>Session ID: {sessionId}</div>
  </div>;
}