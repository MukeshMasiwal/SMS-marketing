import { Campaign, ApiResponse } from "../types";

const API_BASE = "/api/campaigns";

export async function getCampaigns(params?: {
  search?: string;
  status?: string;
}): Promise<Campaign[]> {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.status && params.status !== "ALL" && params.status !== "all") {
    query.append("status", params.status);
  }

  const url = `${API_BASE}${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url);
  const data: ApiResponse<{ campaigns: Campaign[] }> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to fetch campaigns");
  }
  return data.data?.campaigns || (data as any).campaigns || [];
}

export async function getCampaignById(id: string): Promise<Campaign> {
  const res = await fetch(`${API_BASE}/${id}`);
  const data: ApiResponse<{ campaign: Campaign }> = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || "Failed to fetch campaign");
  }
  return data.data?.campaign || (data as any).campaign;
}

export async function createCampaign(data: {
  name: string;
  message: string;
  targetType?: string;
  targetGroupIds?: string[];
  targetContactIds?: string[];
}): Promise<Campaign> {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json: ApiResponse<{ campaign: Campaign }> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || "Failed to create campaign");
  }
  return json.data?.campaign || (json as any).campaign;
}

export async function updateCampaign(
  id: string,
  data: {
    name: string;
    message: string;
    targetType?: string;
    targetGroupIds?: string[];
    targetContactIds?: string[];
  }
): Promise<Campaign> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json: ApiResponse<{ campaign: Campaign }> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || "Failed to update campaign");
  }
  return json.data?.campaign || (json as any).campaign;
}

export async function deleteCampaign(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
  });
  const json: ApiResponse<{ message?: string }> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || "Failed to delete campaign");
  }
}
