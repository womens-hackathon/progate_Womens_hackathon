import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { STORAGE_KEYS } from "../appConfig";

type GameOption = {
  key: string;
  label: string;
  description: string;
  theme: string;
};

const gameOptions: GameOption[] = [
  {
    key: "tap",
    label: "連打ゲーム",
    description: "制限時間内にタップ数を競う",
    theme: "#ffd500",
  },
  {
    key: "memory",
    label: "神経衰弱",
    description: "同じ数字のカードを揃える",
    theme: "#22d3ee",
  },
  {
    key: "raystack",
    label: "動物積みゲーム",
    description: "エイを崩さずに積み上げる",
    theme: "#86efac",
  },
  {
    key: "hitblow",
    label: "ヒット&ブロー",
    description: "4桁の数字を当てる",
    theme: "#c4b5fd",
  },
];

export default function GameSelectPage() {
  const navigate = useNavigate();
  const nickname = useMemo(
    () => localStorage.getItem(STORAGE_KEYS.nickname) ?? "ゲスト",
    []
  );

  const handleSelect = (gameKey: string) => {
    localStorage.setItem(STORAGE_KEYS.gameKey, gameKey);
    navigate(`/match?game=${encodeURIComponent(gameKey)}`);
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <p style={eyebrowStyle}>Choose a Game</p>
          <h1 style={titleStyle}>ゲームを選択</h1>
        </div>
        <div style={userBadgeStyle}>👤 {nickname}</div>
      </div>

      <div style={gridStyle}>
        {gameOptions.map((game) => (
          <button
            key={game.key}
            onClick={() => handleSelect(game.key)}
            style={{
              ...cardStyle,
              borderColor: game.theme,
            }}
          >
            <span style={{ ...tagStyle, background: game.theme }}>
              {game.label}
            </span>
            <span style={descStyle}>{game.description}</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => navigate("/quiz")}
        style={{ ...cardStyle, borderColor: "#fb923c" }}
      >
        <span style={{ ...tagStyle, background: "#fb923c" }}>おすすめメニュー診断</span>
        <span style={descStyle}>好みに合ったサイゼリヤメニューを診断</span>
      </button>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: 24,
  background: "#f8fafc",
  display: "flex",
  flexDirection: "column",
  gap: 24,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  color: "#64748b",
  margin: 0,
};

const titleStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 900,
  color: "#0f172a",
  margin: 0,
};

const userBadgeStyle: React.CSSProperties = {
  background: "#fff",
  border: "2px solid #111",
  borderRadius: 999,
  padding: "6px 14px",
  fontSize: 12,
  fontWeight: 800,
  boxShadow: "2px 2px 0px #111",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
};

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "3px solid #111",
  borderRadius: 16,
  padding: 16,
  textAlign: "left",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  cursor: "pointer",
  boxShadow: "4px 4px 0px #111",
};

const tagStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  padding: "4px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
  color: "#111",
  width: "fit-content",
};

const descStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#475569",
};
