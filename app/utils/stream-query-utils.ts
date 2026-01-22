import { fetchRequest, handleFetchResponse } from "./query-utils";

export interface NewStreamLivekitConfig {
  aiAvatarId: string;
  language: string;
  maxDurationS?: number;
}

export interface LivekitStreamData {
  token: string;
  session_id: string;
  stream_id: string;
}

export async function requestNewStreamLivekit(
  config: NewStreamLivekitConfig,
  signal?: AbortSignal
): Promise<LivekitStreamData> {
  const formData = new FormData();
  formData.append("aiavatar_id", config.aiAvatarId);
  formData.append("language", config.language);
  formData.append("max_duration_s", config.maxDurationS?.toString() || "300"); // 서버측 세션 타임아웃(초), 양의 정수 값. 최대 3600초(1시간) 까지 설정할 수 있습니다.

  const response = await fetchRequest({
    method: "POST",
    endpoint: "/streams",
    body: formData,
    signal,
  });

  const data = await handleFetchResponse(response);

  if (!isLivekitStreamData(data)) {
    throw new Error("Server Error: returned of non-StreamData");
  }
  return data;
}

function isLivekitStreamData(data: {
  token: string;
  session_id: string;
}): data is LivekitStreamData {
  return (
    typeof data === "object" &&
    data !== null &&
    typeof data.token === "string" &&
    typeof data.session_id === "string"
  );
}
