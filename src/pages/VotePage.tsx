import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Candidate = {
  id: string;
  musicName: string;
  votes: number;
};

type AdditionalViewProps = {
  onAdd: (musicName: string) => void;
  onFinish: () => void;
  canFinish: boolean;
  onPlayAgain: () => void;
  hasAdded: boolean;
  onHome: () => void;
};

type RankingViewProps = {
  candidates: Candidate[];
  onVote: (id: string) => void;
  votedId: string | null;
  onPlayAgain: () => void;
  onQuit: () => void;
  isWinner: boolean;
  onHome: () => void;
};

type ITunesTrack = {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
};

// 共通ヘッダー
function Header({ onHome }: { onHome: () => void }) {
  return (
    <div style={{
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
    }}>
      <span style={{
        fontSize: 20,
        fontWeight: 900,
        fontStyle: "italic",
        color: "#111",
        letterSpacing: "-0.02em",
      }}>
        Request the BGM
      </span>
      <button
        onClick={onHome}
        style={{
          background: "#fff",
          color: "#ff3344",
          border: "1.5px solid #ff3344",
          borderRadius: 6,
          padding: "4px 10px",
          fontSize: 11,
          fontWeight: 800,
          cursor: "pointer",
        }}
      >
        Home
      </button>
    </div>
  );
}

// 曲の追加画面（勝者）
function AdditionalView({
  onAdd,
  onFinish,
  canFinish,
  onPlayAgain,
  hasAdded,
  onHome,
}: AdditionalViewProps) {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<ITunesTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (keyword: string) => {
    const q = keyword.trim();

    if (!q || hasAdded) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setSearched(true);

      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(
          q
        )}&entity=song&country=JP&limit=10`
      );

      if (!res.ok) {
        throw new Error("検索に失敗しました");
      }

      const data = await res.json();
      setResults(Array.isArray(data.results) ? data.results : []);
    } catch (error) {
      console.error(error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasAdded) return;

    const trimmed = input.trim();

    if (!trimmed) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch(trimmed);
    }, 350);

    return () => clearTimeout(timer);
  }, [input, hasAdded]);

  const handleSelect = (track: ITunesTrack) => {
    if (hasAdded) return;
    onAdd(`${track.trackName} / ${track.artistName}`);
    setInput("");
    setResults([]);
    setSearched(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        fontFamily: "'Helvetica Neue', Arial, sans-serif",
        width: "100%",
      }}
    >
      <Header onHome={onHome} />
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          margin: "0 auto",
          padding: "16px 16px 24px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#888",
              textAlign: "center",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            🏆 Winner
          </p>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 900,
              textAlign: "center",
              color: "#111",
              marginTop: 4,
            }}
          >
            曲のリクエスト
          </h1>
        </div>

        <div
          style={{
            background: "#fff",
            border: "2.5px solid #111",
            borderRadius: 20,
            padding: "20px 16px",
            boxShadow: "4px 4px 0px #111",
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#888",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            曲名 / アーティスト名
          </p>

          <input
            style={{
              width: "100%",
              border: "2px solid #111",
              borderRadius: 12,
              padding: "12px 14px",
              fontSize: 16,
              fontWeight: 600,
              outline: "none",
              marginBottom: 12,
              boxSizing: "border-box",
              background: "#f9f9f9",
              color: "#111",
            }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="例：夜に駆ける / YOASOBI"
            disabled={hasAdded}
          />

          {hasAdded ? (
            <button
              disabled
              style={{
                width: "100%",
                background: "#ccc",
                color: "#fff",
                border: "2.5px solid #111",
                borderRadius: 50,
                padding: "14px 0",
                fontSize: 16,
                fontWeight: 800,
                cursor: "not-allowed",
              }}
            >
              ✓ 追加済み
            </button>
          ) : null}

          {loading && (
            <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>
              検索しています...
            </p>
          )}

          {!loading && searched && results.length === 0 && input.trim() && !hasAdded && (
            <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>
              該当する曲がありません
            </p>
          )}

          {!hasAdded && results.length > 0 && (
            <div
              style={{
                marginTop: 14,
                border: "2px solid #111",
                borderRadius: 16,
                overflow: "hidden",
                background: "#fff",
              }}
            >
              {results.map((track, index) => (
                <button
                  key={track.trackId}
                  onClick={() => handleSelect(track)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px",
                    background: "#fff",
                    border: "none",
                    borderBottom:
                      index < results.length - 1 ? "1.5px solid #eee" : "none",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <img
                    src={track.artworkUrl100 || ""}
                    alt={track.trackName}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 10,
                      objectFit: "cover",
                      background: "#f1f1f1",
                      flexShrink: 0,
                      border: "1px solid #ddd",
                    }}
                  />

                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: "#111",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {track.trackName}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#666",
                        marginTop: 4,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {track.artistName}
                    </div>
                  </div>

                  <div
                    style={{
                      color: "#ff3344",
                      fontSize: 12,
                      fontWeight: 800,
                      border: "1.5px solid #ff3344",
                      borderRadius: 999,
                      padding: "6px 10px",
                      flexShrink: 0,
                    }}
                  >
                    選択
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={canFinish ? onFinish : undefined}
            disabled={!canFinish}
            style={{
              width: "100%",
              background: canFinish ? "#ffd500" : "#ccc",
              color: "#111",
              border: "2.5px solid #111",
              borderRadius: 50,
              padding: "16px 0",
              fontSize: 16,
              fontWeight: 800,
              cursor: canFinish ? "pointer" : "not-allowed",
              boxShadow: canFinish ? "3px 3px 0px #111" : "none",
            }}
          >
            🏆 ランキングを見る
          </button>
          <button
            onClick={onPlayAgain}
            style={{
              width: "100%",
              background: "#fff",
              color: "#111",
              border: "2.5px solid #111",
              borderRadius: 50,
              padding: "16px 0",
              fontSize: 16,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "3px 3px 0px #111",
            }}
          >
            🎮 もう一度ゲームをする
          </button>
        </div>
      </div>
    </div>
  );
}

// ランキング＋投票画面
function RankingView({ candidates, onVote, votedId, onPlayAgain, onQuit, isWinner, onHome }: RankingViewProps) {
  const maxVotes = Math.max(...candidates.map((c) => c.votes), 1);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#ffffff",
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
      width: "100%",
    }}>
      <Header onHome={onHome} />
      <div style={{
        width: "100%",
        maxWidth: 480,
        margin: "0 auto",
        padding: "16px 16px 24px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#888", textAlign: "center", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            🎵 BGM Ranking
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 900, textAlign: "center", color: "#111", marginTop: 4 }}>
            {isWinner ? "ランキング" : votedId ? "投票済み！" : "投票しよう"}
          </h1>
          <p style={{ fontSize: 13, color: "#888", textAlign: "center", marginTop: 4 }}>
            {isWinner ? "現在のランキングです" : votedId ? "結果をリアルタイムで確認できます" : "気に入った曲に1票投票してください"}
          </p>
        </div>

        <div style={{
          background: "#fff", border: "2.5px solid #111", borderRadius: 20,
          padding: "8px 0", boxShadow: "4px 4px 0px #111",
        }}>
          {candidates.length === 0 ? (
            <p style={{ textAlign: "center", color: "#888", padding: "32px 0", fontSize: 14 }}>
              まだ候補曲がありません
            </p>
          ) : (
            candidates.map((c, idx) => {
              const pct = Math.round((c.votes / maxVotes) * 100);
              const isMyVote = votedId === c.id;
              return (
                <div key={c.id} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                  borderBottom: idx < candidates.length - 1 ? "1.5px solid #eee" : "none",
                  background: isMyVote ? "#fff5f5" : "transparent",
                }}>
                  <div style={{ width: 32, textAlign: "center", fontSize: idx < 3 ? 22 : 14, fontWeight: 900, color: "#111", flexShrink: 0 }}>
                    {idx < 3 ? medals[idx] : `${idx + 1}`}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.musicName}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <div style={{ flex: 1, height: 6, background: "#eee", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: isMyVote ? "#ff3344" : "#111", borderRadius: 99, transition: "width 0.5s" }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#888", flexShrink: 0 }}>{c.votes}票</span>
                    </div>
                  </div>
                  {!isWinner && (
                    isMyVote ? (
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#ff3344", border: "2px solid #ff3344", borderRadius: 50, padding: "6px 12px", flexShrink: 0 }}>
                        ✓ 投票済
                      </div>
                    ) : (
                      <button
                        onClick={() => onVote(c.id)}
                        disabled={votedId !== null}
                        style={{
                          background: votedId !== null ? "#eee" : "#ff3344",
                          color: votedId !== null ? "#aaa" : "#fff",
                          border: "2px solid #111", borderRadius: 50,
                          padding: "6px 14px", fontSize: 13, fontWeight: 800,
                          cursor: votedId !== null ? "not-allowed" : "pointer",
                          flexShrink: 0,
                          boxShadow: votedId !== null ? "none" : "2px 2px 0px #111",
                        }}
                      >
                        投票
                      </button>
                    )
                  )}
                </div>
              );
            })
          )}
        </div>

{/* メインコンポーネント */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={onPlayAgain} style={{
            width: "100%", background: "#ffd500", color: "#111",
            border: "2.5px solid #111", borderRadius: 50,
            padding: "16px 0", fontSize: 16, fontWeight: 800,
            cursor: "pointer", boxShadow: "3px 3px 0px #111",
          }}>
            🎮 もう一度ゲームをする
          </button>
          <button onClick={onQuit} style={{
            width: "100%", background: "#fff", color: "#111",
            border: "2.5px solid #111", borderRadius: 50,
            padding: "16px 0", fontSize: 16, fontWeight: 800,
            cursor: "pointer", boxShadow: "3px 3px 0px #111",
          }}>
            やめる
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VotePage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"collect" | "vote">("collect");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [votedId, setVotedId] = useState<string | null>(null);
  const [hasAdded, setHasAdded] = useState(false);
  const [isWinner, setIsWinner] = useState(false);

  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => b.votes - a.votes);
  }, [candidates]);

  const handleAdd = (musicName: string) => {
    setCandidates((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, musicName, votes: 0 },
    ]);
    setHasAdded(true);
  };

  const handleVote = (id: string) => {
    if (votedId !== null) return;
    setVotedId(id);
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, votes: c.votes + 1 } : c))
    );
  };

  const handleFinish = () => {
    setIsWinner(true);
    setPhase("vote");
  };

  const handleHome = () => navigate("/");
  const handlePlayAgain = () => navigate("/game");
  const handleQuit = () => navigate("/");

  if (phase === "collect") {
    return (
      <AdditionalView
        onAdd={handleAdd}
        canFinish={candidates.length > 0}
        onFinish={handleFinish}
        onPlayAgain={handlePlayAgain}
        hasAdded={hasAdded}
        onHome={handleHome}
      />
    );
  }

  return (
    <RankingView
      candidates={sortedCandidates}
      onVote={handleVote}
      votedId={votedId}
      onPlayAgain={handlePlayAgain}
      onQuit={handleQuit}
      isWinner={isWinner}
      onHome={handleHome}
    />
  );
}