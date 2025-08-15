import { jsx as _jsx } from "react/jsx-runtime";
import { createBrowserRouter } from 'react-router-dom';
import Home from '../sections/Home';
import Login from '../sections/Login';
import RestaurantDetail from '../sections/RestaurantDetail';
import Hold from '../sections/Hold';
import Profile from '../sections/Profile';
import Drops from '../sections/Drops';
import DropDetail from '../sections/DropDetail';
import RestaurantLogin from '../sections/RestaurantLogin';
import ExploreRestaurants from '../sections/ExploreRestaurants';
import RestaurantAdminPanel from '../sections/admin/RestaurantAdminPanel';
import Signup from '../sections/Signup';
export const router = createBrowserRouter([
    {
        path: '/',
        element: _jsx(Home, {})
    },
    {
        path: '/login',
        element: _jsx(Login, {})
    },
    {
        path: '/signup',
        element: _jsx(Signup, {})
    },
    {
        path: '/restaurant/:id',
        element: _jsx(RestaurantDetail, {})
    },
    {
        path: '/r/:slug',
        element: _jsx(RestaurantDetail, {})
    },
    {
        path: '/hold/:id',
        element: _jsx(Hold, {})
    },
    {
        path: '/profile',
        element: _jsx(Profile, {})
    },
    {
        path: '/drops',
        element: _jsx(Drops, {})
    },
    {
        path: '/drops/:id',
        element: _jsx(DropDetail, {})
    },
    {
        path: '/restaurant-login',
        element: _jsx(RestaurantLogin, {})
    },
    {
        path: '/explore-tonight',
        element: _jsx(ExploreRestaurants, {})
    },
    {
        path: '/admin/:restaurantId',
        element: _jsx(RestaurantAdminPanel, {})
    }
]);
