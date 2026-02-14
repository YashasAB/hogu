import { createBrowserRouter } from 'react-router-dom'

// Dating sections (now primary at /)
import DatingHome from '../sections/dating/Home'
import DatingLogin from '../sections/dating/Login'
import DatingSignup from '../sections/dating/Signup'
import DatingApp from '../sections/dating/App'
import DatingResetPassword from '../sections/dating/ResetPassword'
import NYCHome from '../sections/dating/NYCHome'
import NYCSignup from '../sections/dating/NYCSignup'

// Restaurant reservation sections (moved to /restaurant-reservations)
import RestaurantHome from '../sections/restaurant/Home'
import RestaurantLogin from '../sections/restaurant/Login'
import RestaurantSignup from '../sections/restaurant/Signup'
import RestaurantDetail from '../sections/restaurant/RestaurantDetail'
import RestaurantLoginAdmin from '../sections/restaurant/RestaurantLogin'
import ExploreRestaurants from '../sections/restaurant/ExploreRestaurants'
import Hold from '../sections/restaurant/Hold'
import Profile from '../sections/restaurant/Profile'
import Drops from '../sections/restaurant/Drops'
import DropDetail from '../sections/restaurant/DropDetail'

// Admin sections
import RestaurantAdminPanel from '../sections/admin/RestaurantAdminPanel'
import DbAdmin from '../sections/admin/DbAdmin'
import DatingAdminPortal from '../sections/dating/AdminPortal'


export const router = createBrowserRouter([
  // Dating routes (primary - at root)
  {
    path: '/',
    element: <DatingHome />
  },
  {
    path: '/login',
    element: <DatingLogin />
  },
  {
    path: '/signup',
    element: <DatingSignup />
  },
  {
    path: '/app',
    element: <DatingApp />
  },
  {
    path: '/reset-password',
    element: <DatingResetPassword />
  },

  // NYC dating routes
  {
    path: '/nyc',
    element: <NYCHome />
  },
  {
    path: '/nyc/signup',
    element: <NYCSignup />
  },

  // Restaurant reservation routes (dormant - under /restaurant-reservations)
  {
    path: '/restaurant-reservations',
    element: <RestaurantHome />
  },
  {
    path: '/restaurant-reservations/login',
    element: <RestaurantLogin />
  },
  {
    path: '/restaurant-reservations/signup',
    element: <RestaurantSignup />
  },
  {
    path: '/restaurant-reservations/restaurant/:id',
    element: <RestaurantDetail />
  },
  {
    path: '/restaurant-reservations/r/:slug',
    element: <RestaurantDetail />
  },
  {
    path: '/restaurant-reservations/hold/:id',
    element: <Hold />
  },
  {
    path: '/restaurant-reservations/profile',
    element: <Profile />
  },
  {
    path: '/restaurant-reservations/drops',
    element: <Drops />
  },
  {
    path: '/restaurant-reservations/drops/:id',
    element: <DropDetail />
  },
  {
    path: '/restaurant-reservations/explore-tonight',
    element: <ExploreRestaurants />
  },

  // Restaurant admin routes
  {
    path: '/restaurant-login',
    element: <RestaurantLoginAdmin />
  },
  {
    path: '/admin/:restaurantId',
    element: <RestaurantAdminPanel />
  },
  {
    path: '/db-admin',
    element: <DbAdmin />
  },
  {
    path: '/dating-admin',
    element: <DatingAdminPortal />
  }
])
