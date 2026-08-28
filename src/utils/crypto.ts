/** 纯 JS 加密工具（crypto-js 实现，避免原生模块，iOS/Android 通用）
 * 契约与原仓库 Android 原生 CryptoModule 对齐：
 * - aesEncrypt: text 按 UTF-8 字节加密，key/vi 为 base64 解码后的原始字节，输出 base64
 * - aesDecrypt: 输入 base64 密文，输出 UTF-8 明文
 * - hashSHA1 / md5: 输出 hex 小写
 */
import CryptoJS from 'crypto-js'

export const aesEncrypt = (text: string, keyB64: string, ivB64?: string): string => {
  const key = CryptoJS.enc.Base64.parse(keyB64)
  const iv = ivB64 ? CryptoJS.enc.Base64.parse(ivB64) : undefined
  const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(text), key, {
    mode: iv ? CryptoJS.mode.CBC : CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
    iv,
  })
  return CryptoJS.enc.Base64.stringify(encrypted.ciphertext)
}

export const aesDecrypt = (dataB64: string, keyB64: string, ivB64?: string): string => {
  const key = CryptoJS.enc.Base64.parse(keyB64)
  const iv = ivB64 ? CryptoJS.enc.Base64.parse(ivB64) : undefined
  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: CryptoJS.enc.Base64.parse(dataB64),
  })
  const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
    mode: iv ? CryptoJS.mode.CBC : CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
    iv,
  })
  return decrypted.toString(CryptoJS.enc.Utf8)
}

export const hashSHA1 = (str: string): string => CryptoJS.SHA1(str).toString(CryptoJS.enc.Hex)

export const md5 = (str: string): string => CryptoJS.MD5(str).toString(CryptoJS.enc.Hex)

/** 字符串 → hex */
export const stringToHex = (str: string): string =>
  CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(str))

/** hex → 字符串 */
export const hexToString = (hex: string): string =>
  CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Hex.parse(hex))

/** base64 → UTF-8 字符串 */
export const base64Decode = (b64: string): string =>
  CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(b64))

/** UTF-8 字符串 → base64 */
export const base64Encode = (str: string): string =>
  CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(str))

/** 随机 hex 串（n 字节） */
export const randomHex = (n: number): string => {
  const bytes = CryptoJS.lib.WordArray.random(n)
  return bytes.toString(CryptoJS.enc.Hex)
}

/** 随机 base64 串（n 字节） */
export const randomBase64 = (n: number): string =>
  CryptoJS.enc.Base64.stringify(CryptoJS.lib.WordArray.random(n))
