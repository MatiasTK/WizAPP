import BulbProvider from '@context/BulbContext'
import Devices from '@pages/Devices'
import Home from '@pages/Home'
import Scenes from '@pages/Scenes'
import { createHashRouter, RouterProvider } from 'react-router'

const router = createHashRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/scenes',
    element: <Scenes />
  },
  {
    path: '/devices',
    element: <Devices />
  }
])

function App(): JSX.Element {
  return (
    <BulbProvider>
      <RouterProvider router={router} />
    </BulbProvider>
  )
}

export default App
