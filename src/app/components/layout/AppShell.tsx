// SAP Fiori ShellBar - Main Application Shell
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ShellBar,
  ShellBarItem,
  Avatar,
  Input,
  Icon,
  Popover,
  List,
  ListItemStandard,
} from '@ui5/webcomponents-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NotificationsAPI } from '../../services/odataClient';
import { Notification } from '../../types/entities';
import inetumLogoWhite from '@/assets/inetum-logo.svg';
import inetumLogoDark from '@/assets/inetum-logo-dark.svg';

import '@ui5/webcomponents-icons/dist/bell.js';
import '@ui5/webcomponents-icons/dist/search.js';
import '@ui5/webcomponents-icons/dist/action-settings.js';
import '@ui5/webcomponents-icons/dist/log.js';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpener, setNotifOpener] = useState<HTMLElement | undefined>(undefined);
  const [profileOpener, setProfileOpener] = useState<HTMLElement | undefined>(undefined);

  React.useEffect(() => {
    if (currentUser) {
      loadNotifications();
    }
  }, [currentUser]);

  const loadNotifications = async () => {
    if (!currentUser) return;
    try {
      const data = await NotificationsAPI.getByUser(currentUser.id);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = async (notification: Notification) => {
    await NotificationsAPI.markAsRead(notification.id);
    await loadNotifications();
    setNotificationsOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';
      case 'MANAGER':
        return 'Manager';
      case 'CONSULTANT_TECHNIQUE':
        return 'Technical Consultant';
      case 'CONSULTANT_FONCTIONNEL':
        return 'Functional Consultant';
      default:
        return role;
    }
  };

  return (
    <>
      <ShellBar
        logo={<img src={theme === 'dark' ? inetumLogoWhite : inetumLogoDark} alt="Inetum" style={{ height: '28px' }} />}
        primaryTitle="Performance Management"
        secondaryTitle={currentUser ? getRoleName(currentUser.role) : ''}
        profile={
          <Avatar>
            <img src={currentUser?.avatarUrl || `https://ui-avatars.com/api/?name=${currentUser?.name}`} alt={currentUser?.name} />
          </Avatar>
        }
        onProfileClick={(e) => {
          setProfileOpener(e.detail.targetRef as HTMLElement);
          setProfileOpen(true);
        }}
        searchField={
          <Input
            placeholder="Search projects, tasks, users..."
            icon={<Icon name="search" />}
            style={{ width: '300px' }}
          />
        }
      >
        <ShellBarItem
          icon="bell"
          text="Notifications"
          count={unreadCount > 0 ? unreadCount.toString() : undefined}
          onClick={(e) => {
            setNotifOpener(e.detail.targetRef as HTMLElement);
            setNotificationsOpen(true);
          }}
        />
        <ShellBarItem
          icon="action-settings"
          text="Settings"
          onClick={() => navigate('/settings')}
        />
      </ShellBar>

      {/* Notifications Popover */}
      <Popover
        open={notificationsOpen}
        opener={notifOpener}
        onClose={() => setNotificationsOpen(false)}
        headerText="Notifications"
        placement="Bottom"
      >
        <List style={{ width: '400px', maxHeight: '400px' }}>
          {notifications.length === 0 ? (
            <ListItemStandard>No notifications</ListItemStandard>
          ) : (
            notifications.map((notification) => (
              <ListItemStandard
                key={notification.id}
                description={notification.message}
                additionalText={new Date(notification.createdAt).toLocaleDateString()}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  backgroundColor: notification.read ? 'transparent' : 'var(--sapList_SelectionBackgroundColor)',
                }}
              >
                {notification.title}
              </ListItemStandard>
            ))
          )}
        </List>
      </Popover>

      {/* Profile Popover */}
      <Popover
        open={profileOpen}
        opener={profileOpener}
        onClose={() => setProfileOpen(false)}
        headerText={currentUser?.name}
        placement="Bottom"
      >
        <List style={{ width: '250px' }}>
          <ListItemStandard
            icon="employee"
            onClick={() => {
              setProfileOpen(false);
              navigate('/profile');
            }}
          >
            My Profile
          </ListItemStandard>
          <ListItemStandard
            icon="action-settings"
            onClick={() => {
              setProfileOpen(false);
              navigate('/settings');
            }}
          >
            Settings
          </ListItemStandard>
          <ListItemStandard
            icon="log"
            onClick={handleLogout}
          >
            Logout
          </ListItemStandard>
        </List>
      </Popover>

      {/* Main Content */}
      {children}
    </>
  );
};
