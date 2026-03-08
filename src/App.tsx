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
import FoodQuiz from "./pages/FoodQuiz";
import { useWaitingCount } from "./hooks/useWaitingCount";

function WaitingBadge() {
  const waitingCount = useWaitingCount();
  if (waitingCount === null) return null;

  return (
    <div style={{
      position: "fixed",
      top: 16,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      fontSize: 15,
      fontWeight: 900,
      color: "#fff",
      background: "#ef4444",
      border: "2px solid #111",
      borderRadius: 999,
      padding: "5px 14px",
      boxShadow: "2px 2px 0px #111",
      pointerEvents: "none",
      whiteSpace: "nowrap",
    }}>
      あと{waitingCount}人待ち
    </div>
  );
}

function App() {
  return (
    <>
      <WaitingBadge />
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
      <Route path="/room/:id" element={<LoginPage />} />
      <Route path="/quiz" element={<FoodQuiz />} />
      </Routes>
    </>
  );
}

export default App;