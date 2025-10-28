import { WheelList, SpinResult } from '../types.js';

interface CreateListRequest {
  name: string;
  description?: string;
  items?: Array<{ label: string; weight?: number }>;
}

interface UpdateListRequest {
  name?: string;
  description?: string;
  items?: Array<{ id?: string; label: string; weight?: number }>;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function fetchLists(): Promise<WheelList[]> {
  return request<WheelList[]>('/lists');
}

export async function createList(payload: CreateListRequest): Promise<WheelList> {
  return request<WheelList>('/lists', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateList(id: string, payload: UpdateListRequest): Promise<WheelList> {
  return request<WheelList>(`/lists/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteList(id: string): Promise<void> {
  await request<void>(`/lists/${id}`, {
    method: 'DELETE',
  });
}

export async function spinList(id: string): Promise<SpinResult> {
  return request<SpinResult>(`/lists/${id}/spins`, {
    method: 'POST',
  });
}
