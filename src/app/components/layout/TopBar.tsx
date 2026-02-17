// SAP Fiori-style top bar with search, notifications, and user menu

import React, { useState, useEffect } from 'react';
import {
  ShellBar,
  ShellBarItem,
  Avatar,
  Input,
  Icon,
  List,
  ListItemStandard,
  Popover,
  ResponsivePopover,
} from '@ui5/webcomponents-react';
import { getDefaultRouteForRole, useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NotificationsAPI, UsersAPI } from '../../services/odataClient';
import { Notification, User as UserEntity } from '../../types/entities';
import { useNavigate } from 'react-router';
import inetumLogo from '@/assets/inetum-logo.svg';
import '@ui5/webcomponents-icons/dist/search.js';
import '@ui5/webcomponents-icons/dist/bell.js';
import '@ui5/webcomponents-icons/dist/palette.js';
import '@ui5/webcomponents-icons/dist/log.js';
import '@ui5/webcomponents-icons/dist/switch-classes.js';
import '@ui5/webcomponents-icons/dist/employee.js';
import '@ui5/webcomponents-icons/dist/action-settings.js';

interface TopBarProps {
  onMenuToggle: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onMenuToggle }) => {
  const { currentUser, logout, switchUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [allUsers, setAllUsers] = useState<UserEntity[]>([]);
  const navigate = useNavigate();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
      loadUsers();
    }
  }, [currentUser]);

  const loadNotifications = async () => {
    if (currentUser) {
      const data = await NotificationsAPI.getByUser(currentUser.id);
      setNotifications(data);
    }
  };

  const loadUsers = async () => {
    const users = await UsersAPI.getAll();
    setAllUsers(users);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await NotificationsAPI.markAsRead(notificationId);
    loadNotifications();
  };

  const handleSwitchUser = async (userId: string) => {
    const selectedUser = allUsers.find((user) => user.id === userId);
    await switchUser(userId);
    setSwitcherOpen(false);
    if (selectedUser) {
      navigate(getDefaultRouteForRole(selectedUser.role), { replace: true });
      return;
    }
    navigate('/dashboard', { replace: true });
  };

  return (
    <>
      <ShellBar
        primaryTitle="Performance Portal"
        logo={<img src={inetumLogo} alt="Inetum Logo" />}
        profile={
          <Avatar>
            <img
              src={`https://ui-avatars.com/api/?name=${currentUser?.name}&background=random`}
              alt="Profile"
            />
          </Avatar>
        }
        onProfileClick={(e) => setUserMenuOpen(true)}
        notificationsCount={unreadCount > 0 ? unreadCount.toString() : undefined}
        showNotifications={unreadCount > 0}
        onNotificationsClick={(e) => setPopoverOpen(true)}
        startButton={
          <Icon
            name="menu2"
            onClick={onMenuToggle}
            className="ui5-shellbar-menu-button-left"
          />
        }
      >
        <Input slot="searchField" icon={<Icon name="search" />} placeholder="Search..." />
        <ShellBarItem
          icon="palette"
          text="Theme"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        />
        <ShellBarItem
          icon="switch-classes"
          text="Switch User"
          onClick={(e) => setSwitcherOpen(true)}
          title="Switch User (Demo)"
        />
      </ShellBar>

      {/* Notifications Popover */}
      <ResponsivePopover
        open={popoverOpen}
        onClose={() => setPopoverOpen(false)}
        placement="Bottom"
        headerText="Notifications"
      >
        <List>
          {notifications.length === 0 ? (
            <ListItemStandard>No notifications</ListItemStandard>
          ) : (
            notifications.map((notification) => (
              <ListItemStandard
                key={notification.id}
                description={notification.message}
                additionalText={new Date(notification.createdAt).toLocaleDateString()}
                additionalTextState="None"
                onClick={() => handleMarkAsRead(notification.id)}
                icon={notification.read ? 'accept' : 'bell'}
              >
                {notification.title}
              </ListItemStandard>
            ))
          )}
        </List>
      </ResponsivePopover>

      {/* User Menu Popover */}
      <Popover
        open={userMenuOpen}
        onClose={() => setUserMenuOpen(false)}
        placement="Bottom"
        headerText="User Profile"
      >
        <div className="p-4">
          <div className="font-bold">{currentUser?.name}</div>
          <div className="text-sm text-gray-500">{currentUser?.email}</div>
          <div className="text-xs text-gray-400 mt-1">{currentUser?.role}</div>
        </div>
        <List>
          <ListItemStandard
            icon="employee"
            onClick={() => {
              setUserMenuOpen(false);
              navigate('/profile');
            }}
          >
            My Profile
          </ListItemStandard>
          <ListItemStandard
            icon="action-settings"
            onClick={() => {
              setUserMenuOpen(false);
              navigate('/settings');
            }}
          >
            Settings
          </ListItemStandard>
          <ListItemStandard icon="log" onClick={handleLogout}>
            Logout
          </ListItemStandard>
        </List>
      </Popover>

      {/* User Switcher Popover */}
      <Popover
        open={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        placement="Bottom"
        headerText="Switch User"
      >
        <List>
          {allUsers.map((user) => (
            <ListItemStandard
              key={user.id}
              description={user.role}
              onClick={() => handleSwitchUser(user.id)}
              selected={currentUser?.id === user.id}
            >
              {user.name}
            </ListItemStandard>
          ))}
        </List>
      </Popover>
    </>
  );
};
