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

export const TechNotifications: React.FC = () => {
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
          { label: 'Tableau de Bord', path: '/consultant-tech/dashboard' },
          { label: 'Notifications' },
        ]}
      />

      <div className="space-y-4 p-6 lg:p-8">
        {unreadCount > 0 && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="gap-1" onClick={markAllRead}>
              <CheckCircle2 className="h-4 w-4" />
              Tout marquer comme lu
            </Button>
          </div>
        )}

        {loading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : notifications.length === 0 ? (
          <Card className="bg-card/92">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              Aucune notification.
            </CardContent>
          </Card>
        ) : (
          notifications.map((n) => (
            <Card
              key={n.id}
              className={`bg-card/92 transition ${!n.read ? 'border-primary/30' : 'opacity-75'}`}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <Bell
                  className={`mt-1 h-5 w-5 shrink-0 ${!n.read ? 'text-primary' : 'text-muted-foreground'}`}
                />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(n.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {!n.read ? (
                  <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}>
                    Marquer lu
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Lu
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
