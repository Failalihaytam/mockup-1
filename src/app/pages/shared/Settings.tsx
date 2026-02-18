import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { useTheme } from '../../context/ThemeContext';
import { toast } from 'sonner';
import {
  Card,
  CardHeader,
  Title,
  Switch,
  Select,
  Option,
  Button,
  Label,
  FlexBox,
  FlexBoxAlignItems,
  FlexBoxJustifyContent,
  FlexBoxDirection,
  Icon,
  MessageStrip,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/palette.js';
import '@ui5/webcomponents-icons/dist/bell.js';
import '@ui5/webcomponents-icons/dist/globe.js';
import '@ui5/webcomponents-icons/dist/save.js';

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
        {/* Appearance */}
        <Card
          header={
            <CardHeader
              titleText="Appearance"
              subtitleText="Customize the look and feel"
              avatar={<Icon name="palette" />}
            />
          }
        >
          <div className="p-4">
            <FlexBox
              alignItems={FlexBoxAlignItems.Center}
              justifyContent={FlexBoxJustifyContent.SpaceBetween}
            >
              <FlexBox direction={FlexBoxDirection.Column}>
                <Label className="font-medium">Theme</Label>
                <span className="text-xs text-muted-foreground">
                  Current: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </span>
              </FlexBox>
              <Switch
                checked={theme === 'dark'}
                onChange={toggleTheme}
                tooltip={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              />
            </FlexBox>
          </div>
        </Card>

        {/* Notifications */}
        <Card
          header={
            <CardHeader
              titleText="Notifications"
              subtitleText="Manage how you receive updates"
              avatar={<Icon name="bell" />}
            />
          }
        >
          <div className="p-4 space-y-4">
            <FlexBox
              alignItems={FlexBoxAlignItems.Center}
              justifyContent={FlexBoxJustifyContent.SpaceBetween}
            >
              <Label>Email notifications</Label>
              <Switch
                checked={settings.emailNotifications}
                onChange={() =>
                  setSettings((prev) => ({
                    ...prev,
                    emailNotifications: !prev.emailNotifications,
                  }))
                }
              />
            </FlexBox>

            <FlexBox
              alignItems={FlexBoxAlignItems.Center}
              justifyContent={FlexBoxJustifyContent.SpaceBetween}
            >
              <Label>Desktop notifications</Label>
              <Switch
                checked={settings.desktopNotifications}
                onChange={() =>
                  setSettings((prev) => ({
                    ...prev,
                    desktopNotifications: !prev.desktopNotifications,
                  }))
                }
              />
            </FlexBox>

            <FlexBox
              alignItems={FlexBoxAlignItems.Center}
              justifyContent={FlexBoxJustifyContent.SpaceBetween}
            >
              <Label>Weekly KPI digest</Label>
              <Switch
                checked={settings.weeklyDigest}
                onChange={() =>
                  setSettings((prev) => ({
                    ...prev,
                    weeklyDigest: !prev.weeklyDigest,
                  }))
                }
              />
            </FlexBox>
          </div>
        </Card>

        {/* Locale */}
        <Card
          header={
            <CardHeader
              titleText="Locale"
              subtitleText="Language and region settings"
              avatar={<Icon name="globe" />}
            />
          }
        >
          <div className="p-4">
            <FlexBox
              alignItems={FlexBoxAlignItems.Center}
              justifyContent={FlexBoxJustifyContent.SpaceBetween}
            >
              <Label>Display Language</Label>
              <Select
                onChange={(e) => {
                  const selected = e.detail.selectedOption?.dataset?.value;
                  if (selected) {
                    setSettings((prev) => ({ ...prev, locale: selected }));
                  }
                }}
              >
                <Option data-value="en-US" selected={settings.locale === 'en-US'}>
                  English (US)
                </Option>
                <Option data-value="fr-FR" selected={settings.locale === 'fr-FR'}>
                  French (FR)
                </Option>
              </Select>
            </FlexBox>
          </div>
        </Card>

        <MessageStrip hideCloseButton>
          Settings are stored locally in the browser for this demo environment.
        </MessageStrip>

        <Button design="Emphasized" icon="save" onClick={save}>
          Save Settings
        </Button>
      </div>
    </div>
  );
};
