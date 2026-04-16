import { signOut } from "./action/clientAction";

export class HttpClient {
  private baseUrl = '/api';
  private requestQueue: (() => Promise<void>)[] = [];
  private isProcessingQueue = false;

  private async enqueueRequest<T>(
    fn: () => Promise<{ data: T; status: number; message: string, errors: string[] | undefined }>,
  ) {
    return new Promise<{ data: T; status: number; message: string, errors: string[] | undefined }>(
      (resolve, reject) => {
        this.requestQueue.push(async () => {
          try {
            const result = await fn();
            resolve(result);
          } catch (err) {
            reject(err);
          }
        });
        if (!this.isProcessingQueue) this.processQueue();
      },
    );
  }

  private async processQueue() {
    this.isProcessingQueue = true;
    while (this.requestQueue.length > 0) {
      const req = this.requestQueue.shift();
      if (req) await req();
    }
    this.isProcessingQueue = false;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
    isFormData = false,
  ) {
    return this.enqueueRequest(async () => {
      const headers = new Headers(options.headers);
      if (!isFormData) headers.set('Content-Type', 'application/json');

      const url = `${this.baseUrl}${endpoint}`;
      const res = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
      if (res.status === 401) {
        await signOut();
        throw new Error('Forbidden - signing out');
      }

      if (res.status >= 500 && res.status < 600) {
        let message = `Server Error`;
        try {
          const errorData = await res.json();
          message = errorData.message || message;
        } catch { }

        throw new Error(message);
      }
      const responseData = await res.json();
      return {
        data: responseData.data as T,
        errors: responseData.errors as string[],
        status: res.status,
        message: responseData.message || '',
      };
    });
  }

  get<T = any>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T = any>(endpoint: string, body: any, options?: RequestInit) {
    const isFormData = body instanceof FormData;
    return this.request<T>(
      endpoint,
      {
        ...options,
        method: 'POST',
        body: isFormData ? body : JSON.stringify(body),
      },
      isFormData,
    );
  }

  put<T = any>(endpoint: string, body: any, options?: RequestInit) {
    const isFormData = body instanceof FormData;
    return this.request<T>(
      endpoint,
      {
        ...options,
        method: 'PUT',
        body: isFormData ? body : JSON.stringify(body),
      },
      isFormData,
    );
  }

  delete<T = any>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const httpClient = new HttpClient();
