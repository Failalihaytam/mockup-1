import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';

interface LocalSettings {
  emailNotifications: boolean;
  desktopNotifications: boolean;
  weeklyDigest: boolean;
  locale: string;
}

const STORAGE_KEY = 'mockAppSettings';

const DEFAULT_SETTINGS: LocalSettings = {
  emailNotifications: true,
  desktopNotifications: true,
  weeklyDigest: true,
  locale: 'en-US',
};

export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<LocalSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as LocalSettings;
      setSettings(parsed);
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    toast.success('Settings saved');
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Settings"
        subtitle="Application preferences for this mock environment"
        breadcrumbs={[{ label: 'Settings' }]}
      />

      <div className="p-6 max-w-3xl space-y-6">
        <section className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Appearance</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Theme</p>
              <p className="text-xs text-muted-foreground">
                Current: {theme === 'dark' ? 'Dark' : 'Light'}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 border border-border rounded hover:bg-accent text-foreground"
            >
              Toggle Theme
            </button>
          </div>
        </section>

        <section className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
          <label className="flex items-center justify-between text-sm">
            <span className="text-foreground">Email notifications</span>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, emailNotifications: e.target.checked }))
              }
            />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span className="text-foreground">Desktop notifications</span>
            <input
              type="checkbox"
              checked={settings.desktopNotifications}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, desktopNotifications: e.target.checked }))
              }
            />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span className="text-foreground">Weekly KPI digest</span>
            <input
              type="checkbox"
              checked={settings.weeklyDigest}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, weeklyDigest: e.target.checked }))
              }
            />
          </label>
        </section>

        <section className="bg-card border border-border rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Locale</h3>
          <select
            value={settings.locale}
            onChange={(e) => setSettings((prev) => ({ ...prev, locale: e.target.value }))}
            className="px-3 py-2 border border-border rounded bg-card text-foreground"
          >
            <option value="en-US">English (US)</option>
            <option value="fr-FR">French (FR)</option>
          </select>
        </section>

        <button
          onClick={save}
          className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};
