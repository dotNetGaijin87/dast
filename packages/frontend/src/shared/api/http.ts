export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let body: { message?: string; details?: unknown } | undefined;
    try {
      body = (await res.json()) as { message?: string; details?: unknown };
    } catch {
      body = undefined;
    }
    throw new ApiError(body?.message ?? res.statusText, res.status, body?.details);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
