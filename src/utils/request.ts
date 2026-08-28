/** 基于 fetch 的 HTTP 请求封装（超时 + UA + JSON 解析） */

const DEFAULT_UA = 'lx-music mobile request'
const TIMEOUT = 15000

export interface RequestOptions {
  method?: 'GET' | 'POST'
  headers?: Record<string, string>
  body?: string | FormData
  timeout?: number
  retry?: number
}

const request = (url: string, options: RequestOptions = {}): Promise<string> => {
  const {
    method = 'GET',
    headers = {},
    body,
    timeout = TIMEOUT,
    retry = 0,
  } = options
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  return fetch(url, {
    method,
    headers: {
      'User-Agent': DEFAULT_UA,
      ...headers,
    },
    body,
    signal: controller.signal,
  })
    .then(async res => {
      const text = await res.text()
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
      return text
    })
    .catch(err => {
      if (retry > 0) {
        return request(url, { ...options, retry: retry - 1 })
      }
      throw err
    })
    .finally(() => clearTimeout(timer))
}

/** 返回解析后的 JSON（支持 jsonp 前缀包裹容错） */
export const httpGetJson = async (url: string, options: RequestOptions = {}): Promise<any> => {
  const text = await request(url, options)
  return JSON.parse(text)
}

export const httpGetText = (url: string, options: RequestOptions = {}): Promise<string> =>
  request(url, options)

/** 对象 → urlencoded 字符串（避免依赖 URLSearchParams 兼容性） */
const toUrlEncoded = (obj: Record<string, any>): string =>
  Object.keys(obj)
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k] ?? '')}`)
    .join('&')

/** POST JSON，返回解析后的 JSON */
export const httpPostJson = async (url: string, body: any, options: RequestOptions = {}): Promise<any> => {
  const text = await request(url, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(options.headers ?? {}),
    },
    body: typeof body === 'string' ? body : toUrlEncoded(body),
  })
  return JSON.parse(text)
}

export default request
