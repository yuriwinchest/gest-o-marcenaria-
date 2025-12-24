export type ApiEnvelope<T> = { ok: true; data: T } | { ok: false; error: string };

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<{ httpOk: boolean; status: number; body: ApiEnvelope<T> | null; rawText?: string }> {
  const res = await fetch(input, init);
  const status = res.status;
  const httpOk = res.ok;

  const text = await res.text();
  if (!text) return { httpOk, status, body: null, rawText: '' };

  try {
    const parsed = JSON.parse(text) as ApiEnvelope<T>;
    return { httpOk, status, body: parsed };
  } catch {
    return { httpOk, status, body: null, rawText: text.slice(0, 500) };
  }
}


