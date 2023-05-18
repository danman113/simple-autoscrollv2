import { Message } from './types'

console.info('Simple Autoscroll Loaded')

const element =
  window.location.origin === 'https://docs.google.com'
    ? document.querySelector('.kix-appview-editor')
    : null

const getScrollPercentage = (element: Element) => {
  const scrollTop = element.scrollTop
  const scrollHeight = element.scrollHeight
  const clientHeight = element.clientHeight
  const scrollDistance = scrollHeight - clientHeight
  const scrollPercentage = scrollTop / scrollDistance
  return scrollPercentage
}

let isLooping = false
const scrollElement = (mainElement: Element, amount: number, loop: boolean = false) => {
  const percentage = getScrollPercentage(mainElement)
  const isDone = percentage > 0.99
  const scrollTop = mainElement.scrollTop
  if (isLooping) {
    if (percentage < 0.01) isLooping = false
  } else {
    mainElement.scroll(0, scrollTop + amount)
  }
  const delta = mainElement.scrollTop - scrollTop
  if (isDone && loop) {
    // Some websites slow down scrolling, causing the looping function to potentially break as it takes too long to reach the top. To fix it
    isLooping = true
    mainElement.scroll({
      top: 0,
      behavior: 'auto',
    })
  }
  return delta
}

const main = async () => {
  if (globalThis.chrome) {
    let intCB: number = -1
    let scrollDuration: number | null = null
    let scrollPixels: number | null = null
    let scrollLoop: boolean | null = null
    const stopAutoscroll = () => {
      clearInterval(intCB)
      intCB = -1
    }
    const startAutoscroll = (scrollDuration: number, scrollPixels: number, loop: boolean) => {
      if (intCB >= 0) clearInterval(intCB)
      intCB = setInterval(() => {
        const elements = [element, document?.body, document?.body?.parentNode].filter(
          Boolean
        ) as Element[]
        for (let element of elements) {
          const delta = scrollElement(element, scrollPixels!, loop)
          if (delta) break
        }
      }, scrollDuration)
    }

    const toggleAutoscroll = (
      scrollDuration: number | null,
      scrollPixels: number | null,
      loop: boolean = false
    ) => {
      if (intCB >= 0) {
        stopAutoscroll()
      } else {
        if (scrollDuration && scrollPixels) startAutoscroll(scrollDuration, scrollPixels, loop)
      }
    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message) {
        isLooping = false
        const { scrollDuration: SD, scrollPixels: SP, loop, stop, pause } = message as Message
        scrollLoop = loop
        if (stop) {
          stopAutoscroll()
        } else if (pause) {
          toggleAutoscroll(scrollDuration, scrollPixels, scrollLoop)
        } else {
          scrollDuration = SD
          scrollPixels = SP
          startAutoscroll(SD, SP, loop)
        }
      }
    })
  }
}

main()
