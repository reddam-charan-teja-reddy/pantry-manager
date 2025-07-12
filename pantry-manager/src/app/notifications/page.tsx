'use client';

import AppLayout from '@/components/Applayout/AppLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  markNotificationRead,
  setNotifications,
} from '@/store/notificationsSlice';
import { AlertTriangle, Lightbulb, Bell, Check } from 'lucide-react';
import { formatDistanceToNow, differenceInCalendarDays } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useEffect } from 'react';
import { Notification, PantryItem } from '@/lib/types';

export default function NotificationsPage() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((state) => state.notifications);
  const { items } = useAppSelector((state) => state.pantry);

  useEffect(() => {
    const now = new Date();
    const generatedNotifications: Notification[] = [];
    items.forEach((item: PantryItem) => {
      const expiryDate = new Date(item.expiryDate);
      const diffDays = differenceInCalendarDays(expiryDate, now);
      if (diffDays === 1) {
        generatedNotifications.push({
          id: `${item.id}-expiry`,
          type: 'expiry',
          message: `Your ${item.name} is expiring tomorrow!`,
          timestamp: now.toISOString(),
          read: false,
        });
      } else if (diffDays === 2) {
        generatedNotifications.push({
          id: `${item.id}-expiry`,
          type: 'expiry',
          message: `Your ${item.name} is expiring in 2 days.`,
          timestamp: now.toISOString(),
          read: false,
        });
      }
      if (item.quantity <= 1) {
        generatedNotifications.push({
          id: `${item.id}-lowstock`,
          type: 'recommendation',
          message: `You seem to be low on ${item.name}. Add to shopping list?`,
          timestamp: now.toISOString(),
          read: false,
        });
      }
    });
    dispatch(setNotifications(generatedNotifications));
  }, [items, dispatch]);

  const handleMarkAsRead = (id: string) => {
    dispatch(markNotificationRead(id));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'expiry':
        return <AlertTriangle className='h-5 w-5 text-red-500' />;
      case 'recommendation':
        return <Lightbulb className='h-5 w-5 text-yellow-500' />;
      default:
        return <Bell className='h-5 w-5 text-primary' />;
    }
  };

  return (
    <AppLayout pageTitle='Notifications'>
      <Card>
        <CardHeader>
          <CardTitle>Your Notifications</CardTitle>
          <CardDescription>Recent alerts and recommendations.</CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length > 0 ? (
            <div className='space-y-4'>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'flex items-start gap-4 rounded-lg border p-4 transition-colors',
                    notification.read ? 'bg-muted/50' : 'bg-card'
                  )}>
                  <div className='mt-1'>{getIcon(notification.type)}</div>
                  <div className='flex-1'>
                    <p className='font-medium'>{notification.message}</p>
                    <p className='text-sm text-muted-foreground'>
                      {formatDistanceToNow(new Date(notification.timestamp), {
                        addSuffix: true,
                      })}
                    </p>
                    <div className='mt-2 flex gap-2'>
                      <Button
                        asChild
                        variant='link'
                        size='sm'
                        className='p-0 h-auto'>
                        {notification.type === 'expiry' ? (
                          <Link href='/dashboard'>View Pantry</Link>
                        ) : (
                          <Link href='/shopping-list'>View List</Link>
                        )}
                      </Button>
                      {!notification.read && (
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleMarkAsRead(notification.id)}>
                          <Check className='mr-2 h-4 w-4' /> Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-12 text-muted-foreground'>
              <Bell className='mx-auto h-12 w-12' />
              <p className='mt-4'>You have no notifications.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
