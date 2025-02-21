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
      },
      {
        path: '/information',
        element: <Information />
      }
    ]
  }
])

import { createHashRouter, RouterProvider } from 'react-router'
import Layout from './components/Layout'
import Home from './pages/Home'
import Information from './pages/Information'
import Scenes from './pages/Scenes'

function App(): JSX.Element {
  return <RouterProvider router={router} />
}

export default App
