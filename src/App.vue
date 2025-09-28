<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed, watch, type Ref, type ComputedRef } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const imageName: Ref<string> = ref('')
const imageLoading: Ref<boolean> = ref(true)
const imageExists: Ref<boolean> = ref(false)
const message: Ref<string> = ref('')
const timerText: Ref<string> = ref('')
const interval: Ref<number | undefined> = ref(undefined)

const notificationPermission: Ref<number> = ref(0)
const lastNotificationHour: Ref<number> = ref(-1)

const wave: ComputedRef<number> = computed(() => {
  imageLoading.value = true
  return route.hash == '#g2' ? 2 : 3
})

const notificationButtonText: ComputedRef<string> = computed(() => {
  switch (notificationPermission.value) {
    case -1:
      return 'Notifikasi Ditolak'
    case 0:
      return 'Aktifkan Notifikasi'
    case 1:
      return 'Notifikasi Aktif'
    default:
      return 'Aktifkan Notifikasi'
  }
})

watch(imageName, (newImage) => {
  imageLoading.value = true
  imageExists.value = false

  checkIfImageExists(`/img/${newImage}.jpg`, (exists) => {
    imageLoading.value = false
    imageExists.value = exists
  })
})

onMounted(() => {
  checkNotificationPermission()
  updateDisplay()
  interval.value = setInterval(updateDisplay, 1000)
})

onUnmounted(() => {
  clearInterval(interval.value)
})

// const baseNow = new Date()

// const getTestDiff = () => {
//   // const testNow: Date = new Date('2025-09-26T06:59:55')
//   // const testNow: Date = new Date('2025-09-27T06:59:55')
//   const testNow: Date = new Date('2025-09-26T15:59:55')
//   return baseNow.getTime() - testNow.getTime()
// }

const updateDisplay = () => {
  const now: Date = new Date()
  // const now = new Date(new Date().getTime() - getTestDiff())

  const hours: number = now.getHours()
  const minutes: number = now.getMinutes()
  const seconds: number = now.getSeconds()

  // Check for notification times
  checkForNotificationTime(hours, minutes, seconds)

  if (hours >= 7 && hours < 16) {
    // 7 AM to 4 PM - show IN image for current date
    imageName.value = getImageName(now, 'i')

    if (hours == 7) {
      // 7 AM to 8 AM - countdown to 8 AM
      message.value = 'Buruan Check-In!! Waktunya tinggal:'
      const target: Date = new Date(now)
      target.setHours(8, 0, 0, 0)
      timerText.value = getHumanTimeDiff(target, now)
    } else {
      // 8 AM to 4 PM - time elapsed since 8 AM
      message.value = 'Belum Check-In?? Kamu udah telat:'
      const start: Date = new Date(now)
      start.setHours(8, 0, 0, 0)
      timerText.value = getHumanTimeDiff(now, start)
    }
  } else if (hours >= 16 && hours < 18) {
    // 4 PM to 6 PM - show OUT image for current date, countdown to 6 PM
    message.value = 'Buruan Check-Out!! Waktunya tinggal:'
    imageName.value = getImageName(now, 'o')

    const target: Date = new Date(now)
    target.setHours(18, 0, 0, 0)
    timerText.value = getHumanTimeDiff(target, now)
  } else {
    // 6 PM to 7 AM next day - show OUT image
    message.value = 'Belum Check-Out?? Kamu udah telat:'
    let targetDate: Date = new Date(now)
    let start: Date = new Date(now)
    
    if (hours < 7) {
      // Early morning hours (12 AM - 6:59 AM) - use previous day
      targetDate.setDate(targetDate.getDate() - 1)
      start = new Date(targetDate)
    }

    imageName.value = getImageName(targetDate, 'o')

    start.setHours(18, 0, 0, 0)
    timerText.value = getHumanTimeDiff(now, start)
  }
}

const getImageName = (date: Date, suffix: string): string => {
  const dateStr: string = (date.getMonth() + 1).toString().padStart(2, '0') +
    date.getDate().toString().padStart(2, '0')
  
  if (wave.value != 2) return dateStr + suffix
  return 'x' + dateStr + suffix
}

const getHumanTimeDiff = (a: Date, b: Date): string => {
  const diff: number = a.getTime() - b.getTime()
  const hoursDiff: number = Math.floor(diff / 3600000)
  const minutesDiff: number = Math.floor((diff % 3600000) / 60000)
  const secondsDiff: number = Math.floor((diff % 60000) / 1000)

  let text: string = ''
  if (hoursDiff > 0) text += `${hoursDiff} jam `
  if (minutesDiff > 0) text += `${minutesDiff} menit `
  text += `${secondsDiff} detik`

  return text
}

const checkIfImageExists = (url: string, callback: (exists: boolean) => void) => {
  const img: HTMLImageElement = new Image()
  
  img.onload = () => {
    callback(true)
  }

  img.onerror = () => {
    callback(false)
  }

  img.src = url
}

const checkNotificationPermission = () => {
  if (!('Notification' in window)) {
    return false
  }

  switch (Notification.permission) {
    case 'granted':
      notificationPermission.value = 1
      return true
    case 'denied':
      notificationPermission.value = -1
      return false 
    default:
      notificationPermission.value = 0
      return false
  }
}

const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission()
    checkNotificationPermission()

    if (permission == 'granted') {
      showNotification('Notifikasi Aktif', 'Kamu akan terima notifikasi di jam 7 dan 16')
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error)
  }
}

const showNotification = (title: string, body: string) => {
  if (notificationPermission.value != 1) return

  try {
    const notification = new Notification(title, {
      body: body,
      tag: 'time-change',
      requireInteraction: true,
      silent: false,
    })

    // Handle notification click
    notification.onclick = () => {
      window.focus()
      window.open('https://latsarcode.vercel.app', '_self')
      notification.close()
    }
  } catch (error) {
    console.error('Error showing notification:', error)
  }
}

const checkForNotificationTime = (hours: number, minutes: number, seconds: number) => {
  // Only check at the exact minute (when seconds are 1-5 to account for timing)
  if (imageLoading.value || !imageExists.value) return
  if (seconds < 1 || seconds > 5) return

  // Check for 7 AM (07:00)
  if (hours == 7 && minutes == 0 && lastNotificationHour.value != 7) {
    lastNotificationHour.value = 7
    showNotification('Check-In', 'Waktunya Check-In!!')
  }

  // Check for 4 PM (16:00)
  else if (hours == 16 && minutes == 0 && lastNotificationHour.value != 16) {
    lastNotificationHour.value = 16
    showNotification('Check-Out', 'Waktunya Check-Out!!')
  }

  // Reset notification tracking at different hours
  else if (hours != 7 && hours != 16) {
    if (lastNotificationHour.value == 7 || lastNotificationHour.value == 16) {
      lastNotificationHour.value = -1
    }
  }
}
</script>

<template>
  <div class="mx-auto max-w-screen-sm min-h-screen bg-latsar p-8 text-center">

    <nav class="flex items-center justify-evenly">
      <RouterLink to="#g3"
        :class="wave != 2 ? 'text-gray-900 font-semibold border-b-2' : 'hover:text-gray-700'">
        Gelombang 3
      </RouterLink>

      <RouterLink to="#g2"
        :class="wave == 2 ? 'text-gray-900 font-semibold border-b-2' : 'hover:text-gray-700'">
        Gelombang 2
      </RouterLink>
    </nav>

    <div v-if="!imageLoading && imageExists" class="mt-8">
      <p class="text-2xl text-gray-900 font-bold uppercase">{{ message }}</p>
      <p class="text-xl text-gray-900 font-semibold">{{ timerText }}</p>

      <img :src="`/img/${imageName}.jpg`" :alt="imageName"
        class="mt-8 mx-auto w-full"></img>
    </div>

    <div v-if="!imageLoading && !imageExists" class="mt-8">
      <p class="text-4xl text-gray-900 font-bold uppercase">Libur Bos!!</p>

      <img :src="`/sleep.svg`" alt="noimage"
        class="mt-8 mx-auto w-1/2"></img>
    </div>

    <button @click="requestNotificationPermission()"
      :disabled="notificationPermission != 0"
      :class="`mt-8 rounded-md px-4 py-2 text-white font-medium
      ${notificationPermission != 0
      ? 'bg-gray-400 cursor-not-allowed'
      : 'bg-gray-900 hover:bg-gray-700 cursor-pointer'}`">
      {{ notificationButtonText }}
    </button>
  </div>
</template>
