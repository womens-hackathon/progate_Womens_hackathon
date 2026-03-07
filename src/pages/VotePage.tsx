<<<<<<< HEAD
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
=======
import React, { useMemo, useState } from "react";
>>>>>>> origin/main

type Candidate = {
  id: string;
  musicName: string;
  votes: number;
};

<<<<<<< HEAD
=======
// AdditionalView に渡す props
>>>>>>> origin/main
type AdditionalViewProps = {
  onAdd: (musicName: string) => void;
  onFinish: () => void;
  canFinish: boolean;
<<<<<<< HEAD
  onPlayAgain: () => void;
  hasAdded: boolean;
};

=======
};

// RankingView に渡す props
>>>>>>> origin/main
type RankingViewProps = {
  candidates: Candidate[];
  onVote: (id: string) => void;
  votedId: string | null;
<<<<<<< HEAD
  onPlayAgain: () => void;
  onQuit: () => void;
  isWinner: boolean;
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

      {/* Homeボタン */}
      <button
      onClick={onHome}
      style={{
        background: "#fff",
        color: "#ff3344",
        border: "2px solid #ff3344",
        borderRadius: 8,
        padding: "6px 14px",
        fontSize: 13,
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
function AdditionalView({ onAdd, onFinish, canFinish, onPlayAgain, hasAdded }: AdditionalViewProps) {
=======
};


// 曲の追加画面（勝者）
function AdditionalView({ onAdd, onFinish, canFinish }: AdditionalViewProps) {
>>>>>>> origin/main
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const name = input.trim();
<<<<<<< HEAD
    if (!name || hasAdded) return;
=======
    if (!name) return;
>>>>>>> origin/main
    onAdd(name);
    setInput("");
  };

  return (
<<<<<<< HEAD
    <div style={{
      height: "100vh", overflowY: "auto", background: "#ffffff",
      display: "flex", flexDirection: "column", alignItems: "center",
      fontFamily: "'Helvetica Neue', Arial, sans-serif",width: "100%",boxSizing: "border-box",
    }}>
      <Header />

      <div style={{ width: "100%", padding: "16px 12px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#888", textAlign: "center", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            🏆 Winner
          </p>
          <h1 style={{ fontSize: 26, fontWeight: 900, textAlign: "center", color: "#111", marginTop: 4 }}>
            曲のリクエスト
          </h1>
        </div>

        <div style={{
          background: "#fff", border: "2.5px solid #111", borderRadius: 20,
          padding: "20px 16px", boxShadow: "4px 4px 0px #111",
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            アーティスト名 / 曲名
          </p>
          <input
            style={{
              width: "100%", border: "2px solid #111", borderRadius: 12,
              padding: "12px 14px", fontSize: 16, fontWeight: 600, outline: "none",
              marginBottom: 12, boxSizing: "border-box", background: "#f9f9f9", color: "#111",
            }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="例：夜に駆ける / YOASOBI"
            disabled={hasAdded}
          />
          <button
            onClick={handleAdd}
            disabled={!input.trim() || hasAdded}
            style={{
              width: "100%",
              background: !input.trim() || hasAdded ? "#ccc" : "#ff3344",
              color: "#fff", border: "2.5px solid #111", borderRadius: 50,
              padding: "14px 0", fontSize: 16, fontWeight: 800,
              cursor: !input.trim() || hasAdded ? "not-allowed" : "pointer",
              boxShadow: !input.trim() || hasAdded ? "none" : "3px 3px 0px #111",
            }}
          >
            {hasAdded ? "✓ 追加済み" : "＋ 追加する"}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            onClick={canFinish ? onFinish : undefined}
            disabled={!canFinish}
            style={{
              width: "100%",
              background: canFinish ? "#ffd500" : "#ccc",
              color: "#111", border: "2.5px solid #111", borderRadius: 50,
              padding: "16px 0", fontSize: 16, fontWeight: 800,
              cursor: canFinish ? "pointer" : "not-allowed",
              boxShadow: canFinish ? "3px 3px 0px #111" : "none",
            }}
          >
            🏆 ランキングを見る
          </button>
          <button
            onClick={onPlayAgain}
            style={{
              width: "100%", background: "#fff", color: "#111",
              border: "2.5px solid #111", borderRadius: 50,
              padding: "16px 0", fontSize: 16, fontWeight: 800,
              cursor: "pointer", boxShadow: "3px 3px 0px #111",
            }}
          >
            🎮 もう一度ゲームをする
          </button>
        </div>
      </div>
=======
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">曲を追加</h1>

      <input
        className="border rounded p-2 w-full mb-2"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="曲名を入力"
      />

      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={handleAdd}
      >
        追加
      </button>

      <button
        className={`text-white px-4 py-2 rounded mt-4 w-full ${
          canFinish ? "bg-gray-500" : "bg-gray-300 cursor-not-allowed"
        }`}
        onClick={onFinish}
        disabled={!canFinish}
      >
        ランキングを見る
      </button>
>>>>>>> origin/main
    </div>
  );
}

<<<<<<< HEAD
// ランキング＋投票画面
function RankingView({ candidates, onVote, votedId, onPlayAgain, onQuit, isWinner }: RankingViewProps) {
  const maxVotes = Math.max(...candidates.map((c) => c.votes), 1);
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div style={{
      height: "100vh", overflowY: "auto", background: "#ffffff",
      display: "flex", flexDirection: "column", alignItems: "center",
      fontFamily: "'Helvetica Neue', Arial, sans-serif",width: "100%",boxSizing: "border-box",
    }}>
      <Header />

      <div style={{ width: "100%", padding: "16px 12px", display: "flex", flexDirection: "column", gap: 16 }}>
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
                  background: isMyVote ? "#ffffff" : "transparent",
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

// メインコンポーネント
export default function VotePage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"collect" | "vote">("collect");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [votedId, setVotedId] = useState<string | null>(null);
  const [hasAdded, setHasAdded] = useState(false);
  const [isWinner, setIsWinner] = useState(false);

=======

// ランキング＋投票画面（敗者）
function RankingView({ candidates, onVote, votedId }: RankingViewProps) {
  return (
    <ul className="p-4 space-y-2">
      {candidates.map((c, idx) => (
        <li key={c.id} className="flex items-center gap-3 border-b pb-2">
          <div className="w-10 font-bold">{idx + 1}位</div>

          <div className="flex-1">
            <div className="font-semibold">{c.musicName}</div>
            <div className="text-sm opacity-70">{c.votes}票</div>
          </div>

          <button
            className={`px-3 py-1 rounded ${
              votedId !== null ? "bg-gray-300" : "bg-green-500 text-white"
            }`}
            onClick={() => onVote(c.id)}
            disabled={votedId !== null}
          >
            {votedId === c.id ? "✓ 投票済" : "投票"}
          </button>
        </li>
      ))}
    </ul>
  );
}


// メインコンポーネント
export default function VotePage() {
  const [phase, setPhase] = useState<"collect" | "vote">("collect");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [votedId, setVotedId] = useState<string | null>(null);

  // 得票数の降順でソートしたリスト（candidatesが変わった時だけ再計算）
  // ※ Firestoreに繋いだ後はこのソートは不要になる予定
>>>>>>> origin/main
  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => b.votes - a.votes);
  }, [candidates]);

<<<<<<< HEAD
  const handleAdd = (musicName: string) => {
    setCandidates((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,musicName,votes: 0  },
    ]);
    setHasAdded(true);
  };

=======
  // 曲を追加する（AdditionalViewから呼ばれる）
  // ※ Firestore連携後は addDoc() に差し替える
  const handleAdd = (musicName: string) => {
    setCandidates((prev) => [
      ...prev,
      { id: crypto.randomUUID(), musicName, votes: 0 },
    ]);
  };

  // 投票する（RankingViewから呼ばれる）
  // ※ Firestore連携後は setDoc() に差し替える
>>>>>>> origin/main
  const handleVote = (id: string) => {
    if (votedId !== null) return;
    setVotedId(id);
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, votes: c.votes + 1 } : c))
    );
  };

<<<<<<< HEAD
  const handleFinish = () => {
    setIsWinner(true);
    setPhase("vote");
  };

  const handlePlayAgain = () => navigate("/game");
  const handleQuit = () => navigate("/");

=======
>>>>>>> origin/main
  if (phase === "collect") {
    return (
      <AdditionalView
        onAdd={handleAdd}
        canFinish={candidates.length > 0}
<<<<<<< HEAD
        onFinish={handleFinish}
        onPlayAgain={handlePlayAgain}
        hasAdded={hasAdded}
=======
        onFinish={() => setPhase("vote")}
>>>>>>> origin/main
      />
    );
  }

  return (
    <RankingView
      candidates={sortedCandidates}
      onVote={handleVote}
      votedId={votedId}
<<<<<<< HEAD
      onPlayAgain={handlePlayAgain}
      onQuit={handleQuit}
      isWinner={isWinner}
=======
>>>>>>> origin/main
    />
  );
}