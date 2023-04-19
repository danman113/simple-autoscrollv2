import './popup.css'
import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Settings, Message } from './types'

const container = document.getElementById('app')
const root = createRoot(container!)

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
        min='1'
        max='5000'
        value={scrollPixels}
        onChange={(e) => setScrollPixels(Number(e.target.value))}
      />{' '}
      pixels every <br />
      <input
        id='seconds'
        type='number'
        step='25'
        min='0'
        max='600000'
        value={ScrollSpeed}
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
      startSyncing()
      const { scrollDuration, scrollPixels, loop } = ((await chrome.storage.sync.get([settingsKey])) || {
        [settingsKey]: {},
      })?.[settingsKey] as Settings
      console.log('Got new settings from sync', scrollDuration, scrollPixels)
      if (scrollDuration && scrollPixels) {
        console.log('Setting defaults')
        setScrollDuration(scrollDuration)
        setScrollPixels(scrollPixels)
        setLoop(Boolean(loop))
      }
      finishedSyncing()
    }
  }
  
  const stop = () => {
    if (globalThis.chrome?.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, ([firstTab]) => {
        if (firstTab && firstTab.id)
          chrome.tabs.sendMessage(firstTab.id, { stop: true } as Message)
      })
    }
  }
  useEffect(() => {
    stop()
    fetchSyncedSettings().catch(() => {
      console.error('Error syncing')
    })
  }, [])
  const onSubmit = () => {
    if (globalThis.chrome?.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, ([firstTab]) => {
        if (firstTab && firstTab.id)
          chrome.tabs.sendMessage(firstTab.id, { scrollDuration, scrollPixels, loop } as Message)
      })
    }
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
            loop
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
      <span aria-busy={!doneSyncing} className='syncing' style={{opacity: doneOpacity}}>{doneSyncing ? 'Synced!' : 'Syncing...'}</span>
    </>
  )
}

root.render(<FormHandler />)
