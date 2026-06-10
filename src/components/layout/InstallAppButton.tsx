import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Share, Plus, SquarePlus, MonitorDown } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { usePwaInstall } from '@/hooks/usePwaInstall';

type Step = { icon: typeof Share; text: string };

/**
 * Sidebar "Install app" entry. Always visible until the app is installed.
 * On Chromium (Windows / Mac / Android) a click fires the native install
 * prompt. When the prompt isn't available (iOS, macOS Safari, or a Chromium
 * browser that is withholding the auto-prompt) it opens a dialog with the
 * platform-specific manual steps instead.
 */
export function InstallAppButton() {
  const { t } = useTranslation();
  const { canInstall, install, installed, platform } = usePwaInstall();
  const [helpOpen, setHelpOpen] = useState(false);

  if (installed) return null;

  function handleClick() {
    if (canInstall) {
      void install();
    } else {
      setHelpOpen(true);
    }
  }

  const steps: Step[] =
    platform === 'ios'
      ? [
          { icon: Share, text: t('install.iosStep1') },
          { icon: Plus, text: t('install.iosStep2') },
        ]
      : platform === 'mac-safari'
        ? [
            { icon: Share, text: t('install.macSafariStep1') },
            { icon: SquarePlus, text: t('install.macSafariStep2') },
          ]
        : [
            { icon: MonitorDown, text: t('install.desktopStep1') },
            { icon: Download, text: t('install.desktopStep2') },
          ];

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
      >
        <Download className="size-5" />
        {t('nav.installApp')}
      </button>

      <Modal open={helpOpen} onClose={() => setHelpOpen(false)} title={t('install.title')} size="sm">
        <ol className="space-y-3 text-sm text-gray-700">
          {steps.map(({ icon: Icon, text }, i) => (
            <li key={i} className="flex items-center gap-3">
              <Icon className="size-5 shrink-0 text-brand-600" />
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </Modal>
    </>
  );
}
