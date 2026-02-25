import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { NotificationsAPI } from '../../services/odataClient';
import { Notification } from '../../types/entities';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

export const FuncNotifications: React.FC = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    void loadNotifications();
  }, [currentUser]);

  const loadNotifications = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await NotificationsAPI.getByUser(currentUser.id);
      setNotifications(
        [...data].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      );
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: string) => {
    try {
      await NotificationsAPI.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      toast.error('Erreur');
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    for (const n of unread) {
      try {
        await NotificationsAPI.markAsRead(n.id);
      } catch {
        // continue
      }
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success('Toutes les notifications marquées comme lues');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} non lue${unreadCount !== 1 ? 's' : ''}`}
        breadcrumbs={[
          { label: 'Tableau de Bord', path: '/consultant-func/dashboard' },
          { label: 'Notifications' },
        ]}
      />

      <div className="p-6 space-y-4">
        {unreadCount > 0 && (
          <div className="flex justify-end">
            <Button variant="secondary" size="sm" onClick={markAllRead}>
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Tout marquer comme lu
            </Button>
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : notifications.length === 0 ? (
          <Card className="bg-card/92">
            <CardContent className="py-12 text-center">
              <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-semibold">Aucune notification</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <Card
                key={n.id}
                className={`bg-card/92 transition-colors ${!n.read ? 'border-primary/40' : ''}`}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <div
                    className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                      n.read ? 'bg-transparent' : 'bg-primary'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-foreground">{n.title}</p>
                      <Badge variant="outline" className="text-[10px]">
                        {n.type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => markRead(n.id)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
