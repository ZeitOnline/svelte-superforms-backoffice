type PostgrestMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type QueryValue = string | number | boolean | null | undefined;

type PostgrestErrorPayload = {
  message?: string;
  [key: string]: unknown;
};

type RequestPostgrestOptions<TBody = unknown> = {
  fetchFn?: typeof fetch;
  url?: string;
  baseUrl?: string;
  path?: string;
  method?: PostgrestMethod;
  query?: URLSearchParams;
  headers?: Record<string, string>;
  body?: TBody;
  errorMessage?: string;
};

export class PostgrestError extends Error {
  status: number;
  details: unknown;
  url: string;

  constructor({
    message,
    status,
    details,
    url,
  }: {
    message: string;
    status: number;
    details: unknown;
    url: string;
  }) {
    super(message);
    this.name = 'PostgrestError';
    this.status = status;
    this.details = details;
    this.url = url;
  }
}

export const getPostgrestErrorMessage = (error: unknown, fallback = 'Unknown error'): string => {
  if (error instanceof PostgrestError) {
    if (typeof error.details === 'string' && error.details.length > 0) {
      return error.details;
    }
    if (
      error.details &&
      typeof error.details === 'object' &&
      'message' in error.details &&
      typeof (error.details as { message?: unknown }).message === 'string'
    ) {
      return (error.details as { message: string }).message;
    }
  }
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  return fallback;
};

export const pg = {
  eq: (value: string | number | boolean) => `eq.${value}`,
  order: (column: string, direction: 'asc' | 'desc') => `${column}.${direction}`,
};

export const buildQueryParams = (entries: Array<[string, QueryValue]>) => {
  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    if (value === null || value === undefined) continue;
    params.set(key, String(value));
  }
  return params;
};

const buildEndpointUrl = ({
  url,
  baseUrl,
  path,
}: {
  url?: string;
  baseUrl?: string;
  path?: string;
}) => {
  if (url) return url;
  if (!baseUrl) {
    throw new Error('requestPostgrest requires either `url` or `baseUrl`');
  }
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = (path ?? '').replace(/^\/+/, '');
  return normalizedPath ? `${normalizedBase}/${normalizedPath}` : normalizedBase;
};

const withQuery = (url: string, query?: URLSearchParams) => {
  if (!query || [...query.keys()].length === 0) return url;
  return `${url}?${query.toString()}`;
};

const getContentType = (response: Response) => {
  const headers = (response as { headers?: Headers }).headers;
  if (!headers || typeof headers.get !== 'function') {
    return '';
  }
  return headers.get('content-type') ?? '';
};

const parseResponseBody = async <T>(response: Response): Promise<T> => {
  if (response.status === 204 || response.status === 205) {
    return undefined as T;
  }
  const contentType = getContentType(response);
  if (
    contentType.includes('application/json') ||
    (typeof (response as { json?: unknown }).json === 'function' &&
      typeof (response as { text?: unknown }).text !== 'function')
  ) {
    return (await response.json()) as T;
  }
  if (typeof (response as { text?: unknown }).text !== 'function') {
    return undefined as T;
  }
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  return text as T;
};

const parseErrorPayload = async (response: Response): Promise<unknown> => {
  const contentType = getContentType(response);
  if (contentType.includes('application/json')) {
    try {
      return (await response.json()) as PostgrestErrorPayload;
    } catch {
      return null;
    }
  }

  if (typeof (response as { text?: unknown }).text !== 'function') {
    return null;
  }
  try {
    const text = await response.text();
    return text || null;
  } catch {
    return null;
  }
};

const toErrorMessage = (fallback: string, details: unknown) => {
  if (details && typeof details === 'object') {
    const message = (details as PostgrestErrorPayload).message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }
  if (typeof details === 'string' && details.length > 0) {
    return details;
  }
  return fallback;
};

export const requestPostgrest = async <TResponse, TBody = unknown>({
  fetchFn = fetch,
  url,
  baseUrl,
  path,
  method = 'GET',
  query,
  headers,
  body,
  errorMessage = 'PostgREST request failed',
}: RequestPostgrestOptions<TBody>): Promise<{ data: TResponse; response: Response }> => {
  const endpoint = buildEndpointUrl({ url, baseUrl, path });
  const finalUrl = withQuery(endpoint, query);
  const requestHeaders = new Headers(headers);

  if (body !== undefined && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetchFn(finalUrl, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const details = await parseErrorPayload(response);
    throw new PostgrestError({
      message: toErrorMessage(`${errorMessage}: ${response.status}`, details),
      status: response.status,
      details,
      url: finalUrl,
    });
  }

  const data = await parseResponseBody<TResponse>(response);
  return { data, response };
};
