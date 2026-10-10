// Capacitor configuration shared by the iOS and Android shells.
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.faro.mobile',
  appName: 'Scout Journey',
  webDir: '../dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'banner', 'list'],
    },
  },
}

export default config
