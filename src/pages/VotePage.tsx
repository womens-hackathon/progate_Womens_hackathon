import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { db } from "../firebase";
import { doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";

// --- 型定義 ---
type Candidate = {
  id: string;
  musicName: string;
  votes: number;
  previewUrl?: string;
};

type RankingData = {
  updatedAt: any;
  musics: { [musicId: string]: any };
};

type ITunesTrack = {
  trackId: number;
  trackName: string;
  artistName: string;
  artworkUrl100?: string;
  previewUrl?: string;
};

const APP_ID = 'first_app';

// --- 共通ヘッダー ---
function Header({ onHome }: { onHome: () => void }) {
  return (
    <div style={{
      width: "100%", background: "#fff", borderBottom: "2px solid #111",
      padding: "16px 20px", position: "sticky", top: 0, zIndex: 10,
      display: "flex", justifyContent: "space-between", alignItems: "center", boxSizing: "border-box",
    }}>
      <span style={{ fontSize: 20, fontWeight: 900, fontStyle: "italic", color: "#111", letterSpacing: "-0.02em" }}>
        Request the BGM
      </span>
      <button onClick={onHome} style={{
        background: "#fff", color: "#ff3344", border: "1.5px solid #ff3344",
        borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 800, cursor: "pointer",
      }}>
        Home
      </button>
    </div>
  );
}

// --- 曲の追加画面 ---
function AdditionalView({ onAdd, onFinish, canFinish, onPlayAgain, hasAdded, onHome }: any) {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<ITunesTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState("");

  const handleSearch = async (keyword: string) => {
    const q = keyword.trim();
    if (!q || hasAdded) { setResults([]); setSearched(false); return; }
    try {
      setLoading(true); setSearched(true);
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&country=JP&limit=10`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (hasAdded) return;
    const timer = setTimeout(() => handleSearch(input), 350);
    return () => clearTimeout(timer);
  }, [input]);

  const handleSelect = (track: ITunesTrack) => {
    if (hasAdded) return;
    onAdd(track);
    setInput(`${track.trackName} / ${track.artistName}`);
    setSelectedArtwork(track.artworkUrl100?.replace("100x100bb", "600x600bb") || "");
    setResults([]);
    setSearched(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "'Helvetica Neue', Arial, sans-serif", width: "100%" }}>
      <Header onHome={onHome} />
      <div style={{ width: "100%", maxWidth: 480, margin: "0 auto", padding: "16px 16px 24px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#888", textAlign: "center", letterSpacing: "0.05em", textTransform: "uppercase" }}>🏆 Winner</p>
          <h1 style={{ fontSize: 26, fontWeight: 900, textAlign: "center", color: "#111", marginTop: 4 }}>曲のリクエスト</h1>
        </div>

        <div style={{ background: "#fff", border: "2.5px solid #111", borderRadius: 20, padding: "20px 16px", boxShadow: "4px 4px 0px #111" }}>
          {hasAdded && selectedArtwork && (
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <img src={selectedArtwork} alt="selected" style={{ width: 210, height: 210, objectFit: "cover", border: "1px solid #eee", background: "#f1f1f1" }} />
            </div>
          )}
          <p style={{ fontSize: 13, fontWeight: 700, color: "#888", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>曲名 / アーティスト名</p>
          <input
            style={{ width: "100%", border: "2px solid #111", borderRadius: 12, padding: "12px 14px", fontSize: 16, fontWeight: 600, outline: "none", marginBottom: 12, boxSizing: "border-box", background: "#f9f9f9", color: "#111" }}
            value={input} onChange={(e) => setInput(e.target.value)} placeholder="例：夜に駆ける / YOASOBI" disabled={hasAdded}
          />
          {hasAdded ? (
            <button disabled style={{ width: "100%", background: "#ccc", color: "#fff", border: "2.5px solid #111", borderRadius: 50, padding: "14px 0", fontSize: 16, fontWeight: 800 }}>✓ 追加済み</button>
          ) : results.length > 0 && (
            <div style={{ marginTop: 14, border: "2px solid #111", borderRadius: 16, overflow: "hidden", background: "#fff" }}>
              {results.map((track, idx) => (
                <button key={track.trackId} onClick={() => handleSelect(track)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px", background: "#fff", border: "none", borderBottom: idx < results.length - 1 ? "1.5px solid #eee" : "none", textAlign: "left" }}>
                  <img src={track.artworkUrl100} style={{ width: 56, height: 56, borderRadius: 10, border: "1px solid #ddd" }} alt="" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="truncate" style={{ fontSize: 15, fontWeight: 800, color: "#111" }}>{track.trackName}</div>
                    <div className="truncate" style={{ fontSize: 13, color: "#666", marginTop: 4 }}>{track.artistName}</div>
                  </div>
                  <div style={{ color: "#ff3344", fontSize: 12, fontWeight: 800, border: "1.5px solid #ff3344", borderRadius: 999, padding: "6px 10px" }}>選択</div>
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={onFinish} disabled={!canFinish} style={{ width: "100%", background: canFinish ? "#ffd500" : "#ccc", color: "#111", border: "2.5px solid #111", borderRadius: 50, padding: "16px 0", fontSize: 16, fontWeight: 800, cursor: canFinish ? "pointer" : "not-allowed", boxShadow: canFinish ? "3px 3px 0px #111" : "none" }}>🏆 ランキングを見る</button>
          <button onClick={onPlayAgain} style={{ width: "100%", background: "#fff", color: "#111", border: "2.5px solid #111", borderRadius: 50, padding: "16px 0", fontSize: 16, fontWeight: 800, boxShadow: "3px 3px 0px #111" }}>🎮 もう一度ゲームをする</button>
        </div>
      </div>
    </div>
  );
}

// --- ランキング＋投票画面 ---
function RankingView({ candidates, onVote, votedId, onPlayAgain, onQuit, isWinner, onHome, playingId, onTogglePreview }: any) {
  const maxVotes = Math.max(...candidates.map((c: any) => c.votes), 1);
  const medals = ["🥇", "🥈", "🥉"];

  const handleShare = () => {
    const shopName = "Request the BGM";
    const mySong = candidates.find((c: any) => c.id === votedId)?.musicName || (candidates.length > 0 ? candidates[0].musicName : "曲");
    const text = `${shopName}で「${mySong}」をリクエストしました！🎵 #BGMリクエスト`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "'Helvetica Neue', Arial, sans-serif", width: "100%" }}>
      <Header onHome={onHome} />
      <div style={{ width: "100%", maxWidth: 480, margin: "0 auto", padding: "16px 16px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#888", textAlign: "center", textTransform: "uppercase" }}>🎵 BGM Ranking</p>
          <h1 style={{ fontSize: 26, fontWeight: 900, textAlign: "center", color: "#111", marginTop: 4 }}>{isWinner ? "ランキング" : votedId ? "投票済み！" : "投票しよう"}</h1>
        </div>

        <div style={{ background: "#fff", border: "2.5px solid #111", borderRadius: 20, padding: "8px 0", boxShadow: "4px 4px 0px #111" }}>
          {candidates.map((c: any, idx: number) => {
            const pct = Math.round((c.votes / maxVotes) * 100);
            return (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: idx < candidates.length - 1 ? "1.5px solid #eee" : "none", background: votedId === c.id ? "#fff5f5" : "transparent" }}>
                <div style={{ width: 32, textAlign: "center", fontSize: idx < 3 ? 22 : 14, fontWeight: 900 }}>{idx < 3 ? medals[idx] : idx + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="truncate" style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{c.musicName}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <div style={{ flex: 1, height: 6, background: "#eee", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: votedId === c.id ? "#ff3344" : "#111", borderRadius: 99, transition: "width 0.5s" }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#888" }}>{c.votes}票</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {c.previewUrl && (
                    <button onClick={() => onTogglePreview(c)} style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #111", background: "#fff", boxShadow: "2px 2px 0px #111", padding: 0 }}>
                      {playingId === c.id ? "■" : "▶"}
                    </button>
                  )}
                  {!isWinner && (
                    <button onClick={() => onVote(c.id)} disabled={votedId !== null} style={{ background: votedId === c.id ? "#eee" : "#ff3344", color: votedId === c.id ? "#aaa" : "#fff", border: "2px solid #111", borderRadius: 50, padding: "6px 14px", fontSize: 13, fontWeight: 800 }}>
                      {votedId === c.id ? "✓" : "投票"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <button onClick={onPlayAgain} style={{ width: "100%", background: "#ffd500", color: "#111", border: "2.5px solid #111", borderRadius: 50, padding: "16px 0", fontSize: 16, fontWeight: 800, boxShadow: "3px 3px 0px #111" }}>🎮 もう一度ゲームをする</button>
          <button onClick={handleShare} style={{ width: "100%", background: "#1d9bf0", color: "#fff", border: "2.5px solid #111", borderRadius: 50, padding: "16px 0", fontSize: 16, fontWeight: 800, boxShadow: "3px 3px 0px #111" }}>🐦 X(Twitter)でシェアする</button>
          <button onClick={onQuit} style={{ width: "100%", background: "#fff", color: "#111", border: "2.5px solid #111", borderRadius: 50, padding: "16px 0", fontSize: 16, fontWeight: 800, boxShadow: "3px 3px 0px #111" }}>シェアする</button>
        </div>
      </div>
    </div>
  );
}

// --- メインコンポーネント ---
export default function VotePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [phase, setPhase] = useState<"collect" | "vote">(searchParams.get("mode") === "vote" ? "vote" : "collect");
  
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [votedId, setVotedId] = useState<string | null>(null);
  const [hasAdded, setHasAdded] = useState(false);
  const [isWinner, setIsWinner] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audio] = useState(() => new Audio());

  // 【デバッグ】localStorageの値を確認
  const rawTenpoId = localStorage.getItem('tenpoId');
  const tenpoId = rawTenpoId || 'uRx7q3pd02WxtzQ3OaK9WCtRsp92';
  const rankingId = 'today';

  useEffect(() => {
    console.log("🛠 [Debug] Initializing VotePage");
    console.log("🛠 [Debug] tenpoId from localStorage:", rawTenpoId);
    console.log("🛠 [Debug] Using tenpoId:", tenpoId);
    
    // 【重要】パスの階層が正しいか、コンソールでリンクをクリックして確認できるように出力
    const path = `apps/first_app/general/public_rankings/${tenpoId}/${rankingId}`;
    console.log("🛠 [Debug] Subscribing to Firestore path:", path);

    const rankingRef = doc(db, 'apps',  APP_ID, 'general', tenpoId, 'public_rankings', rankingId);
    
    const unsubscribe = onSnapshot(rankingRef, (docSnap) => {
      if (docSnap.exists()) {
        console.log("✅ [Debug] Snapshot received data:", docSnap.data());
        const data = docSnap.data() as RankingData;
        const musicsArray = Object.values(data.musics || {}).map((m: any) => ({
          id: m.musicId,
          musicName: m.musicName,
          votes: m.musicPoints || 0,
          previewUrl: m.previewUrl
        }));
        setCandidates(musicsArray);
      } else {
        console.warn("⚠️ [Debug] Document does not exist at path:", path);
      }
    }, (error) => {
      console.error("❌ [Debug] Snapshot error (Permission Denied?):", error);
      console.error("❌ [Debug] Error path:", path);
    });

    return () => unsubscribe();
  }, [tenpoId]);

  const sortedCandidates = useMemo(() => [...candidates].sort((a, b) => b.votes - a.votes), [candidates]);

  const handleAdd = async (track: ITunesTrack) => {
    const musicId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const musicName = `${track.trackName} / ${track.artistName}`;
    
    console.log("🛠 [Debug] Attempting to add music:", musicName);
    const rankingRef = doc(db, 'apps',  APP_ID, 'general', tenpoId, 'public_rankings', rankingId);
    
    try {
      const docSnap = await getDoc(rankingRef);
      const currentMusics = docSnap.exists() ? docSnap.data().musics : {};

      await setDoc(rankingRef, {
        updatedAt: new Date(),
        musics: { ...currentMusics, [musicId]: { musicId, musicName, musicPoints: 0, previewUrl: track.previewUrl || "" } }
      }, { merge: true });
      
      console.log("✅ [Debug] Music added successfully");
      setHasAdded(true);
    } catch (error) {
      console.error("❌ [Debug] Error adding music:", error);
    }
  };

  const handleVote = async (id: string) => {
    if (votedId !== null) return;
    console.log("🛠 [Debug] Attempting to vote for ID:", id);
    
    setVotedId(id);
    const rankingRef = doc(db, 'apps',  APP_ID, 'general', tenpoId, 'public_rankings', rankingId);
    
    try {
      const docSnap = await getDoc(rankingRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const target = data.musics[id];
        if (target) {
          await setDoc(rankingRef, { musics: { ...data.musics, [id]: { ...target, musicPoints: (target.musicPoints || 0) + 1 } } }, { merge: true });
          console.log("✅ [Debug] Vote registered successfully");
        }
      }
    } catch (error) {
      console.error("❌ [Debug] Error voting:", error);
      setVotedId(null); // エラー時は投票状態を戻す
    }
  };

  const handleTogglePreview = (candidate: Candidate) => {
    if (!candidate.previewUrl) return;
    if (playingId === candidate.id) { audio.pause(); setPlayingId(null); return; }
    audio.src = candidate.previewUrl;
    audio.play();
    setPlayingId(candidate.id);
    audio.onended = () => setPlayingId(null);
  };

  if (phase === "collect") {
    return <AdditionalView onAdd={handleAdd} canFinish={candidates.length > 0} onFinish={() => { setIsWinner(true); setPhase("vote"); }} onPlayAgain={() => navigate("/games")} hasAdded={hasAdded} onHome={() => navigate("/")} />;
  }

  return <RankingView candidates={sortedCandidates} onVote={handleVote} votedId={votedId} onPlayAgain={() => navigate("/games")} onQuit={() => navigate("/ranking")} isWinner={isWinner} onHome={() => navigate("/")} playingId={playingId} onTogglePreview={handleTogglePreview} />;
}