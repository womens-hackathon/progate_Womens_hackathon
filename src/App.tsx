import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import GameSelectPage from "./pages/GameSelectPage";
import MatchWaitingPage from "./pages/MatchWaitingPage";
import GamePlayPage from "./pages/GamePlayPage";
import ResultPage from "./pages/ResultPage";
import VotePage from "./pages/VotePage";
import RankingPage from "./pages/RankingPage";
import TapGame from "./pages/TapGame";
import HitAndBlow from "./pages/HitAndBlow";
import RayStack from "./pages/RayStack";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/default" replace />} />
      <Route path="/:id" element={<LoginPage />} />
      <Route path="/games" element={<GameSelectPage />} />
      <Route path="/match" element={<MatchWaitingPage />} />
      <Route path="/play" element={<GamePlayPage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/vote" element={<VotePage />} />
      <Route path="/ranking" element={<RankingPage />} />
      <Route path="/tap" element={<TapGame />} />
      <Route path="/hb" element={<HitAndBlow />} />
      <Route path="/ray" element={<RayStack />} />
    </Routes>
  );
}

export default App;
