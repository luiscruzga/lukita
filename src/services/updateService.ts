import { Linking, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import Constants from 'expo-constants';
import { storage, STORAGE_KEYS } from '@/lib/storage';
import { env } from '@/lib/env';

/**
 * Auto-actualización desde GitHub Releases (mismo flujo que el workflow android-apk.yml):
 * consulta releases/latest de EXPO_PUBLIC_GITHUB_REPO, compara el tag vX.Y.Z con expo.version y,
 * en Android, descarga el .apk dentro de la app y abre el instalador del sistema.
 */

export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  apkUrl?: string;
  releaseUrl?: string;
  releaseNotes?: string;
  publishedAt?: string;
}

export interface DownloadProgress {
  writtenBytes: number;
  totalBytes: number;
}

const AUTO_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000; // respeta el límite de 60 req/h de GitHub sin token
const MIN_APK_BYTES = 1024 * 1024;
const APK_MIME = 'application/vnd.android.package-archive';
const FLAG_GRANT_READ_URI_PERMISSION = 0x00000001;
const FLAG_ACTIVITY_NEW_TASK = 0x10000000;

let activeDownload: FileSystem.DownloadResumable | null = null;

export function isNewerVersion(remote: string, current: string) {
  const parse = (v: string) => v.replace(/^v/i, '').split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);
  const r = parse(remote);
  const c = parse(current);
  for (let i = 0; i < Math.max(r.length, c.length); i++) {
    if ((r[i] ?? 0) > (c[i] ?? 0)) return true;
    if ((r[i] ?? 0) < (c[i] ?? 0)) return false;
  }
  return false;
}

export const UpdateService = {
  currentVersion(): string {
    return Constants.expoConfig?.version ?? '1.0.0';
  },

  /** La auto-actualización solo aplica al APK de Android; en web siempre se sirve la última versión. */
  isSupported() {
    return Platform.OS === 'android';
  },

  isAutoEnabled: () => storage.get<boolean>(STORAGE_KEYS.autoUpdates, true),
  setAutoEnabled: (v: boolean) => storage.set(STORAGE_KEYS.autoUpdates, v),

  async check(force = false): Promise<UpdateInfo> {
    const currentVersion = this.currentVersion();
    const none: UpdateInfo = { currentVersion, latestVersion: currentVersion, hasUpdate: false };
    if (!force) {
      const last = await storage.get<number>(STORAGE_KEYS.lastUpdateCheck, 0);
      if (Date.now() - last < AUTO_CHECK_INTERVAL_MS) return none;
    }
    try {
      const res = await fetch(`https://api.github.com/repos/${env.githubRepo}/releases/latest`, { headers: { Accept: 'application/vnd.github+json' } });
      await storage.set(STORAGE_KEYS.lastUpdateCheck, Date.now());
      if (!res.ok) return none;
      const release = await res.json();
      const latestVersion = String(release.tag_name ?? '').replace(/^v/i, '') || currentVersion;
      const apk = Array.isArray(release.assets) ? release.assets.find((a: { name?: string }) => a.name?.toLowerCase().endsWith('.apk')) : null;
      return {
        currentVersion,
        latestVersion,
        hasUpdate: isNewerVersion(latestVersion, currentVersion),
        apkUrl: apk?.browser_download_url,
        releaseUrl: release.html_url,
        releaseNotes: release.body ?? '',
        publishedAt: release.published_at,
      };
    } catch {
      return none;
    }
  },

  latestReleaseUrl() {
    return `https://github.com/${env.githubRepo}/releases/latest`;
  },

  async openReleasePage(url?: string) {
    const target = url ?? this.latestReleaseUrl();
    if (Platform.OS === 'web') window.open(target, '_blank', 'noopener');
    else await Linking.openURL(target);
  },

  async download(apkUrl: string, version: string, onProgress: (p: DownloadProgress) => void): Promise<string | null> {
    if (!FileSystem.cacheDirectory) throw new Error('Almacenamiento no disponible');
    const dir = `${FileSystem.cacheDirectory}updates/`;
    await FileSystem.deleteAsync(dir, { idempotent: true });
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const fileUri = `${dir}lukita-${version.replace(/[^\w.-]/g, '')}.apk`;
    let expected = 0;
    const task = FileSystem.createDownloadResumable(apkUrl, fileUri, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      if (totalBytesExpectedToWrite > 0) expected = totalBytesExpectedToWrite;
      onProgress({ writtenBytes: totalBytesWritten, totalBytes: Math.max(totalBytesExpectedToWrite, 0) });
    });
    activeDownload = task;
    try {
      const result = await task.downloadAsync();
      if (!result) return null;
      if (result.status < 200 || result.status >= 300) throw new Error(`HTTP ${result.status}`);
      const info = await FileSystem.getInfoAsync(result.uri);
      const size = info.exists ? info.size : 0;
      if (size < MIN_APK_BYTES || (expected > 0 && size !== expected)) throw new Error('Descarga incompleta');
      return result.uri;
    } catch (e) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => undefined);
      if (activeDownload !== task) return null;
      throw e;
    } finally {
      if (activeDownload === task) activeDownload = null;
    }
  },

  async cancel() {
    const t = activeDownload;
    activeDownload = null;
    await t?.cancelAsync().catch(() => undefined);
  },

  async install(fileUri: string) {
    const contentUri = await FileSystem.getContentUriAsync(fileUri);
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', { data: contentUri, type: APK_MIME, flags: FLAG_GRANT_READ_URI_PERMISSION | FLAG_ACTIVITY_NEW_TASK });
  },

  async openInstallPermissionSettings() {
    const pkg = Constants.expoConfig?.android?.package;
    await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.MANAGE_UNKNOWN_APP_SOURCES, { data: pkg ? `package:${pkg}` : undefined });
  },
};
