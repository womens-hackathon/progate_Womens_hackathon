import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { STORAGE_KEYS } from "../appConfig";

type GameOption = {
  key: string;
  label: string;
  icon: string;
  description: string;
  detail: string;
  theme: string;
};

const gameOptions: GameOption[] = [
  {
    key: "tap",
    label: "連打ゲーム",
    icon: "👆",
    description: "10秒間ひたすら連打！",
    detail: "タップ数が多い方が勝ち。スマホは指、PCはスペースキーでもOK！",
    theme: "#ffd500",
  },
  {
    key: "memory",
    label: "神経衰弱",
    icon: "🃏",
    description: "同じ数字のカードを揃えよう",
    detail: "2枚めくって同じ数字なら取れる。多く集めた方が勝ち！",
    theme: "#22d3ee",
  },
  {
    key: "raystack",
    label: "エイ積みゲーム",
    icon: "🐟",
    description: "エイを崩さずに積み上げよう",
    detail: "タップしてエイを落として積む。傾きすぎたら崩れてゲームオーバー！",
    theme: "#86efac",
  },
  {
    key: "hitblow",
    label: "ヒット&ブロー",
    icon: "🔢",
    description: "相手の4桁の数字を当てよう",
    detail: "数字と位置が合えばHIT、数字だけ合えばBLOW。先に当てた方が勝ち！",
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
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 32 }}>{game.icon}</span>
              <span style={{ ...tagStyle, background: game.theme }}>
                {game.label}
              </span>
            </div>
            <span style={descStyle}>{game.description}</span>
            <span style={detailStyle}>{game.detail}</span>
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
  fontWeight: 700,
  color: "#0f172a",
};

const detailStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  color: "#64748b",
  lineHeight: 1.6,
};
