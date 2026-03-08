import { doc, onSnapshot, runTransaction, serverTimestamp } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { STORAGE_KEYS } from "../../appConfig";
import { auth, db, ensureAuth } from "../../firebase";
import { flipCard } from "./flipCard";
import type { BoardPhase, CardGameMatch, MemoryCard } from "./types";

type CardGamePageProps = {
  appId: string;
  matchId: string;
  demo?: boolean;
};

function PlayerBar({
  label,
  name,
  score,
}: {
  label: string;
  name: string;
  score: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border-4 border-black bg-white px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
      <div>
        <div className="text-xs font-black uppercase tracking-widest text-neutral-500">
          {label}
        </div>
        <div className="text-lg font-black text-black">{name}</div>
      </div>
      <div className="text-3xl font-black text-black">{score}</div>
    </div>
  );
}

function CardFace({
  card,
  claimedColor,
}: {
  card: MemoryCard;
  claimedColor: string;
}) {
  if (card.state === "open") {
    return (
      <span className="grid h-full w-full place-items-center text-[clamp(2rem,6vw,3.5rem)] font-black text-black animate-[fadeIn_.22s_ease-out]">
        {card.value}
      </span>
    );
  }

  if (card.state === "claimed") {
    return (
      <span className="absolute inset-0">
        <span
          className="absolute inset-0"
          style={{
            backgroundColor: claimedColor,
          }}
        />
        <span
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-45deg, rgba(255,255,255,0.85) 0 8px, transparent 8px 16px)",
          }}
        />
      </span>
    );
  }

  return (
    <span
      className="absolute inset-2 rounded-xl border-2 border-black bg-white"
      style={{
        background:
          "radial-gradient(circle at 30% 30%, rgba(0,0,0,0.12) 0 6px, transparent 7px), radial-gradient(circle at 70% 70%, rgba(0,0,0,0.08) 0 5px, transparent 6px)",
      }}
    />
  );
}

export default function CardGamePage({
  appId,
  matchId,
  demo = false,
}: CardGamePageProps) {
  const [uid, setUid] = useState("");
  const [match, setMatch] = useState<CardGameMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [remainSec, setRemainSec] = useState<number | null>(null);

  useEffect(() => {
    if (demo) {
      setUid("demo-me");
      setMatch(createDemoMatch());
      setLoading(false);
      return;
    }

    let unsubscribe = () => {};

    (async () => {
      try {
        const user = await ensureAuth();
        setUid(user.uid);

        const tenpoId =
          localStorage.getItem(STORAGE_KEYS.tenpoId) ?? "";
        if (!tenpoId) {
          setErrorText("店舗IDが見つかりません");
          setLoading(false);
          return;
        }
        const matchRef = doc(
          db,
          `apps/${appId}/general/${tenpoId}/matches/${matchId}`
        );
        unsubscribe = onSnapshot(
          matchRef,
          (snap) => {
            if (!snap.exists()) {
              setErrorText("match が見つかりません");
              setLoading(false);
              return;
            }
            const data = snap.data() as CardGameMatch;
            if (data.memberIds.length === 0 && user.uid) {
              void runTransaction(db, async (tx) => {
                const refSnap = await tx.get(matchRef);
                if (!refSnap.exists()) return;
                const current = refSnap.data() as CardGameMatch;
                if (current.memberIds.length > 0) return;
                tx.update(matchRef, {
                  memberIds: [user.uid],
                  memberCount: 1,
                  members: {
                    ...(current.members ?? {}),
                    [user.uid]: {
                      joinedAt: serverTimestamp(),
                      name: current.members?.[user.uid]?.name ?? "あなた",
                      color: current.members?.[user.uid]?.color ?? "#22d3ee",
                      score: current.members?.[user.uid]?.score ?? 0,
                    },
                  },
                  updatedAt: serverTimestamp(),
                });
              });
            }
            setMatch(data);
            setLoading(false);
          },
          (error) => {
            console.error(error);
            setErrorText("match の取得に失敗しました");
            setLoading(false);
          }
        );
      } catch (error) {
        console.error(error);
        setErrorText("認証に失敗しました");
        setLoading(false);
      }
    })();

    return () => unsubscribe();
  }, [appId, matchId]);

  useEffect(() => {
    if (demo) return;
    if (!match || !match.board || !uid) return;
    if (match.memberIds.length !== 1) return;
    if (match.board.turnUserId === uid) return;

    const tenpoId =
      localStorage.getItem(STORAGE_KEYS.tenpoId) ?? "";
    if (!tenpoId) return;
    const matchRef = doc(
      db,
      `apps/${appId}/general/${tenpoId}/matches/${matchId}`
    );

    void runTransaction(db, async (tx) => {
      const snap = await tx.get(matchRef);
      if (!snap.exists()) return;
      const current = snap.data() as CardGameMatch;
      if (current.memberIds.length !== 1) return;
      if (current.board.turnUserId === uid) return;
      tx.update(matchRef, {
        "board.turnUserId": uid,
        "board.phase": "idle",
        updatedAt: serverTimestamp(),
      });
    });
  }, [appId, demo, match, matchId, uid]);

  useEffect(() => {
    if (demo) return;
    if (!match || match.status !== "playing") {
      setRemainSec(null);
      return;
    }

    const LIMIT_SEC = 60;
    const createdAt = (match as any).createdAt;
    const createdAtMs =
      typeof createdAt?.toMillis === "function" ? createdAt.toMillis() : null;
    const startedAt = createdAtMs ?? Date.now();

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const remain = Math.max(0, LIMIT_SEC - elapsed);
      setRemainSec(remain);
      if (remain <= 0) {
        void runTransaction(db, async (tx) => {
          const tenpoId =
            localStorage.getItem(STORAGE_KEYS.tenpoId) ?? "";
          if (!tenpoId) return;
          const matchRef = doc(
            db,
            `apps/${appId}/general/${tenpoId}/matches/${matchId}`
          );
          const snap = await tx.get(matchRef);
          if (!snap.exists()) return;
          const current = snap.data() as CardGameMatch;
          if (current.status !== "playing") return;

          const entries = Object.entries(current.members ?? {});
          const [firstId, first] = entries[0] ?? [];
          const [secondId, second] = entries[1] ?? [];
          const firstScore = first?.score ?? 0;
          const secondScore = second?.score ?? 0;
          const winnerUserId =
            firstScore === secondScore
              ? null
              : firstScore > secondScore
              ? firstId
              : secondId ?? null;

          tx.update(matchRef, {
            status: "ended",
            winnerUserId,
            "board.phase": "ended",
            updatedAt: serverTimestamp(),
          });
        });
      }
    };

    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [appId, demo, match, matchId]);

  useEffect(() => {
    if (demo) return;
    if (!match || !match.board || !uid) return;
    if (match.status !== "playing") return;
    if (match.memberIds.length < 2) return;
    if (match.board.turnUserId === uid) return;
    if (match.board.phase !== "idle") return;

    const updatedAt = (match as any).updatedAt;
    const updatedAtMs =
      typeof updatedAt?.toMillis === "function"
        ? updatedAt.toMillis()
        : null;

    const tenpoId =
      localStorage.getItem(STORAGE_KEYS.tenpoId) ?? "";
    if (!tenpoId) return;
    const matchRef = doc(
      db,
      `apps/${appId}/general/${tenpoId}/matches/${matchId}`
    );

    const timeoutId = window.setTimeout(() => {
      void runTransaction(db, async (tx) => {
        const snap = await tx.get(matchRef);
        if (!snap.exists()) return;
        const current = snap.data() as CardGameMatch & { updatedAt?: any };
        if (current.status !== "playing") return;
        if (current.memberIds.length < 2) return;
        if (current.board.turnUserId === uid) return;
        if (current.board.phase !== "idle") return;

        const currentUpdatedAt = (current as any).updatedAt;
        const currentUpdatedAtMs =
          typeof currentUpdatedAt?.toMillis === "function"
            ? currentUpdatedAt.toMillis()
            : null;

        if (updatedAtMs && currentUpdatedAtMs && currentUpdatedAtMs !== updatedAtMs) {
          return;
        }

        tx.update(matchRef, {
          "board.turnUserId": uid,
          updatedAt: serverTimestamp(),
        });
      });
    }, 10000);

    return () => window.clearTimeout(timeoutId);
  }, [appId, demo, match, matchId, uid]);

  const cards = useMemo(() => {
    if (!match?.board?.cards) return [];
    return Object.values(match.board.cards).sort((a, b) => a.order - b.order);
  }, [match]);

  const myId = uid;
  const opponentId = match?.memberIds.find((id) => id !== myId) ?? null;

  const myMember = myId && match ? match.members[myId] : null;
  const opponentMember = opponentId && match ? match.members[opponentId] : null;

  const isMyTurn = !!match?.board && match.board.turnUserId === myId;
  const winnerName =
    match?.status === "ended" && match.winnerUserId
      ? match.members[match.winnerUserId]?.name ?? "勝者"
      : null;

  async function handleCardClick(card: MemoryCard) {
    if (demo) {
      handleDemoCardClick(card.id);
      return;
    }

    if (!match || !myId) return;
    if (match.status !== "playing") return;
    if (!isMyTurn) return;
    if (card.state !== "back") return;
    if (match.board.phase === "resolving") return;

    try {
      setErrorText("");
      const tenpoId =
        localStorage.getItem(STORAGE_KEYS.tenpoId) ?? "";
      if (!tenpoId) return;
      await flipCard({
        db,
        appId,
        tenpoId,
        matchId,
        myId,
        card,
      });
    } catch (error: any) {
      console.error(error);
      setErrorText(error.message ?? "カード操作に失敗しました");
    }
  }

  function handleDemoCardClick(cardId: string) {
    setMatch((prev) => {
      if (!prev) return prev;
      if (prev.status !== "playing") return prev;
      const board = prev.board;
      if (board.phase === "resolving") return prev;

      const target = board.cards[cardId];
      if (!target || target.state !== "back") return prev;

      const cards = { ...board.cards };
      if (board.openedCardIds.length === 0) {
        cards[cardId] = { ...target, state: "open" };
        return {
          ...prev,
          board: {
            ...board,
            cards,
            openedCardIds: [cardId],
            phase: "one-open" as BoardPhase,
          },
        };
      }

      const firstId = board.openedCardIds[0];
      const first = cards[firstId];
      cards[firstId] = { ...first, state: "open" };
      cards[cardId] = { ...target, state: "open" };

      const next = {
        ...prev,
        board: {
          ...board,
          cards,
          openedCardIds: [firstId, cardId],
          phase: "resolving" as BoardPhase,
        },
      };

      window.setTimeout(() => {
        resolveDemoMatch(firstId, cardId);
      }, 650);

      return next;
    });
  }

  function resolveDemoMatch(firstId: string, secondId: string) {
    setMatch((prev) => {
      if (!prev) return prev;
      const board = prev.board;
      if (board.phase !== "resolving") return prev;

      const cards = { ...board.cards };
      const first = cards[firstId];
      const second = cards[secondId];
      if (!first || !second) return prev;

      const myId = board.turnUserId;
      const opponentId = prev.memberIds.find((id) => id !== myId) ?? myId;
      const members = { ...prev.members };

      if (first.value === second.value) {
        cards[firstId] = { ...first, state: "claimed", claimedByUserId: myId };
        cards[secondId] = { ...second, state: "claimed", claimedByUserId: myId };

        const me = members[myId];
        members[myId] = { ...me, score: me.score + 1 };

        const matchedPairCount = board.matchedPairCount + 1;
        const totalPairs = Object.values(cards).length / 2;
        const ended = matchedPairCount >= totalPairs;

        return {
          ...prev,
          status: ended ? "ended" : prev.status,
          winnerUserId: ended ? myId : prev.winnerUserId,
          members,
          board: {
            ...board,
            cards,
            openedCardIds: [],
            phase: (ended ? "ended" : "idle") as BoardPhase,
            matchedPairCount,
          },
        };
      }

      cards[firstId] = { ...first, state: "back" };
      cards[secondId] = { ...second, state: "back" };

      return {
        ...prev,
        members,
        board: {
          ...board,
          cards,
          openedCardIds: [],
          phase: "idle" as BoardPhase,
          turnUserId: opponentId,
        },
      };
    });
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-white">
        読み込み中...
      </div>
    );
  }

  if (!match) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 px-4 text-white">
        {errorText || "データがありません"}
      </div>
    );
  }

  if (!match.board) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 px-4 text-white">
        盤面データがありません
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-black">
      <div className="mx-auto grid min-h-screen max-w-[720px] grid-rows-[auto_auto_1fr_auto_auto] gap-4 px-4 py-4">
        <PlayerBar
          label="相手"
          name={opponentMember?.name ?? "-"}
          score={opponentMember?.score ?? 0}
        />

        <section className="flex items-center justify-between gap-3">
          <div
            className={[
              "rounded-full border-4 border-black bg-white px-4 py-2 text-sm font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]",
              isMyTurn ? "text-red-600" : "text-emerald-600",
            ].join(" ")}
          >
            {match.status === "ended"
              ? winnerName
                ? `${winnerName} の勝ち`
                : "ゲーム終了"
              : isMyTurn
              ? "あなたのターン"
              : "相手のターン"}
          </div>

          <div className="text-sm font-bold text-black">
            {match.board.matchedPairCount} / 6 ペア
            {remainSec !== null && (
              <span className="ml-3 rounded-full border-2 border-black bg-yellow-300 px-2 py-1 text-xs font-black">
                残り {remainSec}s
              </span>
            )}
          </div>
        </section>

        <main className="grid content-center grid-cols-3 gap-3">
          {cards.map((card) => {
            const claimedColor =
              card.claimedByUserId && match.members[card.claimedByUserId]
                ? match.members[card.claimedByUserId].color
                : "#666";

            const baseClass =
              "relative aspect-[3/4] overflow-hidden rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition duration-150";
            const stateClass =
              card.state === "open"
                ? "bg-white text-black"
                : "bg-neutral-50 text-black";
            const disabledClass =
              match.status !== "playing" ||
              !isMyTurn ||
              card.state !== "back" ||
              match.board.phase === "resolving"
                ? "cursor-default"
                : "cursor-pointer hover:-translate-y-1";

            return (
              <button
                key={card.id}
                className={`${baseClass} ${stateClass} ${disabledClass}`}
                disabled={
                  match.status !== "playing" ||
                  !isMyTurn ||
                  card.state !== "back" ||
                  match.board.phase === "resolving"
                }
                onClick={() => handleCardClick(card)}
              >
                <CardFace card={card} claimedColor={claimedColor} />
              </button>
            );
          })}
        </main>

        <PlayerBar
          label="あなた"
          name={myMember?.name ?? "-"}
          score={myMember?.score ?? 0}
        />

        <div className="space-y-1">
          {errorText ? (
            <p className="text-sm font-bold text-red-600">{errorText}</p>
          ) : null}
          <p className="text-center text-xs font-bold text-neutral-500">
            uid: {auth.currentUser?.uid}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            filter: blur(8px);
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            filter: blur(0);
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

function createDemoMatch(): CardGameMatch {
  const values = [1, 2, 3, 4, 5, 6];
  const deck = [...values, ...values]
    .sort(() => Math.random() - 0.5)
    .map((value, index) => ({
      id: `card-${index}`,
      value,
      state: "back" as const,
      claimedByUserId: null,
      order: index,
    }));

  const cards = Object.fromEntries(deck.map((card) => [card.id, card]));

  return {
    status: "playing",
    gameKey: "memory",
    winnerUserId: null,
    memberIds: ["demo-me", "demo-you"],
    members: {
      "demo-me": { name: "あなた", color: "#22d3ee", score: 0 },
      "demo-you": { name: "相手", color: "#fb7185", score: 0 },
    },
    board: {
      turnUserId: "demo-me",
      phase: "idle",
      openedCardIds: [],
      matchedPairCount: 0,
      cards,
    },
  };
}
