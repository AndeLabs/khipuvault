/**
 * @fileoverview Global Notification Hub
 * @module components/notifications/notification-hub
 *
 * Enterprise-grade notification center for entire application:
 * - Unified notifications from all features
 * - Grouping by feature (Cooperative, Individual, Lottery)
 * - Read/Unread tracking
 * - Persistence in localStorage
 * - Advanced filtering
 * - Action buttons (navigate to relevant page)
 * - Badge with unread count
 *
 * @example
 * ```tsx
 * <NotificationHub>
 *   <NotificationBell />
 *   {/* Shows unread count badge */}
 * </NotificationHub>
 * ```
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Bell, X, Check, CheckCheck, Filter, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EventBus, AppEvent, EventType } from '@/lib/events/event-bus'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'

/**
 * Notification item (extends AppEvent with read status)
 */
export interface Notification extends AppEvent {
  read: boolean
  actionUrl?: string
}

/**
 * Props for NotificationHub
 */
export interface NotificationHubProps {
  /** Maximum notifications to store */
  maxNotifications?: number
  /** Enable persistence */
  enablePersistence?: boolean
  /** Custom className */
  className?: string
}

/**
 * NotificationHub - Global notification center
 *
 * Features:
 * ✅ Unified notifications from all features
 * ✅ Grouping by source (Cooperative, Individual, Lottery)
 * ✅ Read/Unread tracking
 * ✅ Persistence in localStorage
 * ✅ Mark as read/unread
 * ✅ Mark all as read
 * ✅ Clear all notifications
 * ✅ Filter by type
 * ✅ Navigate to relevant pages
 * ✅ Badge with unread count
 * ✅ Smooth animations
 *
 * @example
 * ```tsx
 * // In layout or header
 * <NotificationHub maxNotifications={50} enablePersistence />
 * ```
 */
export function NotificationHub({
  maxNotifications = 100,
  enablePersistence = true,
  className,
}: NotificationHubProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'cooperative' | 'individual' | 'lottery'>('all')
  const router = useRouter()

  /**
   * Load notifications from localStorage
   */
  useEffect(() => {
    if (enablePersistence && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('notifications')
        if (stored) {
          const parsed = JSON.parse(stored)
          setNotifications(parsed)
        }
      } catch (error) {
        console.warn('Failed to load notifications:', error)
      }
    }
  }, [enablePersistence])

  /**
   * Save notifications to localStorage
   */
  const saveNotifications = useCallback(
    (notifs: Notification[]) => {
      if (enablePersistence && typeof window !== 'undefined') {
        try {
          localStorage.setItem('notifications', JSON.stringify(notifs))
        } catch (error) {
          console.warn('Failed to save notifications:', error)
        }
      }
    },
    [enablePersistence]
  )

  /**
   * Subscribe to EventBus
   */
  useEffect(() => {
    const bus = EventBus.getInstance()

    // Subscribe to all event types
    const unsubscribe = bus.subscribe(
      [
        'PoolCreated',
        'MemberJoined',
        'YieldClaimed',
        'DepositMade',
        'WithdrawalMade',
        'TicketPurchased',
        'WinnerDeclared',
      ],
      (event) => {
        const notification: Notification = {
          ...event,
          read: false,
          actionUrl: getActionUrl(event),
        }

        setNotifications((prev) => {
          const updated = [notification, ...prev].slice(0, maxNotifications)
          saveNotifications(updated)
          return updated
        })
      }
    )

    return unsubscribe
  }, [maxNotifications, saveNotifications])

  /**
   * Get action URL for notification
   */
  const getActionUrl = (event: AppEvent): string | undefined => {
    switch (event.source) {
      case 'cooperative-pool':
        return '/dashboard/cooperative-savings'
      case 'individual-savings':
        return '/dashboard/individual-savings'
      case 'lottery-pool':
        return '/dashboard/lottery'
      default:
        return undefined
    }
  }

  /**
   * Mark notification as read
   */
  const markAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      saveNotifications(updated)
      return updated
    })
  }

  /**
   * Mark all as read
   */
  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }))
      saveNotifications(updated)
      return updated
    })
  }

  /**
   * Delete notification
   */
  const deleteNotification = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== id)
      saveNotifications(updated)
      return updated
    })
  }

  /**
   * Clear all notifications
   */
  const clearAll = () => {
    setNotifications([])
    saveNotifications([])
  }

  /**
   * Handle notification click
   */
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id)
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
      setIsOpen(false)
    }
  }

  /**
   * Filter notifications
   */
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true
    if (filter === 'cooperative') return n.source === 'cooperative-pool'
    if (filter === 'individual') return n.source === 'individual-savings'
    if (filter === 'lottery') return n.source === 'lottery-pool'
    return true
  })

  /**
   * Count unread notifications
   */
  const unreadCount = notifications.filter((n) => !n.read).length
  const unreadBySource = {
    cooperative: notifications.filter((n) => n.source === 'cooperative-pool' && !n.read).length,
    individual: notifications.filter((n) => n.source === 'individual-savings' && !n.read).length,
    lottery: notifications.filter((n) => n.source === 'lottery-pool' && !n.read).length,
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn('relative', className)}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs animate-in zoom-in"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-96 p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold">Notifications</h3>
            <p className="text-xs text-muted-foreground">
              {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-8 text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-8 text-xs text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Tabs for filtering */}
        <Tabs value={filter} onValueChange={(v: any) => setFilter(v)} className="w-full">
          <TabsList className="w-full grid grid-cols-4 rounded-none border-b">
            <TabsTrigger value="all" className="relative">
              All
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="cooperative" className="relative text-xs">
              Pools
              {unreadBySource.cooperative > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  {unreadBySource.cooperative}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="individual" className="relative text-xs">
              Savings
              {unreadBySource.individual > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  {unreadBySource.individual}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="lottery" className="relative text-xs">
              Lottery
              {unreadBySource.lottery > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">
                  {unreadBySource.lottery}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Notification list */}
          <TabsContent value={filter} className="m-0">
            <ScrollArea className="h-96">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No notifications</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    You're all caught up!
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                      onMarkRead={() => markAsRead(notification.id)}
                      onDelete={() => deleteNotification(notification.id)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Individual notification item
 */
interface NotificationItemProps {
  notification: Notification
  onClick: () => void
  onMarkRead: () => void
  onDelete: () => void
}

function NotificationItem({ notification, onClick, onMarkRead, onDelete }: NotificationItemProps) {
  const getIcon = (type: EventType) => {
    const icons: Record<string, string> = {
      PoolCreated: '🏊',
      MemberJoined: '👥',
      YieldClaimed: '📈',
      DepositMade: '💰',
      WithdrawalMade: '💸',
      TicketPurchased: '🎫',
      WinnerDeclared: '🎉',
    }
    return icons[type] || '📢'
  }

  const getTitle = (type: EventType) => {
    const titles: Record<string, string> = {
      PoolCreated: 'New Pool Created',
      MemberJoined: 'Member Joined',
      YieldClaimed: 'Yield Claimed',
      DepositMade: 'Deposit Made',
      WithdrawalMade: 'Withdrawal Made',
      TicketPurchased: 'Ticket Purchased',
      WinnerDeclared: 'Winner Announced',
    }
    return titles[type] || type
  }

  const timeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div
      className={cn(
        'p-4 hover:bg-accent cursor-pointer transition-colors relative group',
        !notification.read && 'bg-primary/5'
      )}
      onClick={onClick}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full" />
      )}

      <div className="flex items-start gap-3 ml-4">
        <div className="text-2xl">{getIcon(notification.type)}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{getTitle(notification.type)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {notification.source.replace('-', ' ')}
              </p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {timeAgo(notification.timestamp)}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkRead()
                }}
                className="h-6 px-2 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="h-6 px-2 text-xs text-red-500 hover:text-red-600"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Compact notification bell (just icon + badge)
 */
export function NotificationBell({ className }: { className?: string }) {
  return <NotificationHub className={className} />
}
