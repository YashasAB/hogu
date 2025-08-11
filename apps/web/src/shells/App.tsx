
import { BrowserRouter } from 'react-router-dom'
import AppRouter from '../routing/router'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <AppRouter />
      </div>
    </BrowserRouter>
  )
}
