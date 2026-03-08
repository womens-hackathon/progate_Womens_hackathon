import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db, ensureAuth } from "../firebase";
import { APP_ID, STORAGE_KEYS } from "../appConfig";

type ResultState = "loading" | "waiting" | "win" | "lose" | "draw" | "error";

export default function ResultPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [state, setState] = useState<ResultState>("loading");
  const [errorText, setErrorText] = useState("");

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
    let unsub = () => {};

    (async () => {
      try {
        const user = await ensureAuth();
        const matchRef = doc(db, `apps/${APP_ID}/general/${tenpoId}/matches/${matchId}`);
        unsub = onSnapshot(matchRef, (snap) => {
          if (!snap.exists()) {
            setState("error");
            setErrorText("マッチが見つかりません");
            return;
          }
          const data = snap.data() as { status?: string; winnerUserId?: string | null };
          if (data.status !== "ended") {
            setState("waiting");
            return;
          }
          if (!data.winnerUserId) {
            setState("draw");
            return;
          }
          setState(data.winnerUserId === user.uid ? "win" : "lose");
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
          {state === "draw" && "引き分け（両方負け）"}
          {state === "error" && "エラー"}
        </h1>
        {(state === "waiting" || state === "loading") && (
          <p style={descStyle}>対戦結果を確認しています</p>
        )}
        {state === "error" && <p style={descStyle}>{errorText}</p>}

        <button onClick={() => navigate("/vote")} style={primaryButtonStyle}>
          次へ
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
