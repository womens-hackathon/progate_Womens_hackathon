import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db, ensureAuth } from "../../firebase";
import { flipCard } from "./flipCard";
import type { CardGameMatch, MemoryCard } from "./types";

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
    <div className="flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
      <div>
        <div className="text-xs text-white/70">{label}</div>
        <div className="text-lg font-bold text-white">{name}</div>
      </div>
      <div className="text-3xl font-extrabold text-white">{score}</div>
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
      <span className="grid h-full w-full place-items-center text-[clamp(2rem,6vw,3.5rem)] font-extrabold text-slate-900 animate-[fadeIn_.22s_ease-out]">
        {card.value}
      </span>
    );
  }

  if (card.state === "claimed") {
    return (
      <span
        className="absolute inset-0"
        style={{
          backgroundColor: claimedColor,
          opacity: 1,
        }}
      >
        <span
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(45deg, rgba(255,255,255,0.9) 0 10%, transparent 10% 20%, rgba(255,255,255,0.9) 20% 30%, transparent 30% 40%, rgba(255,255,255,0.9) 40% 50%, transparent 50% 60%, rgba(255,255,255,0.9) 60% 70%, transparent 70% 80%, rgba(255,255,255,0.9) 80% 90%, transparent 90%)",
          }}
        />
      </span>
    );
  }

  return (
    <span
      className="absolute inset-3 rounded-xl"
      style={{
        background:
          "radial-gradient(circle at 20% 25%, rgba(255,255,255,0.16) 0 8px, transparent 9px), radial-gradient(circle at 75% 30%, rgba(255,255,255,0.12) 0 8px, transparent 9px), radial-gradient(circle at 40% 75%, rgba(255,255,255,0.11) 0 8px, transparent 9px), linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
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

        const matchRef = doc(db, `apps/${appId}/general/matches/${matchId}`);
        unsubscribe = onSnapshot(
          matchRef,
          (snap) => {
            if (!snap.exists()) {
              setErrorText("match が見つかりません");
              setLoading(false);
              return;
            }
            setMatch(snap.data() as CardGameMatch);
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

  const cards = useMemo(() => {
    if (!match) return [];
    return Object.values(match.board.cards).sort((a, b) => a.order - b.order);
  }, [match]);

  const myId = uid;
  const opponentId = match?.memberIds.find((id) => id !== myId) ?? null;

  const myMember = myId && match ? match.members[myId] : null;
  const opponentMember = opponentId && match ? match.members[opponentId] : null;

  const isMyTurn = !!match && match.board.turnUserId === myId;
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
      await flipCard({
        db,
        appId,
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
            phase: "one-open",
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
          phase: "resolving",
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
            phase: ended ? "ended" : "idle",
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
          phase: "idle",
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

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto grid min-h-screen max-w-[720px] grid-rows-[auto_auto_1fr_auto_auto] gap-4 px-4 py-4">
        <PlayerBar
          label="相手"
          name={opponentMember?.name ?? "-"}
          score={opponentMember?.score ?? 0}
        />

        <section className="flex items-center justify-between gap-3">
          <div
            className={[
              "rounded-full bg-white/10 px-4 py-2 text-sm font-bold",
              isMyTurn ? "ring-2 ring-cyan-400" : "ring-2 ring-rose-400",
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

          <div className="text-sm text-white/80">
            {match.board.matchedPairCount} / 6 ペア
          </div>
        </section>

        <main className="grid content-center grid-cols-3 gap-3">
          {cards.map((card) => {
            const claimedColor =
              card.claimedByUserId && match.members[card.claimedByUserId]
                ? match.members[card.claimedByUserId].color
                : "#666";

            const baseClass =
              "relative aspect-[3/4] overflow-hidden rounded-2xl border-0 shadow-[0_8px_20px_rgba(0,0,0,0.28)] transition duration-150";
            const stateClass =
              card.state === "open"
                ? "bg-gradient-to-br from-slate-50 to-slate-200 text-slate-900"
                : "bg-gradient-to-br from-slate-800 to-slate-950 text-white";
            const disabledClass =
              match.status !== "playing" ||
              !isMyTurn ||
              card.state !== "back" ||
              match.board.phase === "resolving"
                ? "cursor-default"
                : "cursor-pointer hover:-translate-y-0.5";

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
            <p className="text-sm text-rose-300">{errorText}</p>
          ) : null}
          <p className="text-center text-xs text-white/60">
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
