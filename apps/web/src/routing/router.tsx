
import { createBrowserRouter } from 'react-router-dom'
import Home from '../sections/Home'
import Login from '../sections/Login'
import Signup from '../sections/Signup'
import RestaurantDetail from '../sections/RestaurantDetail'
import Hold from '../sections/Hold'
import Profile from '../sections/Profile'
import Drops from '../sections/Drops'
import DropDetail from '../sections/DropDetail'
import RestaurantLogin from '../sections/RestaurantLogin'
import ExploreRestaurants from '../sections/ExploreRestaurants'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/signup', 
    element: <Signup />
  },
  {
    path: '/restaurant/:id',
    element: <RestaurantDetail />
  },
  {
    path: '/r/:slug',
    element: <RestaurantDetail />
  },
  {
    path: '/hold/:id',
    element: <Hold />
  },
  {
    path: '/profile',
    element: <Profile />
  },
  {
    path: '/drops',
    element: <Drops />
  },
  {
    path: '/drops/:id',
    element: <DropDetail />
  },
  {
    path: '/restaurant-login',
    element: <RestaurantLogin />
  },
  {
    path: '/explore-tonight',
    element: <ExploreRestaurants />
  }
])
