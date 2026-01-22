export async function fetchRequest({
  method,
  endpoint,
  body,
  signal,
}: {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  endpoint: string;
  body?: any;
  signal?: AbortSignal;
}) {
  const url = endpoint.startsWith("http") ? endpoint : `/api${endpoint}`;
  const options: any = {
    method,
    signal,
    headers: {},
  };

  if (body) {
    if (body instanceof FormData) {
      options.body = body;
    } else {
      options.body = JSON.stringify({ ...body });
      options.headers["Content-Type"] = "application/json";
    }
  }

  return fetch(url, options);
}

// fetch response 처리 함수
export async function handleFetchResponse(response: Response) {
  if (!response.ok) {
    throw new Error(`Server error: ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  return data;
}
