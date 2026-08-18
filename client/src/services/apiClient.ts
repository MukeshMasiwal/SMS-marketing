let isRefreshing = false;
let refreshSubscribers: Array<() => void> = [];

function onRefreshed() {
  refreshSubscribers.forEach((cb) => cb());
  refreshSubscribers = [];
}

const rawApiUrl = ((import.meta as any).env?.VITE_API_URL as string) || "";
const API_BASE_URL = rawApiUrl.replace(/\/+$/, "");

export function getApiUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export function formatApiErrorMessage(res: Response, defaultMsg = "An error occurred"): string {
  switch (res.status) {
    case 401:
      return "Your session has expired. Please log in again.";
    case 403:
      return "You do not have permission to access this resource.";
    case 404:
      return "The requested API endpoint was not found.";
    case 500:
      return "The server encountered an error. Please try again later.";
    default:
      return defaultMsg;
  }
}

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const fullUrl = getApiUrl(url);

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
      throw new Error("Unable to connect to the backend server. Connection timed out. Please check that the API server is running.");
    }
    throw new Error("Unable to connect to the backend server. Please check that the API server is running or configured correctly.");
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
        const refreshRes = await fetch(getApiUrl("/api/auth/refresh"), {
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
