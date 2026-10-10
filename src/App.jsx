import { BrowserRouter } from 'react-router'
import { Toaster } from 'react-hot-toast'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster position="top-center" />
    </BrowserRouter>
  )
}

export default App
