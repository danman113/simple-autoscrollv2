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

const isElementScrollable = (element: HTMLElement) =>
  element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth

const getSelectorFromElement = (element: HTMLElement | null): string[] => {
  if (!element) return []
  if (element.tagName === 'body') return ['body']
  if (element.id) {
    return ['#' + element.id]
  }
  if (element.className) {
    return [
      ...getSelectorFromElement(element.parentElement),
      element.className
        .split(/\s+/)
        .filter(s => !s.includes(':')) // Classes can contain ":", which is not a valid query selector
        .map(s => '.' + s)
        .join(''),
    ]
  }

  // TODO: This isn't quite right
  let nChildren = 1
  let sibling = element.previousSibling
  while (sibling) {
    nChildren++
    sibling = sibling.previousSibling
  }
  // If there is no classname, we get nth element
  return [
    ...getSelectorFromElement(element.parentElement),
    `:nth-child(${nChildren})`,
  ]
}

const overlayClass = 'highlight-overlay-' + Date.now()

// Add the overlay using a pseudo-element
const style = document.createElement('style')
style.textContent = `
  .${overlayClass} {
    outline: #2980b9 solid 2px !important;
    transition: background, outline 1s !important;
    background-color: #3498db !important;
  }
`

document.head.appendChild(style)

let customSelector: string | null = null
let customElement: EventTarget | null = null
let setup = false
const startCapture = () => {
  if (!setup) {
    document.addEventListener('mouseover', (e) => {
      e.preventDefault()
      if (customElement) {
        ;(customElement as HTMLElement).classList.remove(overlayClass)
      }
      customElement = e.target
      if (customElement) {
        let selector = getSelectorFromElement(e.target as HTMLElement).join(' > ')
        let selectorTheSame = e.target == document.querySelector(selector)
        console.log(selectorTheSame, selector)
        ;(customElement as HTMLElement).classList.add(overlayClass)
      }
    })
  }
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
        const {
          scrollDuration: SD,
          scrollPixels: SP,
          loop,
          stop,
          pause,
          capture,
        } = message as Message
        console.log('Got message', message)
        scrollLoop = loop
        if (stop) {
          stopAutoscroll()
        } else if (pause) {
          toggleAutoscroll(scrollDuration, scrollPixels, scrollLoop)
        } else if (capture) {
          startCapture()
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
