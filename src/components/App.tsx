import { createRoot } from 'react-dom/client';
import Home from './Home';
import { RouterProvider, createHashRouter } from 'react-router-dom';
import Scenes from './Scenes';
import { BulbProvider } from './BulbContext';
import Devices from './Devices';
import '../i18n';

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
