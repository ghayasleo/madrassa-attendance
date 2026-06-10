import { useCallback, useEffect, useState } from 'react';

type InstallOutcome = 'accepted' | 'dismissed';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: InstallOutcome;
  }>;
};

declare global {
  interface Window {
    __deferredInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

/**
 * Platforms for the manual-install instructions:
 *  - `ios`        → iPhone/iPad (any browser is WebKit): Share → Add to Home Screen
 *  - `mac-safari` → macOS Safari: Share → Add to Dock
 *  - `other`      → desktop Chromium (Windows/Mac/Linux) & Android Chrome.
 *                   These normally get the native prompt; the manual fallback
 *                   for these is the address-bar install icon.
 */
export type InstallPlatform = 'ios' | 'mac-safari' | 'other';

function isStandalone() {
  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    navigatorWithStandalone.standalone === true
  );
}

function detectPlatform(): InstallPlatform {
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  const isIosDevice = /iphone|ipad|ipod/i.test(ua);
  // iPadOS 13+ reports as "Macintosh" but has a touch screen.
  const isIpadOs = /macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  if (isIosDevice || isIpadOs) return 'ios';

  const isSafari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua);
  if (isSafari && /macintosh/i.test(ua)) return 'mac-safari';

  return 'other';
}

export function usePwaInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(
    // The inline script in index.html may have already captured the event
    // before React mounted.
    () => (typeof window !== 'undefined' ? window.__deferredInstallPrompt ?? null : null),
  );
  const [installed, setInstalled] = useState(() => isStandalone());
  const [platform] = useState<InstallPlatform>(() => detectPlatform());

  useEffect(() => {
    // Picks up the event whether it was captured early (custom event) or fires
    // now (direct listener).
    const syncFromGlobal = () => setInstallPrompt(window.__deferredInstallPrompt ?? null);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      window.__deferredInstallPrompt = event as BeforeInstallPromptEvent;
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstalled(true);
      window.__deferredInstallPrompt = null;
      setInstallPrompt(null);
    };

    window.addEventListener('pwa-install-available', syncFromGlobal);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('pwa-install-available', syncFromGlobal);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    const prompt = installPrompt ?? window.__deferredInstallPrompt ?? null;
    if (!prompt) return;

    await prompt.prompt();
    const choice = await prompt.userChoice;

    if (choice.outcome === 'accepted') {
      setInstalled(true);
    }

    window.__deferredInstallPrompt = null;
    setInstallPrompt(null);
  }, [installPrompt]);

  return {
    /** True when the browser's native install prompt is available (Chromium). */
    canInstall: Boolean(installPrompt) && !installed,
    install,
    installed,
    platform,
  };
}
