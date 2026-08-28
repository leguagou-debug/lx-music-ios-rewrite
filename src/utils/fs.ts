/** 文件系统封装（react-native-fs，iOS/Android 通用）
 * 原仓库的 react-native-file-system 是 Android-only fork，这里统一使用官方 react-native-fs。
 */
import RNFS from 'react-native-fs'
import { sanitizeFileName } from './format'

/** 基础目录 */
export const temporaryDirectoryPath = RNFS.CachesDirectoryPath
export const externalStorageDirectoryPath = RNFS.DocumentDirectoryPath
export const privateStorageDirectoryPath = RNFS.DocumentDirectoryPath

/** 应用数据目录（歌曲/歌词/封面缓存） */
export const musicCacheDir = `${RNFS.DocumentDirectoryPath}/lx-music/cache`
export const musicDownloadDir = `${RNFS.DocumentDirectoryPath}/lx-music/download`
export const lyricCacheDir = `${RNFS.DocumentDirectoryPath}/lx-music/lyric`
export const picCacheDir = `${RNFS.CachesDirectoryPath}/lx-music/pic`

/** 确保目录存在 */
export const ensureDir = async (dir: string): Promise<void> => {
  try {
    const exists = await RNFS.exists(dir)
    if (!exists) await RNFS.mkdir(dir)
  } catch {
    // ignore
  }
}

/** 初始化所有目录 */
export const initDirs = async (): Promise<void> => {
  await Promise.all([musicCacheDir, musicDownloadDir, lyricCacheDir, picCacheDir].map(ensureDir))
}

/** 判断文件/目录是否存在 */
export const exists = (path: string): Promise<boolean> => RNFS.exists(path)

/** 创建目录（含父级） */
export const mkdir = async (path: string): Promise<void> => {
  await RNFS.mkdir(path)
}

/** 删除文件/目录 */
export const unlink = (path: string): Promise<void> => RNFS.unlink(path)

/** 读取文件文本 */
export const readFile = (path: string): Promise<string> => RNFS.readFile(path, 'utf8')

/** 写入文件文本 */
export const writeFile = (path: string, data: string): Promise<void> =>
  RNFS.writeFile(path, data, 'utf8')

/** 追加写入 */
export const appendFile = (path: string, data: string): Promise<void> =>
  RNFS.appendFile(path, data, 'utf8')

/** 读取目录列表 */
export const readDir = (path: string): Promise<RNFS.ReadDirItem[]> => RNFS.readDir(path)

/** 获取文件状态 */
export const stat = (path: string): Promise<RNFS.StatResult> => RNFS.stat(path)

/** 歌曲文件名：`源 - songmid - 歌名 - 歌手.ext` */
export const getMusicFileName = (source: string, songmid: string, name: string, singer: string, ext: string): string =>
  `${source} - ${songmid} - ${sanitizeFileName(name)} - ${sanitizeFileName(singer)}.${ext}`

/** 歌曲缓存路径 */
export const getMusicCachePath = (source: string, songmid: string, name: string, singer: string, ext: string): string =>
  `${musicCacheDir}/${getMusicFileName(source, songmid, name, singer, ext)}`

/** 下载歌曲文件到缓存目录 */
export const downloadFile = (
  url: string,
  toFile: string,
  onProgress?: (received: number, total: number) => void,
): { promise: Promise<RNFS.DownloadResult>; jobId: number } => {
  const options: RNFS.DownloadFileOptions = {
    fromUrl: url,
    toFile,
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
    },
  }
  if (onProgress) {
    options.progressInterval = 500
    options.progressDivider = 1
    options.begin = () => {}
    options.progress = res => onProgress(res.bytesWritten, res.contentLength)
  }
  const { jobId, promise } = RNFS.downloadFile(options)
  return { jobId, promise }
}

export const stopDownload = (jobId: number): void => {
  try {
    RNFS.stopDownload(jobId)
  } catch {
    // ignore
  }
}

/** 删除目录下所有文件（清缓存） */
export const clearDir = async (dir: string): Promise<void> => {
  try {
    const items = await RNFS.readDir(dir)
    await Promise.all(items.map(item => RNFS.unlink(item.path)))
  } catch {
    // ignore
  }
}
