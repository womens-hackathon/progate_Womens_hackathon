import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { collection, doc, getDocs, onSnapshot } from "firebase/firestore";
import { db, ensureAuth } from "../firebase";
import { APP_ID, STORAGE_KEYS } from "../appConfig";

type ResultState = "loading" | "waiting" | "win" | "lose" | "draw" | "error";

interface ScoreEntry { uid: string; score: number; nickname?: string }

export default function ResultPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [state, setState] = useState<ResultState>("loading");
  const [errorText, setErrorText] = useState("");
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [myUid, setMyUid] = useState<string>("");

  const matchId = useMemo(
    () => params.get("matchId") ?? localStorage.getItem(STORAGE_KEYS.matchId) ?? "",
    [params]
  );

  useEffect(() => {
    if (!matchId) {
      setState("error");
      setErrorText("matchId が見つかりません");
      return;
    }

    const tenpoId = localStorage.getItem(STORAGE_KEYS.tenpoId) ?? "default";
    const matchPath = `apps/${APP_ID}/general/${tenpoId}/matches/${matchId}`;
    let unsub = () => {};

    (async () => {
      try {
        const user = await ensureAuth();
        setMyUid(user.uid);
        const matchRef = doc(db, matchPath);
        unsub = onSnapshot(matchRef, async (snap) => {
          if (!snap.exists()) {
            setState("error");
            setErrorText("マッチが見つかりません");
            return;
          }
          const data = snap.data() as {
            status?: string;
            winnerUserId?: string | null;
            isDraw?: boolean;
            members?: Record<string, { nickname?: string }>;
          };
          if (data.status !== "ended" || (!data.winnerUserId && !data.isDraw)) {
            setState("waiting");
            return;
          }
          if (data.isDraw) {
            setState("draw");
          } else {
            setState(data.winnerUserId === user.uid ? "win" : "lose");
          }

          // スコアを取得
          try {
            const scoresSnap = await getDocs(collection(db, `${matchPath}/scores`));
            const entries: ScoreEntry[] = scoresSnap.docs.map((d) => {
              const s = d.data() as { uid: string; score: number };
              const nickname = data.members?.[s.uid]?.nickname;
              return { uid: s.uid, score: s.score, nickname };
            });
            setScores(entries);
          } catch {
            // スコア取得失敗は無視
          }
        });
      } catch (error) {
        console.error(error);
        setState("error");
        setErrorText("結果の取得に失敗しました");
      }
    })();

    return () => unsub();
  }, [matchId]);

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <p style={eyebrowStyle}>Result</p>
        <h1 style={titleStyle}>
          {state === "loading" && "読み込み中..."}
          {state === "waiting" && "結果待ち"}
          {state === "win" && "勝ち！"}
          {state === "lose" && "負け…"}
          {state === "draw" && "引き分け"}
          {state === "error" && "エラー"}
        </h1>
        {(state === "waiting" || state === "loading") && (
          <p style={descStyle}>対戦結果を確認しています</p>
        )}
        {state === "error" && <p style={descStyle}>{errorText}</p>}

        {scores.length > 0 && (
          <div style={scoresContainerStyle}>
            {scores.map((entry) => (
              <div key={entry.uid} style={scoreRowStyle}>
                <span style={scoreNicknameStyle}>
                  {entry.uid === myUid ? "あなた" : (entry.nickname ?? "相手")}
                </span>
                <span style={scoreValueStyle}>{entry.score}</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => {
            if (state === "win") {
              const hasAdded = localStorage.getItem(STORAGE_KEYS.songAdded);
              if (!hasAdded) {
                localStorage.setItem(STORAGE_KEYS.songAdded, "true");
                navigate("/vote");
              } else {
                navigate("/vote?mode=vote&votes=2");
              }
            } else {
              // lose or draw → 投票画面
              navigate("/vote?mode=vote");
            }
          }}
          style={primaryButtonStyle}
        >
          次へ進む
        </button>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: 24,
  background: "#0f172a",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 420,
  background: "#111827",
  color: "#fff",
  border: "2px solid #fff",
  borderRadius: 20,
  padding: 24,
  display: "flex",
  flexDirection: "column",
  gap: 16,
  textAlign: "center",
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  color: "#38bdf8",
  margin: 0,
};

const titleStyle: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 900,
  margin: 0,
};

const descStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#e2e8f0",
  margin: 0,
};

const scoresContainerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 12,
  padding: "12px 16px",
};

const scoreRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const scoreNicknameStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#e2e8f0",
};

const scoreValueStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 900,
  color: "#38bdf8",
};

const primaryButtonStyle: React.CSSProperties = {
  width: "100%",
  background: "#38bdf8",
  color: "#0f172a",
  border: "2px solid #fff",
  borderRadius: 999,
  padding: "12px 0",
  fontSize: 16,
  fontWeight: 800,
  cursor: "pointer",
};
