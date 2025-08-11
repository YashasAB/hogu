import { Outlet, Link } from 'react-router-dom'

export default function App(){
  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-10 bg-paper/80 backdrop-blur border-b">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold">Hogu</Link>
          <nav className="flex gap-4 text-sm">
            <Link to="/drops" className="hover:underline">Drops</Link>
            <Link to="/me" className="hover:underline">Profile</Link>
            <Link to="/login" className="btn btn-primary">Log in</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
