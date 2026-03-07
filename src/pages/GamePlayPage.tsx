import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import TapGame from "./TapGame";
import RayStack from "./RayStack";
import HitAndBlow from "./HitAndBlow";
import CardGamePage from "./cardGame/CardGamePage";
import { APP_ID, STORAGE_KEYS } from "../appConfig";
import { db } from "../firebase";

export default function GamePlayPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const gameKey = params.get("game") ?? "tap";
  const matchId = params.get("matchId") ?? "";

  useEffect(() => {
    if (!matchId) return;
    const tenpoId = localStorage.getItem(STORAGE_KEYS.tenpoId) ?? "default";
    const matchRef = doc(db, `apps/${APP_ID}/general/${tenpoId}/matches/${matchId}`);
    const unsub = onSnapshot(matchRef, (snap) => {
      const data = snap.data() as { status?: string } | undefined;
      if (!data) return;
      if (data.status === "ended") {
        navigate(`/result?matchId=${encodeURIComponent(matchId)}`);
      }
    });
    return () => unsub();
  }, [matchId, navigate]);

  const content = useMemo(() => {
    const goResult = () => {
      if (!matchId) {
        navigate("/result");
        return;
      }
      navigate(`/result?matchId=${encodeURIComponent(matchId)}`);
    };

    if (gameKey === "memory") {
      return (
        <CardGamePage
          appId={APP_ID}
          matchId={matchId || "demo"}
          demo={!matchId}
        />
      );
    }
    if (gameKey === "raystack") {
      return <RayStack onFinished={goResult} />;
    }
    if (gameKey === "hitblow") {
      return <HitAndBlow onFinished={goResult} />;
    }
    return <TapGame onFinished={goResult} />;
  }, [gameKey, matchId, navigate]);

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <span style={headerTitleStyle}>Now Playing</span>
        <button onClick={() => navigate("/vote")} style={headerButtonStyle}>
          投票へ
        </button>
      </div>
      <div style={contentStyle}>{content}</div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#0f172a",
  display: "flex",
  flexDirection: "column",
};

const headerStyle: React.CSSProperties = {
  background: "#111827",
  color: "#fff",
  padding: "12px 16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "1px solid rgba(255,255,255,0.2)",
};

const headerTitleStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  letterSpacing: "0.08em",
};

const headerButtonStyle: React.CSSProperties = {
  background: "#38bdf8",
  color: "#0f172a",
  border: "2px solid #fff",
  borderRadius: 999,
  padding: "6px 14px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  background: "#f8fafc",
};
