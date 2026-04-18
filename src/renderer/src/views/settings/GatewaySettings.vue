<script lang="ts">
import { defineComponent } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { Skeleton } from '@renderer/components/ui/skeleton'
import SettingsHeader from '@renderer/components/SettingsHeader.vue'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import QRCode from 'qrcode'
import { Settings, MoreVertical } from 'lucide-vue-next'

export default defineComponent({
  name: 'GatewaySettings',
  components: {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    Button,
    Badge,
    Skeleton,
    SettingsHeader,
    ScrollArea,
    Settings,
    MoreVertical,
  },
  data() {
    return {
      supportedGateways: [] as string[],
      currentGateway: '',
      gatewayStatus: '',
      pairingCodeDataUrl: '',
      loadingGateways: false,
      loadingGatewayChange: false,
      statusUnsubscribe: null as (() => void) | null,
      pairingCodeUnsubscribe: null as (() => void) | null,
    }
  },
  async mounted() {
    await this.loadData()

    this.statusUnsubscribe = this.$electron.ipcRenderer.on('gateway:status', (_event, status) => {
      this.gatewayStatus = status
      if (status === 'connected') {
        this.pairingCodeDataUrl = ''
      } else {
        this.checkPairingCode()
      }
    })

    this.pairingCodeUnsubscribe = this.$electron.ipcRenderer.on(
      'gateway:pairing-code',
      async (_event, gatewayName, _type, code) => {
        if (this.currentGateway === gatewayName && code) {
          await this.generateQRCode(code)
        }
      }
    )
  },
  beforeUnmount() {
    if (this.statusUnsubscribe) this.statusUnsubscribe()
    if (this.pairingCodeUnsubscribe) this.pairingCodeUnsubscribe()
  },
  methods: {
    async loadData() {
      this.loadingGateways = true
      try {
        this.supportedGateways = await this.$electron.ipcRenderer.invoke('gateway:get-supported-gateways')
        this.currentGateway = await this.$electron.ipcRenderer.invoke('gateway:get-current')
        this.gatewayStatus = await this.$electron.ipcRenderer.invoke('gateway:get-status')

        if (this.currentGateway && this.gatewayStatus !== 'connected') {
          await this.checkPairingCode()
        }
      } catch (error) {
        console.error('Failed to load gateway data:', error)
      } finally {
        this.loadingGateways = false
      }
    },
    async checkPairingCode() {
      try {
        const code = await this.$electron.ipcRenderer.invoke('gateway:get-pairing-code')
        if (code) {
          await this.generateQRCode(code)
        }
      } catch (error) {
        console.error('Failed to get pairing code:', error)
      }
    },
    async generateQRCode(code: string) {
      if (!code) {
        this.pairingCodeDataUrl = ''
        return
      }
      try {
        this.pairingCodeDataUrl = await QRCode.toDataURL(code)
      } catch (error) {
        console.error('Failed to generate QR code:', error)
      }
    },
    async enableGateway(gateway: string) {
      this.loadingGatewayChange = true
      try {
        await this.$electron.ipcRenderer.invoke('gateway:register', gateway)
        this.currentGateway = gateway
        await this.$electron.ipcRenderer.invoke('gateway:initialize')
        this.gatewayStatus = await this.$electron.ipcRenderer.invoke('gateway:get-status')
        if (this.gatewayStatus !== 'connected') {
          await this.checkPairingCode()
        }
      } catch (error) {
        console.error('Failed to enable gateway:', error)
      } finally {
        this.loadingGatewayChange = false
      }
    },
    async disableGateway() {
      this.loadingGatewayChange = true
      try {
        await this.$electron.ipcRenderer.invoke('gateway:deregister')
        this.currentGateway = ''
        this.gatewayStatus = ''
        this.pairingCodeDataUrl = ''
      } catch (error) {
        console.error('Failed to disable gateway:', error)
      } finally {
        this.loadingGatewayChange = false
      }
    },
  },
})
</script>

<template>
  <div id="gateway-settings" class="flex flex-col h-screen w-full">
    <SettingsHeader :breadcrumb-root="{ title: 'Settings', url: '/settings' }" breadcrumb-title="Gateway" />

    <ScrollArea class="flex-1 min-h-0">
      <div class="flex flex-1 flex-col gap-4 p-4">
        <!-- Supported Gateways Section -->
        <Card>
          <CardHeader>
            <CardTitle>Supported Gateways</CardTitle>
            <CardDescription>Select a gateway to connect to external messaging services.</CardDescription>
          </CardHeader>
          <CardContent>
            <div v-if="loadingGateways" class="space-y-2">
              <Skeleton class="h-10 w-full" />
              <Skeleton class="h-10 w-full" />
            </div>
            <div v-else-if="supportedGateways.length > 0" class="space-y-4">
              <div
                v-for="gateway in supportedGateways"
                :key="gateway"
                class="flex items-center justify-start p-3 gap-x-3 border rounded-md"
              >
                <div class="flex items-center gap-2">
                  <span class="font-medium capitalize">{{ gateway }}</span>
                  <Badge v-if="currentGateway === gateway" variant="default">Selected</Badge>
                </div>
                <Button
                  v-if="currentGateway !== gateway"
                  :disabled="loadingGatewayChange"
                  variant="default"
                  size="sm"
                  @click="enableGateway(gateway)"
                >
                  Enable
                </Button>
              </div>
            </div>
            <div v-else class="text-sm text-muted-foreground">No gateways found.</div>
          </CardContent>
        </Card>

        <!-- Current Gateway Status Section -->
        <Card v-if="currentGateway">
          <CardHeader class="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle
              >Gateway Status:
              <Badge variant="secondary" class="capitalize">
                {{ gatewayStatus || 'Unknown' }}
              </Badge></CardTitle
            >
            <Button variant="destructive" size="sm" :disabled="loadingGatewayChange" @click="disableGateway">
              Log out
            </Button>
          </CardHeader>
          <CardContent
            v-if="gatewayStatus !== 'connected' && pairingCodeDataUrl"
            class="flex flex-col md:flex-row gap-8 items-start mt-4"
          >
            <div v-if="currentGateway === 'whatsapp'" class="flex-1 space-y-4 text-base text-foreground mt-2">
              <ol class="list-decimal list-outside ml-4 space-y-4">
                <li class="pl-2">
                  <span class="inline-flex items-center flex-wrap gap-1"
                    >Open
                    <svg viewBox="0 0 24 24" class="inline w-5 h-5 mx-0.5" fill="none">
                      <rect width="24" height="24" rx="6" fill="#25D366" />
                      <path
                        d="M 16.6 13.1 c -0.2 -0.1 -1.2 -0.6 -1.4 -0.7 c -0.2 -0.1 -0.3 -0.1 -0.5 0.1 c -0.1 0.2 -0.5 0.7 -0.6 0.8 c -0.1 0.1 -0.3 0.2 -0.5 0.1 c -0.2 -0.1 -0.9 -0.3 -1.7 -1 c -0.6 -0.5 -1 -1.2 -1.1 -1.4 c -0.1 -0.2 0 -0.3 0.1 -0.4 c 0.1 -0.1 0.2 -0.2 0.3 -0.3 c 0.1 -0.1 0.1 -0.2 0.2 -0.3 c 0.1 -0.1 0 -0.3 -0.1 -0.4 c -0.1 -0.1 -0.5 -1.1 -0.6 -1.5 c -0.1 -0.4 -0.3 -0.4 -0.5 -0.4 h -0.4 c -0.2 0 -0.4 0.1 -0.6 0.3 c -0.2 0.2 -0.8 0.7 -0.8 1.7 s 0.8 2 1 2.2 c 0.1 0.2 1.5 2.2 3.6 3.1 c 0.5 0.2 0.9 0.3 1.2 0.4 c 0.5 0.2 1 0.1 1.4 0.1 c 0.4 0 1.2 -0.5 1.4 -1 c 0.2 -0.5 0.2 -0.9 0.1 -1 c -0.1 -0.2 -0.3 -0.2 -0.5 -0.3 z m -4.1 5.3 h 0 a 6.8 6.8 0 0 1 -3.5 -1 l -0.2 -0.2 l -2.6 0.7 l 0.7 -2.5 l -0.2 -0.3 a 6.8 6.8 0 0 1 -1 -3.6 c 0 -3.8 3.1 -6.8 6.8 -6.8 c 1.8 0 3.5 0.7 4.8 2 c 1.3 1.3 2 3 2 4.8 c -0.1 3.7 -3.2 6.8 -6.9 6.8 z m 5.8 -12.7 A 8.2 8.2 0 0 0 12.5 3.3 C 8 3.3 4.3 7 4.3 11.5 c 0 1.4 0.4 2.8 1.1 4 L 4.2 20 l 4.6 -1.2 a 8.2 8.2 0 0 0 3.7 0.9 h 0 c 4.5 0 8.2 -3.7 8.2 -8.2 a 8.2 8.2 0 0 0 -2.4 -5.9 z"
                        fill="white"
                      />
                    </svg>
                    <span class="font-bold">WhatsApp</span> on your phone
                  </span>
                </li>
                <li class="pl-2">
                  <span class="inline-flex items-center flex-wrap gap-1">
                    Tap <span class="font-bold">Settings</span>
                    <Settings class="inline w-5 h-5 text-muted-foreground mx-0.5" /> on iPhone, or
                    <span class="font-bold">Menu</span>
                    <MoreVertical class="inline w-5 h-5 text-muted-foreground mx-0.5" /> on Android
                  </span>
                </li>
                <li class="pl-2">
                  Tap <span class="font-bold">Linked devices</span> and then
                  <span class="font-bold">Link a device</span>
                </li>
                <li class="pl-2">Point your phone at this screen to scan the QR code</li>
                <li class="pl-2">
                  Keep both apps open and connected to the internet (Wi-Fi, 4G or faster) until the connection is
                  established.
                </li>
              </ol>
            </div>

            <div
              class="flex flex-col items-center gap-2 p-4 border rounded-md bg-white w-max"
              :class="currentGateway !== 'whatsapp' ? 'mx-auto' : ''"
            >
              <span class="text-sm font-medium text-black text-center">Scan QR Code to Link</span>
              <img :src="pairingCodeDataUrl" alt="Pairing QR Code" class="w-64 h-64" />
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  </div>
</template>
