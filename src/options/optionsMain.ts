import * as fs from 'fs';

import axios from 'axios';
import * as log from 'loglevel';

// package.json is `require`d to let tsc strip the `src` folder by determining
// baseUrl=src. A static import would prevent that and cause an ugly extra `src` folder in `lib`
const packageJson = require('../../package.json'); // eslint-disable-line @typescript-eslint/no-var-requires
import {
  DEFAULT_ELECTRON_VERSION,
  PLACEHOLDER_APP_DIR,
  ELECTRON_MAJOR_VERSION,
} from '../constants';
import { inferPlatform, inferArch } from '../infer/inferOs';
import { asyncConfig } from './asyncConfig';
import { AppOptions } from './model';
import { normalizeUrl } from './normalizeUrl';

const SEMVER_VERSION_NUMBER_REGEX = /\d+\.\d+\.\d+[-_\w\d.]*/;

/**
 * Process and validate raw user arguments
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function getOptions(rawOptions: any): Promise<AppOptions> {
  const options: AppOptions = {
    packager: {
      appCopyright: rawOptions.appCopyright,
      appVersion: rawOptions.appVersion,
      arch: rawOptions.arch || inferArch(),
      asar: rawOptions.asar || rawOptions.conceal || false,
      buildVersion: rawOptions.buildVersion,
      darwinDarkModeSupport: rawOptions.darwinDarkModeSupport || false,
      dir: PLACEHOLDER_APP_DIR,
      electronVersion: rawOptions.electronVersion || DEFAULT_ELECTRON_VERSION,
      icon: rawOptions.icon,
      name: typeof rawOptions.name === 'string' ? rawOptions.name : '',
      out: rawOptions.out || process.cwd(),
      overwrite: rawOptions.overwrite,
      platform: rawOptions.platform,
      portable: rawOptions.portable || false,
      targetUrl:
        rawOptions.targetUrl === undefined
          ? '' // We'll plug this in later via upgrade
          : normalizeUrl(rawOptions.targetUrl),
      tmpdir: false, // workaround for electron-packager#375
      upgrade: rawOptions.upgrade !== undefined ? true : false,
      upgradeFrom: rawOptions.upgrade,
      win32metadata: rawOptions.win32metadata || {
        ProductName: rawOptions.name,
        InternalName: rawOptions.name,
        FileDescription: rawOptions.name,
      },
    },
    nativefier: {
      accessibilityPrompt: true,
      alwaysOnTop: rawOptions.alwaysOnTop || false,
      backgroundColor: rawOptions.backgroundColor || null,
      basicAuthPassword: rawOptions.basicAuthPassword || null,
      basicAuthUsername: rawOptions.basicAuthUsername || null,
      blockExternalUrls: rawOptions.blockExternalUrls || false,
      bookmarksMenu: rawOptions.bookmarksMenu || null,
      bounce: rawOptions.bounce || false,
      browserwindowOptions: rawOptions.browserwindowOptions,
      clearCache: rawOptions.clearCache || false,
      counter: rawOptions.counter || false,
      crashReporter: rawOptions.crashReporter,
      disableContextMenu: rawOptions.disableContextMenu,
      disableDevTools: rawOptions.disableDevTools,
      disableGpu: rawOptions.disableGpu || false,
      diskCacheSize: rawOptions.diskCacheSize || null,
      disableOldBuildWarning:
        rawOptions.disableOldBuildWarningYesiknowitisinsecure || false,
      enableEs3Apis: rawOptions.enableEs3Apis || false,
      fastQuit: rawOptions.fastQuit || false,
      fileDownloadOptions: rawOptions.fileDownloadOptions,
      flashPluginDir: rawOptions.flashPath || rawOptions.flash || null,
      fullScreen: rawOptions.fullScreen || false,
      globalShortcuts: null,
      hideWindowFrame: rawOptions.hideWindowFrame,
      ignoreCertificate: rawOptions.ignoreCertificate || false,
      ignoreGpuBlacklist: rawOptions.ignoreGpuBlacklist || false,
      inject: rawOptions.inject || [],
      insecure: rawOptions.insecure || false,
      internalUrls: rawOptions.internalUrls || null,
      lang: rawOptions.lang || undefined,
      maximize: rawOptions.maximize || false,
      nativefierVersion: packageJson.version,
      processEnvs: rawOptions.processEnvs,
      proxyRules: rawOptions.proxyRules || null,
      showMenuBar: rawOptions.showMenuBar || false,
      singleInstance: rawOptions.singleInstance || false,
      titleBarStyle: rawOptions.titleBarStyle || null,
      tray: rawOptions.tray || false,
      userAgent: rawOptions.userAgent,
      userAgentHonest: rawOptions.userAgentHonest || false,
      verbose: rawOptions.verbose,
      versionString: rawOptions.versionString,
      width: rawOptions.width || 1280,
      height: rawOptions.height || 800,
      minWidth: rawOptions.minWidth,
      minHeight: rawOptions.minHeight,
      maxWidth: rawOptions.maxWidth,
      maxHeight: rawOptions.maxHeight,
      widevine: rawOptions.widevine || false,
      x: rawOptions.x,
      y: rawOptions.y,
      zoom: rawOptions.zoom || 1.0,
    },
  };

  if (options.nativefier.verbose) {
    log.setLevel('trace');
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('debug').enable('electron-packager');
    } catch (err) {
      log.debug(
        'Failed to enable electron-packager debug output. This should not happen,',
        'and suggests their internals changed. Please report an issue.',
      );
    }

    log.debug(
      'Running in verbose mode! This will produce a mountain of logs and',
      'is recommended only for troubleshooting or if you like Shakespeare.',
    );
  } else {
    log.setLevel('info');
  }

  if (options.packager.electronVersion) {
    const requestedVersion: string = options.packager.electronVersion;
    if (!SEMVER_VERSION_NUMBER_REGEX.exec(requestedVersion)) {
      throw `Invalid Electron version number "${requestedVersion}". Aborting.`;
    }
    const requestedMajorVersion = parseInt(requestedVersion.split('.')[0], 10);
    if (requestedMajorVersion < ELECTRON_MAJOR_VERSION) {
      log.warn(
        `\nATTENTION: Using **old** Electron version ${requestedVersion} as requested.`,
        "\nIt's untested, bugs and horror will happen, you're on your own.",
        `\nSimply abort & re-run without passing the version flag to default to ${DEFAULT_ELECTRON_VERSION}`,
      );
    }
  }

  if (options.nativefier.widevine) {
    const widevineElectronVersion = `${options.packager.electronVersion}-wvvmp`;
    try {
      await axios.get(
        `https://github.com/castlabs/electron-releases/releases/tag/v${widevineElectronVersion}`,
      );
    } catch (error) {
      throw `\nERROR: castLabs Electron version "${widevineElectronVersion}" does not exist. \nVerify versions at https://github.com/castlabs/electron-releases/releases. \nAborting.`;
    }

    options.packager.electronVersion = widevineElectronVersion;
    process.env.ELECTRON_MIRROR =
      'https://github.com/castlabs/electron-releases/releases/download/';
    log.warn(
      `\nATTENTION: Using the **unofficial** Electron from castLabs`,
      "\nIt implements Google's Widevine Content Decryption Module (CDM) for DRM-enabled playback.",
      `\nSimply abort & re-run without passing the widevine flag to default to ${
        options.packager.electronVersion !== undefined
          ? options.packager.electronVersion
          : DEFAULT_ELECTRON_VERSION
      }`,
    );
  }

  if (options.nativefier.flashPluginDir) {
    options.nativefier.insecure = true;
  }

  if (options.nativefier.userAgentHonest && options.nativefier.userAgent) {
    options.nativefier.userAgent = null;
    log.warn(
      `\nATTENTION: user-agent AND user-agent-honest/honest were provided. In this case, honesty wins. user-agent will be ignored`,
    );
  }

  options.packager.platform = normalizePlatform(options.packager.platform);

  if (options.nativefier.width > options.nativefier.maxWidth) {
    options.nativefier.width = options.nativefier.maxWidth;
  }

  if (options.nativefier.height > options.nativefier.maxHeight) {
    options.nativefier.height = options.nativefier.maxHeight;
  }

  if (options.packager.portable) {
    log.info(
      'Building app as portable.',
      'SECURITY WARNING: all data accumulated in the app folder after running it',
      '(including login information, cache, cookies) will be saved',
      'in the app folder. If this app is then shared with others,',
      'THEY WILL HAVE THAT ACCUMULATED DATA, POTENTIALLY INCLUDING ACCESS',
      'TO ANY ACCOUNTS YOU LOGGED INTO.',
    );
  }

  if (rawOptions.globalShortcuts) {
    log.debug('Using global shortcuts file at', rawOptions.globalShortcuts);
    const globalShortcuts = JSON.parse(
      fs.readFileSync(rawOptions.globalShortcuts).toString(),
    );
    options.nativefier.globalShortcuts = globalShortcuts;
  }

  await asyncConfig(options);

  return options;
}

export function normalizePlatform(platform: string): string {
  if (!platform) {
    return inferPlatform();
  }
  if (platform.toLowerCase() === 'windows') {
    return 'win32';
  }

  if (['osx', 'mac', 'macos'].includes(platform.toLowerCase())) {
    return 'darwin';
  }

  return platform.toLowerCase();
}
