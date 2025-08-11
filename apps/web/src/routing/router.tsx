import { createBrowserRouter } from 'react-router-dom'
import App from '../shells/App'
import Home from '../sections/Home'
import Login from '../sections/Login'
import Signup from '../sections/Signup'
import RestaurantDetail from '../sections/RestaurantDetail'
import Hold from '../sections/Hold'
import Drops from '../sections/Drops'
import DropDetail from '../sections/DropDetail'
import Profile from '../sections/Profile'
import AdminProfile from '../sections/admin/AdminProfile'
import AdminPhotos from '../sections/admin/AdminPhotos'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'signup', element: <Signup /> },
      { path: 'r/:slug', element: <RestaurantDetail /> },
      { path: 'r/:slug/hold/:reservationId', element: <Hold /> },
      { path: 'drops', element: <Drops /> },
      { path: 'drops/:id', element: <DropDetail /> },
      { path: 'me', element: <Profile /> },
      { path: 'admin/:restaurantId/profile', element: <AdminProfile /> },
      { path: 'admin/:restaurantId/photos', element: <AdminPhotos /> },
    ]
  }
])
