import type { APIRequestContext } from '@playwright/test'

export type BusinessApiClientOptions = {
  baseURL: string
  token?: string
}

export class BusinessApiClient {
  constructor(private readonly request: APIRequestContext, private readonly options: BusinessApiClientOptions) {}

  private headers() {
    return this.options.token ? { Authorization: `Bearer ${this.options.token}` } : undefined
  }

  async getHealth() {
    const response = await this.request.get(`${this.options.baseURL}/healthz`, { headers: this.headers() })
    return { status: response.status(), ok: response.ok() }
  }

  async listProducts() {
    const response = await this.request.get(`${this.options.baseURL}/api/v1/ecommerce/products`, { headers: this.headers() })
    return { status: response.status(), ok: response.ok(), body: await safeJson(response) }
  }

  async getProduct(productId: string) {
    const response = await this.request.get(`${this.options.baseURL}/api/v1/ecommerce/products/${encodeURIComponent(productId)}`, { headers: this.headers() })
    return { status: response.status(), ok: response.ok(), body: await safeJson(response) }
  }
}

async function safeJson(response: { json: () => Promise<unknown>; text: () => Promise<string> }) {
  try {
    return await response.json()
  } catch {
    return { text: await response.text() }
  }
}
