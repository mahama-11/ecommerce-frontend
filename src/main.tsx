import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import AuthBootstrap from '@/components/auth/AuthBootstrap'
import Toast from '@/components/Toast'
import { router } from '@/router'
import '@/i18n'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthBootstrap />
    <Toast />
    <RouterProvider router={router} />
  </React.StrictMode>,
)
