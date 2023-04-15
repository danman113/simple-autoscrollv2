import { Message } from './types'

const element =
  window.location.origin === 'https://docs.google.com'
    ? document.querySelector('.kix-appview-editor')
    : null

const main = async () => {
  if (globalThis.chrome) {
    let intCB: number = -1
    let scrollDuration: number | null = null
    let scrollPixels: number | null = null
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
      if (message) {
        const { scrollDuration: SD, scrollPixels: SP, loop, ping } = message as Message
        if (ping) {
          sendResponse({
            scrollDuration,
            scrollPixels,
          } as Message)
        } else {
          scrollDuration = SD
          scrollPixels = SP
          if (intCB >= 0) clearInterval(intCB)
          intCB = setInterval(() => {
            const mainElement =
              element || (document.body.parentNode as HTMLElement) || document.body
            const isDone = mainElement.clientHeight + mainElement.scrollTop >= mainElement.scrollHeight
            const scrollTop = mainElement.scrollTop
            // console.log(scrollTop, ' + ', speed, ' = ', scrollTop + speed)
            mainElement.scroll(0, scrollTop + scrollPixels!)
            if (isDone && loop) {
              mainElement.scroll({
                top: 0,
              })
            }
          }, scrollDuration)
        }
      }
    })
  }
}

main()
