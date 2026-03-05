import { Routes, Route } from "react-router-dom";
import GamePage from "./pages/TapGame";

export default function App() {
  return (
    <Routes>
      <Route path="/tap" element={<GamePage />} />
    </Routes>
  );
}
