import {
  doc,
  runTransaction,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import type { CardGameMatch, MemoryCard } from "./types";

type FlipCardParams = {
  db: Firestore;
  appId: string;
  matchId: string;
  myId: string;
  card: MemoryCard;
};

export async function flipCard({
  db,
  appId,
  matchId,
  myId,
  card,
}: FlipCardParams) {
  const matchRef = doc(db, `apps/${appId}/general/matches/${matchId}`);

  const result = await runTransaction(db, async (tx) => {
    const snap = await tx.get(matchRef);
    if (!snap.exists()) throw new Error("match が存在しません");

    const current = snap.data() as CardGameMatch;

    if (current.status !== "playing") {
      throw new Error("ゲームは終了しています");
    }
    if (!current.memberIds.includes(myId)) {
      throw new Error("このマッチの参加者ではありません");
    }
    if (current.board.turnUserId !== myId) {
      throw new Error("あなたのターンではありません");
    }
    if (current.board.phase === "resolving") {
      throw new Error("判定中です");
    }

    const target = current.board.cards[card.id];
    if (!target || target.state !== "back") {
      throw new Error("このカードはめくれません");
    }

    const cards = { ...current.board.cards };
    const openedCardIds = [...current.board.openedCardIds];

    cards[card.id] = {
      ...target,
      state: "open",
    };
    openedCardIds.push(card.id);

    if (openedCardIds.length === 1) {
      tx.update(matchRef, {
        "board.cards": cards,
        "board.openedCardIds": openedCardIds,
        "board.phase": "one-open",
        updatedAt: serverTimestamp(),
      });
      return { type: "one-open" as const };
    }

    if (openedCardIds.length !== 2) {
      throw new Error("開いているカード数が不正です");
    }

    const [firstId, secondId] = openedCardIds;
    const first = cards[firstId];
    const second = cards[secondId];

    if (first.value === second.value) {
      cards[firstId] = {
        ...first,
        state: "claimed",
        claimedByUserId: myId,
      };
      cards[secondId] = {
        ...second,
        state: "claimed",
        claimedByUserId: myId,
      };

      const nextScore = (current.members[myId]?.score ?? 0) + 1;
      const nextMatchedPairCount = current.board.matchedPairCount + 1;
      const isEnded = nextMatchedPairCount >= 6;

      tx.update(matchRef, {
        "board.cards": cards,
        "board.openedCardIds": [],
        "board.phase": isEnded ? "ended" : "idle",
        "board.matchedPairCount": nextMatchedPairCount,
        [`members.${myId}.score`]: nextScore,
        status: isEnded ? "ended" : "playing",
        winnerUserId: isEnded ? myId : null,
        updatedAt: serverTimestamp(),
      });

      return { type: isEnded ? ("ended" as const) : ("matched" as const) };
    }

    tx.update(matchRef, {
      "board.cards": cards,
      "board.openedCardIds": openedCardIds,
      "board.phase": "resolving",
      updatedAt: serverTimestamp(),
    });

    return {
      type: "mismatch" as const,
      playerId: myId,
    };
  });

  if (result.type === "mismatch") {
    window.setTimeout(async () => {
      try {
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(matchRef);
          if (!snap.exists()) return;

          const current = snap.data() as CardGameMatch;
          if (current.status !== "playing") return;
          if (current.board.phase !== "resolving") return;
          if (current.board.openedCardIds.length !== 2) return;

          const [firstId, secondId] = current.board.openedCardIds;
          const cards = { ...current.board.cards };

          if (cards[firstId]?.state === "open") {
            cards[firstId] = { ...cards[firstId], state: "back" };
          }
          if (cards[secondId]?.state === "open") {
            cards[secondId] = { ...cards[secondId], state: "back" };
          }

          const nextTurnUserId =
            current.memberIds.find((id) => id !== result.playerId) ??
            result.playerId;

          tx.update(matchRef, {
            "board.cards": cards,
            "board.openedCardIds": [],
            "board.phase": "idle",
            "board.turnUserId": nextTurnUserId,
            updatedAt: serverTimestamp(),
          });
        });
      } catch (error) {
        console.error(error);
      }
    }, 900);
  }
}