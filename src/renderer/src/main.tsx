import '@fontsource-variable/inter'
import './assets/main.css'

import i18n from '@i18n/index'
import App from '@renderer/App'
import React from 'react'
import ReactDOM from 'react-dom/client'

window.api.getLanguage().then((res) => {
  i18n.changeLanguage(res).then(() => {
    ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  })
})
