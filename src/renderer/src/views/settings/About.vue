<script lang="ts">
import { defineComponent } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import SettingsHeader from '@renderer/components/SettingsHeader.vue'
import { ScrollArea } from '@renderer/components/ui/scroll-area'
import { Bug, Lightbulb, ExternalLink } from 'lucide-vue-next'
import packageJson from '../../../../../package.json'

export default defineComponent({
  name: 'About',
  components: {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Button,
    SettingsHeader,
    Bug,
    Lightbulb,
    ExternalLink,
    ScrollArea,
  },
  data() {
    return {
      version: packageJson.version,
      updaterStatus: 'Up to date 👍',
      removeUpdaterStatusListener: null as (() => void) | null,
    }
  },
  mounted() {
    // Get initial updater status
    this.fetchUpdaterStatus()

    // Listen for status changes
    this.removeUpdaterStatusListener = this.$electron.ipcRenderer.on(
      'updater:on-status-change',
      (_event, status: string) => {
        this.updaterStatus = status
      }
    )
  },
  beforeUnmount() {
    // Clean up listener
    if (this.removeUpdaterStatusListener) {
      this.removeUpdaterStatusListener()
    }
  },
  methods: {
    async fetchUpdaterStatus() {
      try {
        this.updaterStatus = await this.$electron.ipcRenderer.invoke('updater:status')
      } catch (error) {
        console.error('Failed to fetch updater status:', error)
        this.updaterStatus = 'Error fetching status'
      }
    },
    async checkForUpdates() {
      try {
        await this.$electron.ipcRenderer.invoke('updater:check-for-updates')
      } catch (error) {
        console.error('Failed to check for updates:', error)
      }
    },
    openExternalLink(url: string) {
      window.open(url, '_blank')
    },
    submitBugReport() {
      // You can customize this URL to point to your bug report system
      this.openExternalLink('https://github.com/aloha-desktop/aloha-desktop/issues/new?template=bug_report.md')
    },
    submitFeatureRequest() {
      // You can customize this URL to point to your feature request system
      this.openExternalLink('https://github.com/aloha-desktop/aloha-desktop/issues/new?template=feature_request.md')
    },
  },
})
</script>

<template>
  <div id="about" class="flex flex-col h-screen w-full">
    <SettingsHeader :breadcrumb-root="{ title: 'General', url: '/settings' }" breadcrumb-title="About" />
    <!-- Scrollable content area -->
    <!-- https://stackoverflow.com/a/76670135/1768467 -->
    <ScrollArea class="flex-1 min-h-0">
      <div class="flex flex-1 flex-col gap-4 p-4 relative">
        <!-- App Information -->
        <Card>
          <CardHeader>
            <CardTitle>Aloha Desktop</CardTitle>
            <CardDescription class="leading-loose">
              <p>Extendable AI assistant with tool calling capabilities</p>
              <p>
                <a
                  href="https://github.com/aloha-desktop/aloha-desktop/blob/main/LICENSE"
                  target="_blank"
                  class="text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                >
                  <ExternalLink class="h-3 w-3" /> End User License Agreement
                </a>
              </p>
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Version</span>
              <span class="text-sm text-muted-foreground">{{ version }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Update</span>
              <span class="text-sm text-muted-foreground flex items-center gap-2">
                <Button variant="link" size="xs" @click="checkForUpdates">
                  <span>Check for updates</span>
                </Button>
                <span>{{ updaterStatus }}</span>
              </span>
            </div>
          </CardContent>
        </Card>

        <!-- Support & Feedback -->
        <Card>
          <CardHeader>
            <CardTitle>Support & Feedback</CardTitle>
            <CardDescription>
              Help us improve Aloha Desktop by reporting issues or suggesting new features
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-3">
            <Button variant="outline" class="w-full justify-start" @click="submitBugReport">
              <Bug class="mr-2 h-4 w-4" />
              Submit Bug Report
            </Button>
            <Button variant="outline" class="w-full justify-start" @click="submitFeatureRequest">
              <Lightbulb class="mr-2 h-4 w-4" />
              Request Feature
            </Button>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  </div>
</template>
