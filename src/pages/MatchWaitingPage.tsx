import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db, ensureAuth } from "../firebase";
import { APP_ID, DEFAULT_TENPO_ID, STORAGE_KEYS } from "../appConfig";

type MatchState = "finding" | "waiting" | "matched" | "error";

export default function MatchWaitingPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [state, setState] = useState<MatchState>("finding");
  const [matchId, setMatchId] = useState<string | null>(null);
  const [errorText, setErrorText] = useState("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const userIdRef = useRef<string | null>(null);
  const matchIdRef = useRef<string | null>(null);
  const stateRef = useRef<MatchState>("finding");
  const countdownStartedRef = useRef(false);

  const gameKey = useMemo(() => {
    const fromQuery = params.get("game");
    if (fromQuery) return fromQuery;
    return localStorage.getItem(STORAGE_KEYS.gameKey) ?? "";
  }, [params]);

  const tenpoId = useMemo(() => {
    return (
      localStorage.getItem(STORAGE_KEYS.tenpoId) ?? DEFAULT_TENPO_ID
    );
  }, []);

  useEffect(() => {
    if (!gameKey) {
      navigate("/games");
      return;
    }

    const nickname = localStorage.getItem(STORAGE_KEYS.nickname);
    if (!nickname) {
      navigate("/");
      return;
    }

    let unsub = () => {};
    let active = true;

    const matchesPath = `apps/${APP_ID}/general/${tenpoId}/matches`;

    const startMatching = async () => {
      try {
        setState("finding");
        const user = await ensureAuth();
        userIdRef.current = user.uid;

        const matchesRef = collection(db, matchesPath);
        const waitingQuery = query(
          matchesRef,
          where("status", "==", "waiting"),
          where("gameKey", "==", gameKey),
          where("memberCount", "==", 1),
          limit(1)
        );

        const snapshot = await getDocs(waitingQuery);
        const matchDoc = snapshot.docs[0];

        if (matchDoc) {
          const matchRef = doc(db, matchesPath, matchDoc.id);
          let invalidMatch = false;

          await runTransaction(db, async (tx) => {
            const matchSnap = await tx.get(matchRef);
            if (!matchSnap.exists()) throw new Error("match missing");

            const data = matchSnap.data() as {
              memberIds?: string[];
              memberCount?: number;
              status?: string;
              members?: Record<string, { joinedAt?: unknown; nickname?: string }>;
            };

            const currentMembers = data.memberIds ?? [];
            const currentCount = data.memberCount ?? currentMembers.length;
            if (currentCount < 1) {
              invalidMatch = true;
              tx.update(matchRef, {
                status: "lost",
                winnerUserId: null,
                updatedAt: serverTimestamp(),
              });
              return;
            }
            if (currentCount >= 2) throw new Error("already full");

            const nextMemberIds = currentMembers.includes(user.uid)
              ? currentMembers
              : [...currentMembers, user.uid];

            tx.update(matchRef, {
              status: "playing",
              updatedAt: serverTimestamp(),
              memberIds: nextMemberIds,
              memberCount: nextMemberIds.length,
              members: {
                ...(data.members ?? {}),
                [user.uid]: {
                  joinedAt: serverTimestamp(),
                  nickname,
                },
              },
            });
          });

          if (!invalidMatch) {
            if (!active) return;
            setMatchId(matchDoc.id);
            matchIdRef.current = matchDoc.id;
            localStorage.setItem(STORAGE_KEYS.matchId, matchDoc.id);
            setState("waiting");

            unsub = onSnapshot(matchRef, (snap) => {
              const data = snap.data();
              if (!data) return;
              if (data.status === "playing" || data.memberCount >= 2) {
                setState("matched");
              }
            });
            return;
          }
        }

        const newMatchRef = doc(collection(db, matchesPath));
        await runTransaction(db, async (tx) => {
          const baseBoard =
            gameKey === "memory" ? createMemoryBoard(user.uid) : undefined;
          tx.set(newMatchRef, {
            tenpoId,
            status: "waiting",
            gameKey,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            winnerUserId: null,
            memberIds: [user.uid],
            memberCount: 1,
            members: {
              [user.uid]: {
                joinedAt: serverTimestamp(),
                nickname,
              },
            },
            ...(baseBoard ? { board: baseBoard } : {}),
          });
        });

        if (!active) return;
        setMatchId(newMatchRef.id);
        matchIdRef.current = newMatchRef.id;
        localStorage.setItem(STORAGE_KEYS.matchId, newMatchRef.id);
        setState("waiting");

        const createdRef = doc(db, matchesPath, newMatchRef.id);
        unsub = onSnapshot(createdRef, (snap) => {
          const data = snap.data();
          if (!data) return;
          if (data.status === "playing" || data.memberCount >= 2) {
            setState("matched");
          }
        });
      } catch (error) {
        console.error(error);
        if (!active) return;
        setErrorText("マッチングに失敗しました");
        setState("error");
      }
    };

    startMatching();

    return () => {
      active = false;
      unsub();
    };
  }, [gameKey, navigate, tenpoId]);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (state !== "matched" || !matchId) {
      setCountdown(null);
      countdownStartedRef.current = false;
      return;
    }

    if (countdownStartedRef.current) return;
    countdownStartedRef.current = true;
    const deadline = Date.now() + 5000;
    const tick = () => {
      const remain = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setCountdown(remain);
      if (remain <= 0) {
        navigate(`/play?game=${encodeURIComponent(gameKey)}&matchId=${matchId}`);
      }
    };
    tick();
    const id = window.setInterval(tick, 500);

    return () => clearInterval(id);
  }, [gameKey, matchId, navigate, state]);

  useEffect(() => {
    return () => {
      const uid = userIdRef.current;
      const currentMatchId = matchIdRef.current;
      // マッチ成立後の画面遷移では離脱扱いにしない
      if (stateRef.current === "matched") return;
      if (!uid || !currentMatchId) return;

      const matchRef = doc(
        db,
        `apps/${APP_ID}/general/${tenpoId}/matches/${currentMatchId}`
      );

      void runTransaction(db, async (tx) => {
        const snap = await tx.get(matchRef);
        if (!snap.exists()) return;
        const data = snap.data() as {
          memberIds?: string[];
          memberCount?: number;
          members?: Record<string, unknown>;
          status?: string;
        };

        const memberIds = (data.memberIds ?? []).filter((id) => id !== uid);
        const nextCount = Math.max(0, (data.memberCount ?? memberIds.length + 1) - 1);
        const members = { ...(data.members ?? {}) };
        delete members[uid];

        let nextStatus = data.status ?? "waiting";
        if (nextCount === 0) {
          nextStatus = "lost";
        } else if (nextStatus !== "playing") {
          nextStatus = "waiting";
        }

        if (nextCount === 1 && data.status === "playing") {
          const winnerUserId = memberIds[0] ?? null;
          tx.update(matchRef, {
            memberIds,
            memberCount: nextCount,
            members,
            status: "ended",
            winnerUserId,
            updatedAt: serverTimestamp(),
          });
          return;
        }

        tx.update(matchRef, {
          memberIds,
          memberCount: nextCount,
          members,
          status: nextStatus,
          updatedAt: serverTimestamp(),
        });
      }).catch((error) => {
        console.warn("leave match update failed", error);
      });
    };
  }, [tenpoId]);

  const handleStart = () => {
    if (!matchId) return;
    navigate(`/play?game=${encodeURIComponent(gameKey)}&matchId=${matchId}`);
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <p style={eyebrowStyle}>Matchmaking</p>
        <h1 style={titleStyle}>マッチ待機中</h1>
        <p style={descStyle}>
          {state === "finding" && "相手を探しています..."}
          {state === "waiting" && "同じゲームの相手を待っています"}
          {state === "matched" && "相手が見つかりました！"}
          {state === "error" && errorText}
        </p>
        {state === "matched" && countdown !== null && (
          <p style={descStyle}>{countdown}秒後に開始します</p>
        )}

        <div style={statusRowStyle}>
          <div style={dotStyle(state !== "error")} />
          <span style={statusTextStyle}>{state.toUpperCase()}</span>
        </div>

        <button
          onClick={handleStart}
          disabled={state !== "matched"}
          style={{
            ...primaryButtonStyle,
            opacity: state === "matched" ? 1 : 0.5,
          }}
        >
          ゲームを開始
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
  boxShadow: "0 0 0 4px rgba(255,255,255,0.12)",
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
  fontSize: 26,
  fontWeight: 900,
  margin: 0,
};

const descStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#e2e8f0",
  margin: 0,
};

const statusRowStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  alignSelf: "center",
  padding: "6px 14px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.4)",
};

const statusTextStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.12em",
};

const dotStyle = (ok: boolean): React.CSSProperties => ({
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: ok ? "#22d3ee" : "#f87171",
  boxShadow: "0 0 6px rgba(34,211,238,0.9)",
});

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

function createMemoryBoard(turnUserId: string) {
  const values = [1, 2, 3, 4, 5, 6];
  const deck = [...values, ...values]
    .sort(() => Math.random() - 0.5)
    .map((value, index) => ({
      id: `card-${index}`,
      value,
      state: "back",
      claimedByUserId: null,
      order: index,
    }));

  const cards = Object.fromEntries(deck.map((card) => [card.id, card]));

  return {
    turnUserId,
    phase: "idle",
    openedCardIds: [],
    matchedPairCount: 0,
    cards,
  };
}
