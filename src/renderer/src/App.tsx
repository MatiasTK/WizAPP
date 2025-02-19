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

import { createHashRouter, RouterProvider } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'
import Scenes from './pages/Scenes'

function App(): JSX.Element {
  return <RouterProvider router={router} />
}

export default App
