let isRefreshing = false;
let refreshSubscribers: Array<() => void> = [];

function onRefreshed() {
  refreshSubscribers.forEach((cb) => cb());
  refreshSubscribers = [];
}

const API_BASE_URL = ((import.meta as any).env?.VITE_API_URL as string) || "";

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

  const defaultOptions: RequestInit = {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
  const optionsWithSignal: RequestInit = {
    ...defaultOptions,
    signal: options.signal || controller.signal,
  };

  let response: Response;
  try {
    response = await fetch(fullUrl, optionsWithSignal);
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Unable to connect to the authentication server. Please make sure the server is running.");
    }
    throw new Error("Unable to connect to the authentication server. Please make sure the server is running.");
  } finally {
    clearTimeout(timeoutId);
  }

  // If 401 Unauthorized, attempt refresh once (unless it's an auth endpoint itself)
  const isAuthEndpoint =
    fullUrl.includes("/api/auth/login") ||
    fullUrl.includes("/api/auth/signup") ||
    fullUrl.includes("/api/auth/refresh") ||
    fullUrl.includes("/api/auth/verify-email");

  if (response.status === 401 && !isAuthEndpoint) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (refreshRes.ok) {
          isRefreshing = false;
          onRefreshed();
          return await fetch(fullUrl, defaultOptions);
        } else {
          isRefreshing = false;
          refreshSubscribers = [];
          return response;
        }
      } catch (err) {
        isRefreshing = false;
        refreshSubscribers = [];
        return response;
      }
    } else {
      // Queue request until refresh completes
      return new Promise<Response>((resolve) => {
        refreshSubscribers.push(async () => {
          const retryRes = await fetch(fullUrl, defaultOptions);
          resolve(retryRes);
        });
      });
    }
  }

  return response;
}
