import { createRoot } from 'react-dom/client'
import { i18nReady } from './locales'
import Root from './app/Root'
import './styles/index.scss'

const root = document.getElementById('root')
if (!root) throw new Error('App root is missing')

void i18nReady.then(() => createRoot(root).render(<Root />))
