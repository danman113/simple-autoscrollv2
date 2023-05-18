import { Message } from './types'

console.log('Background Page')

chrome.commands.onCommand.addListener(async (command, page) => {
  console.log(command, page)
  if (command === 'Toggle Autoscroll' && page.id) {
    try {
      await chrome.tabs.sendMessage(page.id, { pause: true } as Message)
      console.log('Sent to tab: ', page.id)
    } catch (e) {
      console.error(e)
    }
  }
})
