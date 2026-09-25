import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { bootstrapAppPersistence } from './shared/bootstrap'

async function start(): Promise<void> {
  window.electronAPI?.setSplashStatus?.('Daten werden geladen…')
  await bootstrapAppPersistence()
  window.electronAPI?.setSplashStatus?.('Oberfläche wird aufgebaut…')

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void start()
