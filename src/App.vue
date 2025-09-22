<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch, type Ref } from 'vue'

const imageName: Ref<string> = ref('')
const imageLoading: Ref<boolean> = ref(true)
const imageExists: Ref<boolean> = ref(false)
const message: Ref<string> = ref('')
const timerText: Ref<string> = ref('')
const interval: Ref<number | undefined> = ref(undefined)

watch(imageName, (newImage) => {
  imageLoading.value = true
  imageExists.value = false

  checkIfImageExists(`/img/${newImage}.jpg`, (exists) => {
    imageLoading.value = false
    imageExists.value = exists
  })
})

onMounted(() => {
  updateDisplay()
  interval.value = setInterval(updateDisplay, 1000)
})

onUnmounted(() => {
  clearInterval(interval.value)
})

const updateDisplay = () => {
  const now: Date = new Date()
  const hours: number = now.getHours()

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
  
  return dateStr + suffix
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
</script>

<template>
  <div class="mx-auto max-w-screen-sm min-h-screen bg-latsar p-8 text-center">

    <div v-if="!imageLoading && imageExists">
      <p class="text-2xl font-bold uppercase">{{ message }}</p>
      <p class="text-xl font-semibold">{{ timerText }}</p>

      <img :src="`/img/${imageName}.jpg`" :alt="imageName"
        class="mt-8 mx-auto w-full"></img>
    </div>

    <div v-if="!imageLoading && !imageExists">
      <p class="text-4xl font-bold uppercase">Libur Bos!!</p>

      <img :src="`/sleep.svg`" alt="noimage"
        class="mt-8 mx-auto w-1/2"></img>
    </div>
  </div>
</template>
