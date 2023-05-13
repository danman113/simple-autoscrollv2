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
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
      if (message) {
        isLooping = false
        const { scrollDuration: SD, scrollPixels: SP, loop, stop } = message as Message
        if (stop) {
          clearInterval(intCB)
        } else {
          scrollDuration = SD
          scrollPixels = SP
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
      }
    })
  }
}

main()
