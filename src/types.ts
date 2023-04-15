export type Settings = {
  scrollDuration: number
  scrollPixels: number
  loop: boolean
}

export type Message = {
  ping?: boolean
} & Settings
