import { BrowserRouter, Routes, Route } from "react-router-dom";
import VotePage from "./pages/VotePage";
import GamePage from "./pages/TapGame";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<VotePage />} />
        <Route path="/tap" element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;