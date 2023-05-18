import './popup.css'
import React, { ReactNode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Settings, Message } from './types'

const container = document.getElementById('app')
const root = createRoot(container!)

const ErrorMessages = {
  CANNOT_CONNECT_TO_ACTIVE_TAB:
    'Unable to connect to the active tab. If this is a non-chrome tab, refreshing the tab might resolve the issue.',
  CANNOT_QUERY_CURRENT_TAB:
    'Unable to query the active tab. Please ensure that the window is active and try again',
} as const

const TransientMessage = ({
  children,
  duration,
  value,
  delay = 0,
  done,
  ...rest
}: {
  children: ReactNode
  duration: number
  delay?: number
  done?: () => void
  value: any
  [key: string]: unknown
}) => {
  const [opacity, setOpacity] = useState(1)
  const [visible, setVisibility] = useState(true)
  useEffect(() => {
    setOpacity(1)
    setVisibility(true)
    setTimeout(() => {
      setOpacity(0)
      setTimeout(() => {
        setVisibility(false)
        if (done) done()
      }, duration)
    }, delay)
  }, [value])
  return visible ? (
    <span style={{ opacity }} {...rest}>
      {children}
    </span>
  ) : null
}

const Form = ({
  ScrollSpeed,
  setScrollSpeed,
  onSubmit,
  scrollPixels,
  setScrollPixels,
  submitClass,
  displaySaved,
  loop,
  setLoop,
  savedOpacity = 1,
  saveAsDefault,
  submitContent = 'Go',
}: {
  ScrollSpeed: number
  setScrollSpeed: (speed: number) => void
  scrollPixels: number
  setScrollPixels: (pixels: number) => void
  saveAsDefault: () => Promise<void>
  onSubmit?: () => void
  savedOpacity: number
  displaySaved: boolean
  loop: boolean
  setLoop: (loop: boolean) => void
  submitContent?: React.ReactNode
  submitClass?: string
}) => (
  <form
    onSubmit={(e) => {
      e.preventDefault()
      if (onSubmit) onSubmit()
    }}
  >
    <div className='grid'>
      <button id='default' type='button' onClick={saveAsDefault}>
        Save as default
      </button>
      {displaySaved ? (
        <div
          className='save-section'
          id='saved'
          style={{
            opacity: savedOpacity,
          }}
        >{`Saved ✓`}</div>
      ) : null}
      Scroll
      <br />
      <input
        id='scroll'
        type='number'
        min='-5000'
        max='5000'
        value={String(scrollPixels)}
        onChange={(e) => setScrollPixels(Number(e.target.value))}
      />{' '}
      pixels every <br />
      <input
        id='seconds'
        type='number'
        min='1'
        max='600000'
        value={String(ScrollSpeed)}
        onChange={(e) => setScrollSpeed(Number(e.target.value))}
      />{' '}
      miliseconds
      <br />
      <input
        type='checkbox'
        name='loop'
        id='loop'
        checked={loop}
        onChange={(e) => setLoop(e.target.checked)}
      />
      <label htmlFor='loop'>loop?</label>
    </div>
    {onSubmit && (
      <button type='submit' className={submitClass || ''}>
        {submitContent}
      </button>
    )}
  </form>
)

const defaultScrollRate = 25
const defaultScrollPixels = 5
const defaultLoopState = false
const settingsKey = 'defaultSettings'

const FormHandler = () => {
  const [error, setError] = useState('')
  const [scrollDuration, setScrollDuration] = useState(defaultScrollRate)
  const [scrollPixels, setScrollPixels] = useState(defaultScrollPixels)
  const [loop, setLoop] = useState(defaultLoopState)
  const [savedOpacity, setSavedOpacity] = useState(0)
  const [displaySaved, setDisplaySaved] = useState(false)
  const [doneSyncing, setDoneSyncing] = useState(true)
  const [doneOpacity, setDoneOpacity] = useState(1)
  const startSyncing = () => {
    setDoneSyncing(false)
    setDoneOpacity(1)
  }
  const finishedSyncing = () => {
    setDoneSyncing(true)
    setTimeout(() => {
      setDoneOpacity(0)
    }, 3000)
  }
  const fetchSyncedSettings = async () => {
    if (globalThis.chrome?.storage) {
      try {
        startSyncing()
        const settings = (((await chrome.storage.sync.get([settingsKey])) || {})?.[settingsKey] ||
          {}) as Settings
        const { scrollDuration, scrollPixels, loop } = settings
        console.log('Got new settings from sync', scrollDuration, scrollPixels)
        if (scrollDuration && scrollPixels) {
          console.log('Setting defaults')
          setScrollDuration(scrollDuration)
          setScrollPixels(scrollPixels)
          setLoop(Boolean(loop))
        }
      } catch (e) {
        console.error(e)
      } finally {
        finishedSyncing()
      }
    }
  }

  const sendMessage = async (message: Message, showErrors: boolean = true) => {
    if (globalThis.chrome?.tabs) {
      try {
        const [firstTab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (firstTab && firstTab.id) {
          try {
            await chrome.tabs.sendMessage(firstTab.id, message as Message)
            if (showErrors) setError('')
            console.log('Sent to tab: ', firstTab.id)
          } catch (e) {
            if (showErrors) setError(ErrorMessages.CANNOT_CONNECT_TO_ACTIVE_TAB)
          }
        } else {
          if (showErrors) setError(ErrorMessages.CANNOT_QUERY_CURRENT_TAB)
        }
      } catch (e) {
        if (showErrors) setError(ErrorMessages.CANNOT_QUERY_CURRENT_TAB)
        console.error(e)
      }
    }
  }

  const stop = () => {
    sendMessage({ stop: true } as Message, false)
  }
  useEffect(() => {
    stop()
    fetchSyncedSettings().catch(() => {
      console.error('Error syncing')
    })
  }, [])
  const onSubmit = () => {
    sendMessage({ scrollDuration, scrollPixels, loop } as Message)
  }

  const saveAsDefault = async () => {
    startSyncing()
    setDisplaySaved(false)
    if (globalThis.chrome?.storage) {
      console.log('saving', scrollDuration, scrollPixels)
      try {
        await chrome.storage.sync.set({
          [settingsKey]: {
            scrollDuration,
            scrollPixels,
            loop,
          } as Settings,
        })
      } catch (e) {
        console.error(e)
      }
    }
    setDisplaySaved(true)
    setSavedOpacity(1)
    setTimeout(() => {
      setSavedOpacity(0)
      setTimeout(() => {
        setDisplaySaved(false)
      }, 1500)
    }, 3000)
    finishedSyncing()
  }

  return (
    <>
      <Form
        ScrollSpeed={scrollDuration}
        setScrollSpeed={setScrollDuration}
        onSubmit={onSubmit}
        savedOpacity={savedOpacity}
        displaySaved={displaySaved}
        scrollPixels={scrollPixels}
        setScrollPixels={setScrollPixels}
        saveAsDefault={saveAsDefault}
        loop={loop}
        setLoop={setLoop}
      />
      <div aria-busy={!doneSyncing} className='syncing' style={{ opacity: doneOpacity }}>
        {doneSyncing ? 'Synced!' : 'Syncing...'}
      </div>
      <div>
        <TransientMessage
          done={() => setError('')}
          value={error}
          delay={15000}
          duration={3000}
          className='error-message'
        >
          {error}
        </TransientMessage>
      </div>
    </>
  )
}

root.render(<FormHandler />)
