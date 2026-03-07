export type CardState = "back" | "open" | "claimed";
export type BoardPhase = "idle" | "one-open" | "resolving" | "ended";
export type MatchStatus = "waiting" | "playing" | "ended";

export type MemoryCard = {
  id: string;
  value: number;
  state: CardState;
  claimedByUserId: string | null;
  order: number;
};

export type MatchMember = {
  name: string;
  color: string;
  score: number;
};

export type CardGameMatch = {
  status: MatchStatus;
  gameKey: "memory";
  winnerUserId: string | null;
  memberIds: string[];
  members: Record<string, MatchMember>;
  board: {
    turnUserId: string;
    phase: BoardPhase;
    openedCardIds: string[];
    matchedPairCount: number;
    cards: Record<string, MemoryCard>;
  };
};