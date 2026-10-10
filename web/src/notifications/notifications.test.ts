import { describe, expect, it } from 'vitest'
import { cancelAllReminders, cancelReminder, getNotificationStatus, scheduleReminder } from './notifications'

describe('notifications', () => {
  it('reports the web fallback as unsupported without throwing', async () => {
    await expect(getNotificationStatus()).resolves.toEqual({
      supported: false,
      push: 'unsupported',
      local: 'unsupported',
    })
  })

  it('keeps reminder operations safe on the web fallback', async () => {
    await expect(scheduleReminder({ id: 1, title: 'Test', body: 'Test', at: new Date() })).resolves.toBeUndefined()
    await expect(cancelReminder(1)).resolves.toBeUndefined()
    await expect(cancelAllReminders()).resolves.toBeUndefined()
  })
})
