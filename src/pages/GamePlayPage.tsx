import { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { doc, onSnapshot, runTransaction, serverTimestamp, type Transaction } from "firebase/firestore";
import TapGame from "./TapGame";
import RayStack from "./RayStack";
import HitAndBlow from "./HitAndBlow";
import CardGamePage from "./cardGame/CardGamePage";
import { APP_ID, STORAGE_KEYS } from "../appConfig";
import { db, ensureAuth } from "../firebase";

export default function GamePlayPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const gameKey = params.get("game") ?? "tap";
  const matchId = params.get("matchId") ?? "";

  const handleFinished = useCallback(
    async (payload?: { tries?: number } | number) => {
    if (!matchId) {
      navigate("/result");
      return;
    }

    try {
      const tenpoId = localStorage.getItem(STORAGE_KEYS.tenpoId) ?? "";
      if (!tenpoId) return;
      const user = await ensureAuth();
      const matchRef = doc(
        db,
        `apps/${APP_ID}/general/${tenpoId}/matches/${matchId}`
      );

      await runTransaction(db, async (tx: Transaction) => {
        const snap = await tx.get(matchRef);
        if (!snap.exists()) return;
        const current = snap.data() as {
          status?: string;
          members?: Record<string, any>;
          memberIds?: string[];
        };
        if (current.status === "ended") return;

        if (gameKey === "hitblow") {
          const tries =
            typeof payload === "number" ? payload : payload?.tries ?? null;
          const members = { ...(current.members ?? {}) };
          const existing = members[user.uid] ?? {};
          members[user.uid] = {
            ...existing,
            hitblowTries: tries,
            hitblowFinishedAt: serverTimestamp(),
          };

          const otherId = (current.memberIds ?? []).find((id) => id !== user.uid) ?? null;
          const other = otherId ? members[otherId] : null;
          const otherTries = other?.hitblowTries ?? null;

          if (tries != null && otherTries != null) {
            const winnerUserId =
              tries === otherTries
                ? null
                : tries < otherTries
                ? user.uid
                : otherId ?? null;
            tx.update(matchRef, {
              status: "ended",
              winnerUserId,
              isDraw: tries === otherTries,
              members,
              updatedAt: serverTimestamp(),
            });
          } else {
            tx.update(matchRef, {
              members,
              updatedAt: serverTimestamp(),
            });
          }
          return;
        }

        // タップ・エイ積みなどスコア系ゲーム
        const score = typeof payload === "number" ? payload : 0;
        const members = { ...(current.members ?? {}) };
        const existing = members[user.uid] ?? {};
        members[user.uid] = {
          ...existing,
          score,
          scoreFinishedAt: serverTimestamp(),
        };

        const otherId = (current.memberIds ?? []).find((id) => id !== user.uid) ?? null;
        const other = otherId ? members[otherId] : null;
        const otherScore = other?.score ?? null;

        if (otherScore != null) {
          // 両者のスコアが揃った → 勝敗判定
          const winnerUserId =
            score === otherScore ? null : score > otherScore ? user.uid : otherId ?? null;
          tx.update(matchRef, {
            status: "ended",
            winnerUserId,
            isDraw: score === otherScore,
            members,
            updatedAt: serverTimestamp(),
          });
        } else {
          // まだ相手のスコアが来ていない
          tx.update(matchRef, {
            members,
            updatedAt: serverTimestamp(),
          });
        }
      });
    } catch (error) {
      console.warn("finish match update failed", error);
    } finally {
      navigate(`/result?matchId=${encodeURIComponent(matchId)}`);
    }
  }, [gameKey, matchId, navigate]);

  useEffect(() => {
    if (!matchId) return;
    const tenpoId = localStorage.getItem(STORAGE_KEYS.tenpoId) ?? "";
    if (!tenpoId) return;
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
      return <RayStack onFinished={handleFinished} />;
    }
    if (gameKey === "hitblow") {
      return <HitAndBlow onFinished={handleFinished} />;
    }
    return <TapGame onFinished={handleFinished} />;
  }, [gameKey, handleFinished, matchId]);

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <span style={headerTitleStyle}>Now Playing</span>
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

const contentStyle: React.CSSProperties = {
  flex: 1,
  background: "#f8fafc",
};
