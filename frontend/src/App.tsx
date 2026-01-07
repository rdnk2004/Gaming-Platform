import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import GamePage from './pages/GamePage'
import Leaderboard from './pages/Leaderboard'

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="game/:slug" element={<GamePage />} />
            </Route>
        </Routes>
    )
}

export default App

