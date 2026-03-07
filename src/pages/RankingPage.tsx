import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { STORAGE_KEYS } from "../appConfig";

type Candidate = {
  id: string;
  musicName: string;
  votes: number;
};

function Header({ onHome }: { onHome: () => void }) {
  return (
    <div style={headerStyle}>
      <span style={headerTitleStyle}>BGM Ranking</span>
      <button onClick={onHome} style={headerButtonStyle}>
        Home
      </button>
    </div>
  );
}

export default function RankingPage() {
  const navigate = useNavigate();
  const [votedId, setVotedId] = useState<string | null>(null);

  const candidates = useMemo<Candidate[]>(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.voteCandidates);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as Candidate[];
      return parsed.map((c) => ({ ...c, votes: c.votes ?? 0 }));
    } catch {
      return [];
    }
  }, []);

  const [items, setItems] = useState<Candidate[]>(candidates);

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => b.votes - a.votes);
  }, [items]);

  const handleVote = (id: string) => {
    if (votedId) return;
    setVotedId(id);
    setItems((prev) =>
      prev.map((c) => (c.id === id ? { ...c, votes: c.votes + 1 } : c))
    );
  };

  return (
    <div style={pageStyle}>
      <Header onHome={() => navigate("/")} />
      <div style={contentStyle}>
        <h1 style={titleStyle}>ランキング</h1>
        {sorted.length === 0 ? (
          <p style={emptyStyle}>投票候補がありません</p>
        ) : (
          <div style={listStyle}>
            {sorted.map((c, idx) => (
              <div key={c.id} style={itemStyle}>
                <div>
                  <p style={rankStyle}>{idx + 1} 位</p>
                  <p style={nameStyle}>{c.musicName}</p>
                </div>
                <div style={voteRightStyle}>
                  <span style={voteCountStyle}>{c.votes}</span>
                  <button
                    onClick={() => handleVote(c.id)}
                    disabled={votedId !== null}
                    style={{
                      ...voteButtonStyle,
                      opacity: votedId !== null ? 0.6 : 1,
                    }}
                  >
                    投票
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={actionsStyle}>
          <button onClick={() => navigate("/games")} style={primaryButtonStyle}>
            もう一度ゲームをする
          </button>
          <button onClick={() => navigate("/")} style={secondaryButtonStyle}>
            ホームへ戻る
          </button>
        </div>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#ffffff",
  fontFamily: "'Helvetica Neue', Arial, sans-serif",
};

const headerStyle: React.CSSProperties = {
  width: "100%",
  background: "#fff",
  borderBottom: "2px solid #111",
  padding: "16px 20px",
  position: "sticky",
  top: 0,
  zIndex: 10,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  boxSizing: "border-box",
};

const headerTitleStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 900,
  fontStyle: "italic",
  color: "#111",
  letterSpacing: "-0.02em",
};

const headerButtonStyle: React.CSSProperties = {
  background: "#fff",
  color: "#ff3344",
  border: "1.5px solid #ff3344",
  borderRadius: 6,
  padding: "4px 10px",
  fontSize: 11,
  fontWeight: 800,
  cursor: "pointer",
};

const contentStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 520,
  margin: "0 auto",
  padding: "16px 16px 32px",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const titleStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 900,
  color: "#111",
  margin: 0,
};

const emptyStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#64748b",
  fontWeight: 700,
};

const listStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const itemStyle: React.CSSProperties = {
  border: "2px solid #111",
  borderRadius: 16,
  padding: "12px 16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  boxShadow: "3px 3px 0px #111",
};

const rankStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  color: "#ff3344",
  textTransform: "uppercase",
};

const nameStyle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: "#111",
};

const voteRightStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const voteCountStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  color: "#111",
};

const voteButtonStyle: React.CSSProperties = {
  background: "#ffd500",
  color: "#111",
  border: "2px solid #111",
  borderRadius: 8,
  padding: "6px 10px",
  fontWeight: 800,
  cursor: "pointer",
};

const actionsStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  marginTop: 12,
};

const primaryButtonStyle: React.CSSProperties = {
  width: "100%",
  background: "#ffd500",
  color: "#111",
  border: "2.5px solid #111",
  borderRadius: 50,
  padding: "14px 0",
  fontSize: 15,
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "3px 3px 0px #111",
};

const secondaryButtonStyle: React.CSSProperties = {
  width: "100%",
  background: "#fff",
  color: "#111",
  border: "2.5px solid #111",
  borderRadius: 50,
  padding: "14px 0",
  fontSize: 15,
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "3px 3px 0px #111",
};
