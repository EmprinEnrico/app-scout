import { Capacitor, type PermissionState } from '@capacitor/core'
import { LocalNotifications, type LocalNotificationSchema } from '@capacitor/local-notifications'
import { PushNotifications, type PushNotificationSchema } from '@capacitor/push-notifications'

export type NotificationPermission = PermissionState | 'unsupported'

export type NotificationStatus = {
  supported: boolean
  push: NotificationPermission
  local: NotificationPermission
}

export type Reminder = {
  id: number
  title: string
  body: string
  at: Date
  data?: Record<string, string>
}

export type NotificationHandlers = {
  onToken?: (token: string) => void
  onPush?: (notification: PushNotificationSchema) => void
  onOpen?: (notification: PushNotificationSchema) => void
  onError?: (error: unknown) => void
}

const unsupported: NotificationStatus = { supported: false, push: 'unsupported', local: 'unsupported' }

function native(): boolean {
  return Capacitor.isNativePlatform()
}

function permission(value: PermissionState | undefined): NotificationPermission {
  return value ?? 'prompt'
}

/**
 * Native notification entry point. Remote push still needs a server to store
 * tokens and send APNs/FCM messages; local reminders can be scheduled now.
 */
export async function getNotificationStatus(): Promise<NotificationStatus> {
  if (!native()) return unsupported
  const [push, local] = await Promise.all([
    PushNotifications.checkPermissions(),
    LocalNotifications.checkPermissions(),
  ])
  return { supported: true, push: permission(push.receive), local: permission(local.display) }
}

export async function requestNotificationPermissions(): Promise<NotificationStatus> {
  if (!native()) return unsupported
  const local = await LocalNotifications.requestPermissions()
  const push = await PushNotifications.requestPermissions()
  return { supported: true, push: permission(push.receive), local: permission(local.display) }
}

async function ensureReminderChannel(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return
  await LocalNotifications.createChannel({
    id: 'reminders',
    name: 'Promemoria',
    description: 'Promemoria per i tuoi obiettivi',
    importance: 4,
  })
}

/** Registers the device token and wires native push events for future sync. */
export async function registerForPushNotifications(handlers: NotificationHandlers = {}): Promise<NotificationStatus> {
  const status = await requestNotificationPermissions()
  if (!status.supported || status.push !== 'granted') return status
  const registration = await PushNotifications.addListener('registration', ({ value }) => handlers.onToken?.(value))
  const registrationError = await PushNotifications.addListener('registrationError', (error) => handlers.onError?.(error))
  const received = await PushNotifications.addListener('pushNotificationReceived', (notification) => handlers.onPush?.(notification))
  const opened = await PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => handlers.onOpen?.(notification))
  try {
    await PushNotifications.register()
  } catch (error) {
    handlers.onError?.(error)
    await Promise.all([registration.remove(), registrationError.remove(), received.remove(), opened.remove()])
  }
  return status
}

export async function removeNotificationListeners(): Promise<void> {
  if (native()) await PushNotifications.removeAllListeners()
}

export async function scheduleReminder(reminder: Reminder): Promise<void> {
  if (!native()) return
  const status = await LocalNotifications.requestPermissions()
  if (status.display !== 'granted') throw new Error('Le notifiche locali non sono autorizzate.')
  await ensureReminderChannel()
  const notification: LocalNotificationSchema = {
    id: reminder.id,
    title: reminder.title,
    body: reminder.body,
    schedule: { at: reminder.at },
    extra: reminder.data,
    channelId: 'reminders',
  }
  await LocalNotifications.schedule({ notifications: [notification] })
}

export async function cancelReminder(id: number): Promise<void> {
  if (native()) await LocalNotifications.cancel({ notifications: [{ id }] })
}

export async function cancelAllReminders(): Promise<void> {
  if (!native()) return
  const pending = await LocalNotifications.getPending()
  if (pending.notifications.length) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map(({ id }) => ({ id })) })
  }
}
