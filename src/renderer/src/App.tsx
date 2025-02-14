const router = createHashRouter([
  {
    path: '/',
    element: <Home />
  }
  /*   {
    path: '/scenes',
    element: <Scenes />
  },
  {
    path: '/devices',
    element: <Devices />
  } */
])

import { useEffect } from 'react'
import { createHashRouter, RouterProvider } from 'react-router'
import { useBulbStore } from './context/BulbStore'
import Home from './pages/Home'

function App(): JSX.Element {
  const initializeBulb = useBulbStore((state) => state.initializeBulb)

  useEffect(() => {
    initializeBulb()
  }, [])

  return <RouterProvider router={router} />
}

export default App
