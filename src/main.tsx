import '@fontsource-variable/inter'
import '@fontsource-variable/space-grotesk'
import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { cores } from './config/empreendimento'

// leva as cores do arquivo de configuração para a interface
const root = document.documentElement.style
root.setProperty('--cor-disponivel', cores.disponivel)
root.setProperty('--cor-reservado', cores.reservado)
root.setProperty('--cor-vendido', cores.vendido)
root.setProperty('--cor-destaque', cores.destaque)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
