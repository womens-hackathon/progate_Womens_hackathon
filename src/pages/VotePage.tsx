import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/database";
import { STORAGE_KEYS } from "../appConfig";

type Candidate = {
  id: string;
  musicName: string;
  votes: number;
  previewUrl?: string;
};

type AdditionalViewProps = {
  onAdd: (track: ITunesTrack) => void;
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
  playingId: string | null;
  onTogglePreview: (candidate: Candidate) => void;
};

type ITunesTrack = {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
  previewUrl?: string;
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
  const [selectedArtwork, setSelectedArtwork] = useState("");

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
        `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&country=JP&limit=10`
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

    onAdd(track);

    const selectedMusic = `${track.trackName} / ${track.artistName}`;

    setInput(selectedMusic);

    setSelectedArtwork(
      track.artworkUrl100?.replace("100x100bb", "600x600bb") || ""
    );

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

          {hasAdded && selectedArtwork && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <img
                src={selectedArtwork}
                alt="selected artwork"
                style={{
                  width: 210,
                  height: 210,
                  objectFit: "cover",
                  border: "1px solid #eee",
                  background: "#f1f1f1",
                }}
              />
            </div>
          )}

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

                  <div style={{ flex: 1, minWidth: 0 }}>
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
function RankingView({
  candidates,
  onVote,
  votedId,
  onPlayAgain,
  onQuit,
  isWinner,
  onHome,
  playingId,
  onTogglePreview,
}: RankingViewProps) {

  const maxVotes = Math.max(...candidates.map((c) => c.votes), 1);
  const medals = ["🥇", "🥈", "🥉"];

  const handleShare = () => {
    const shopName = "Request the BGM"; // 実際の店名があればここを書き換え
    const shopUrl = window.location.origin; // 現在のサイトのURL
    
    // 自分が投票した曲、または最後に追加した曲を探す
    const mySong = candidates.find(c => c.id === votedId)?.musicName || 
    (candidates.length > 0 ? candidates[candidates.length - 1].musicName : "素敵な曲");
    
    const text = `${shopName}で「${mySong}」をリクエストしました！🎵\nみんなも投票してね！ #BGMリクエスト #ハッカソン`;
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shopUrl)}`;
    
    window.open(twitterUrl, "_blank", "noreferrer");
  };

  return (
  <div style={{
    height: "100vh",
    background: "#ffffff",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
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
  flex: 1,
  minHeight: 0,
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

        <div
  style={{
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
  }}
  >
    <div
    style={{
    background: "#fff",
    border: "2.5px solid #111",
    borderRadius: 20,
    padding: "8px 0",
    boxShadow: "4px 4px 0px #111",
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
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderBottom: idx < candidates.length - 1 ? "1.5px solid #eee" : "none",
                  background: isMyVote ? "#fff5f5" : "transparent",
                }}>

                  <div style={{
                    width: 32,
                    textAlign: "center",
                    fontSize: idx < 3 ? 22 : 14,
                    fontWeight: 900,
                    color: "#111",
                    flexShrink: 0
                  }}>
                    {idx < 3 ? medals[idx] : `${idx + 1}`}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#111",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {c.musicName}
                    </div>

                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 4
                    }}>

                      <div style={{
                        flex: 1,
                        height: 6,
                        background: "#eee",
                        borderRadius: 99,
                        overflow: "hidden"
                      }}>
                        <div style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: isMyVote ? "#ff3344" : "#111",
                          borderRadius: 99,
                          transition: "width 0.5s"
                        }} />
                      </div>

                      <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#888",
                        flexShrink: 0
                      }}>
                        {c.votes}票
                      </span>

                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

                    {c.previewUrl && (
                      <button
  onClick={() => onTogglePreview(c)}
  style={{
    width: 28,
    height: 28,
    borderRadius: "50%",
    border: "2px solid #111",
    background: "#fff",
    cursor: "pointer",
    boxShadow: "2px 2px 0px #111",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  }}
>
  {playingId === c.id ? (
    <svg width="19" height="19" viewBox="0 0 24 24">
      <rect x="6" y="5" width="4" height="14" rx="1.5" fill="#111" />
      <rect x="14" y="5" width="4" height="14" rx="1.5" fill="#111" />
    </svg>
  ) : (
    <svg width="19" height="19" viewBox="0 0 24 24">
      <path d="M8 5.5C8 4.7 8.9 4.2 9.6 4.6L19 10.3C19.7 10.7 19.7 11.7 19 12.1L9.6 17.8C8.9 18.2 8 17.7 8 16.9V5.5Z" fill="#111"/>
    </svg>
  )}
</button>
                    )}

                    {!isWinner && (
                      isMyVote ? (
                        <div style={{
                          fontSize: 13,
                          fontWeight: 800,
                          color: "#ff3344",
                          border: "2px solid #ff3344",
                          borderRadius: 50,
                          padding: "6px 12px",
                          flexShrink: 0
                        }}>
                          ✓ 投票済
                        </div>
                      ) : (
                        <button
                          onClick={() => onVote(c.id)}
                          disabled={votedId !== null}
                          style={{
                            background: votedId !== null ? "#eee" : "#ff3344",
                            color: votedId !== null ? "#aaa" : "#fff",
                            border: "2px solid #111",
                            borderRadius: 50,
                            padding: "6px 14px",
                            fontSize: 13,
                            fontWeight: 800,
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

                </div>
              );

            })
          )}

                  </div>
        </div>

        {/* メインコンポーネント */}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          <button
            onClick={onPlayAgain}
            style={{
              width: "100%",
              background: "#ffd500",
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
          <button 
            onClick={handleShare}
            style={{
              width: "100%", background: "#1d9bf0", color: "#fff",
              border: "2.5px solid #111", borderRadius: 50,
              padding: "16px 0", fontSize: 16, fontWeight: 800,
              cursor: "pointer", boxShadow: "3px 3px 0px #111",
            }}
          >
            🐦 X(Twitter)でシェアする
          </button>

          <button
            onClick={onQuit}
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
            シェアする
          </button>

        </div>

      </div>
    </div>
  );
}

export default function VotePage() {

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [phase, setPhase] = useState<"collect" | "vote" | null>(null);
  const [isWinner, setIsWinner] = useState(false);
  const [loadingResult, setLoadingResult] = useState(true);
  
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [votedId, setVotedId] = useState<string | null>(null);
  const [hasAdded, setHasAdded] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audio] = useState(() => new Audio());

  //勝敗判定
  useEffect(() => {
  const decidePhase = async () => {
    try {
      const matchId = searchParams.get("matchId");
      const myUserId = localStorage.getItem(STORAGE_KEYS.userId);

      if (!matchId || !myUserId) {
        console.error("matchId または userId がありません");
        setPhase("vote");
        setIsWinner(false);
        return;
      }

      const matchRef = doc(db, "matches", matchId);
      const matchSnap = await getDoc(matchRef);

      if (!matchSnap.exists()) {
        console.error("match ドキュメントが存在しません");
        setPhase("vote");
        setIsWinner(false);
        return;
      }

      const matchData = matchSnap.data();
      const winnerUserId = matchData.winnerUserId;

      const winner = myUserId === winnerUserId;

      setIsWinner(winner);
      setPhase(winner ? "collect" : "vote");
    } catch (error) {
      console.error("勝敗判定に失敗しました", error);
      setIsWinner(false);
      setPhase("vote");
    } finally {
      setLoadingResult(false);
    }
  };

  decidePhase();
}, [searchParams]);

  useEffect(() => {
    return () => {
      audio.pause();
    };
  }, [audio]);

  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => b.votes - a.votes);
  }, [candidates]);

  const handleAdd = (track: ITunesTrack) => {

    const musicName = `${track.trackName} / ${track.artistName}`;

    setCandidates((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        musicName,
        votes: 0,
        previewUrl: track.previewUrl || ""
      }
    ]);

    setHasAdded(true);

  };

  const handleVote = (id: string) => {

    if (votedId !== null) return;

    setVotedId(id);

    setCandidates((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, votes: c.votes + 1 }
          : c
      )
    );

  };

  const handleTogglePreview = (candidate: Candidate) => {

    if (!candidate.previewUrl) return;

    if (playingId === candidate.id) {

      audio.pause();
      audio.currentTime = 0;
      setPlayingId(null);
      return;

    }

    audio.pause();
    audio.src = candidate.previewUrl;
    audio.currentTime = 0;
    audio.play();

    setPlayingId(candidate.id);

    audio.onended = () => {
      setPlayingId(null);
    };

  };

  const handleFinish = () => {
  setPhase("vote");
};

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.voteCandidates, JSON.stringify(candidates));
  }, [candidates]);

  const handleHome = () => navigate("/");
  const handlePlayAgain = () => navigate("/games");
  const handleQuit = () => navigate("/ranking");

  if (loadingResult || phase === null) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#fff",
        fontWeight: 700,
      }}
    >
      読み込み中...
    </div>
  );
}

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
      playingId={playingId}
      onTogglePreview={handleTogglePreview}
    />
  );
}
