import { Routes, Route } from "react-router-dom";
import VotePage from "./pages/VotePage";
import TapGame from "./pages/TapGame";
import HitAndBlow from "./pages/HitAndBlow";
import RayStack from "./pages/RayStack";

function App() {
  return (
    <Routes>
      <Route path="/" element={<VotePage />} />
      <Route path="/tap" element={<TapGame />} />
      <Route path="/hb" element={<HitAndBlow />} />
      <Route path="/ray" element={<RayStack />} />
    </Routes>
  );
}

export default App;
