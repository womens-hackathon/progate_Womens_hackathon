import { Routes, Route } from "react-router-dom";
import VotePage from "./pages/VotePage";
import GamePage from "./pages/TapGame";
import CardGamePage from "./pages/cardGame/CardGamePage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<VotePage />} />
      <Route path="/tap" element={<GamePage />} />
      <Route path="/card" element={<CardGamePage appId="demo" matchId="demo" demo />} />
    </Routes>
  );
}

export default App;
