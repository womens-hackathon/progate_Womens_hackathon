import { BrowserRouter, Routes, Route } from "react-router-dom"
import VotePage from "./pages/VotePage"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VotePage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App