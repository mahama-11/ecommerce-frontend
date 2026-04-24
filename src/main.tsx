import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import AuthBootstrap from '@/components/auth/AuthBootstrap'
import { router } from '@/router'
import '@/i18n'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthBootstrap />
    <RouterProvider router={router} />
  </React.StrictMode>,
)
