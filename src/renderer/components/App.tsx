import { createRoot } from 'react-dom/client';
import Home from '@components/Home';
import { RouterProvider, createHashRouter } from 'react-router-dom';
import Scenes from '@components/Scenes';
import BulbProvider from '@context/BulbContext';
import Devices from '@components/Devices';
import '@i18n/index';

const router = createHashRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/scenes',
    element: <Scenes />,
  },
  {
    path: '/devices',
    element: <Devices />,
  },
]);

const domNode = document.getElementById('root');
const root = createRoot(domNode);
root.render(
  <BulbProvider>
    <RouterProvider router={router} />
  </BulbProvider>
);
