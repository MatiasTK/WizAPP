const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        path: '/',
        element: <Home />
      },
      {
        path: '/scenes',
        element: <Scenes />
      }
    ]
  }
])

import { useEffect } from 'react'
import { createHashRouter, RouterProvider } from 'react-router'
import Layout from './components/Layout'
import { useBulbStore } from './context/BulbStore'
import Home from './pages/Home'
import Scenes from './pages/Scenes'

function App(): JSX.Element {
  const initializeBulb = useBulbStore((state) => state.initializeBulb)

  useEffect(() => {
    initializeBulb()
  }, [])

  return <RouterProvider router={router} />
}

export default App
