<script lang="ts">
import { defineComponent } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Badge } from '@renderer/components/ui/badge'
import { Skeleton } from '@renderer/components/ui/skeleton'
import SettingsHeader from '@renderer/components/SettingsHeader.vue'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import QRCode from 'qrcode'

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
      if (status === 'open') {
        this.pairingCodeDataUrl = ''
      } else {
        this.checkPairingCode()
      }
    })

    this.pairingCodeUnsubscribe = this.$electron.ipcRenderer.on(
      'gateway:pairing-code',
      async (_event, gatewayName, type, code) => {
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
        this.currentGateway = await this.$electron.ipcRenderer.invoke('gateway:get-gateway')
        this.gatewayStatus = (await this.$electron.ipcRenderer.invoke('gateway:get-status')) || ''

        if (this.currentGateway && this.gatewayStatus !== 'open') {
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
        await this.$electron.ipcRenderer.invoke('gateway:set-gateway', gateway)
        this.currentGateway = gateway
        await this.$electron.ipcRenderer.invoke('gateway:initialize')
        this.gatewayStatus = (await this.$electron.ipcRenderer.invoke('gateway:get-status')) || ''
        if (this.gatewayStatus !== 'open') {
          await this.checkPairingCode()
        }
      } catch (error) {
        console.error('Failed to enable gateway:', error)
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
                class="flex items-center justify-between p-3 border rounded-md"
              >
                <div class="flex items-center gap-2">
                  <span class="font-medium capitalize">{{ gateway }}</span>
                  <Badge v-if="currentGateway === gateway" variant="default">Selected</Badge>
                </div>
                <Button
                  v-if="currentGateway !== gateway"
                  :disabled="loadingGatewayChange"
                  variant="outline"
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
          <CardHeader>
            <CardTitle
              >Gateway Status: <span class="capitalize">{{ currentGateway }}</span></CardTitle
            >
          </CardHeader>
          <CardContent class="flex flex-col gap-4">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium">Status:</span>
              <Badge :variant="gatewayStatus === 'open' ? 'default' : 'secondary'" class="capitalize">
                {{ gatewayStatus || 'Unknown' }}
              </Badge>
            </div>

            <div
              v-if="gatewayStatus !== 'open' && pairingCodeDataUrl"
              class="flex flex-col items-center gap-2 mx-auto mt-4 p-4 border rounded-md bg-white w-max"
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
