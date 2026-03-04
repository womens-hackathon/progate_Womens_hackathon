import React, { useMemo, useState } from "react";

type Candidate = {
  id: string;
  musicName: string;
  votes: number;
};

// AdditionalView に渡す props
type AdditionalViewProps = {
  onAdd: (musicName: string) => void;
  onFinish: () => void;
  canFinish: boolean;
};

// RankingView に渡す props
type RankingViewProps = {
  candidates: Candidate[];
  onVote: (id: string) => void;
  votedId: string | null;
};


// 曲の追加画面（勝者）
function AdditionalView({ onAdd, onFinish, canFinish }: AdditionalViewProps) {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const name = input.trim();
    if (!name) return;
    onAdd(name);
    setInput("");
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">曲を追加</h1>

      <input
        className="border rounded p-2 w-full mb-2"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="曲名を入力"
      />

      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={handleAdd}
      >
        追加
      </button>

      <button
        className={`text-white px-4 py-2 rounded mt-4 w-full ${
          canFinish ? "bg-gray-500" : "bg-gray-300 cursor-not-allowed"
        }`}
        onClick={onFinish}
        disabled={!canFinish}
      >
        ランキングを見る
      </button>
    </div>
  );
}


// ランキング＋投票画面（敗者）
function RankingView({ candidates, onVote, votedId }: RankingViewProps) {
  return (
    <ul className="p-4 space-y-2">
      {candidates.map((c, idx) => (
        <li key={c.id} className="flex items-center gap-3 border-b pb-2">
          <div className="w-10 font-bold">{idx + 1}位</div>

          <div className="flex-1">
            <div className="font-semibold">{c.musicName}</div>
            <div className="text-sm opacity-70">{c.votes}票</div>
          </div>

          <button
            className={`px-3 py-1 rounded ${
              votedId !== null ? "bg-gray-300" : "bg-green-500 text-white"
            }`}
            onClick={() => onVote(c.id)}
            disabled={votedId !== null}
          >
            {votedId === c.id ? "✓ 投票済" : "投票"}
          </button>
        </li>
      ))}
    </ul>
  );
}


// メインコンポーネント
export default function VotePage() {
  const [phase, setPhase] = useState<"collect" | "vote">("collect");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [votedId, setVotedId] = useState<string | null>(null);

  // 得票数の降順でソートしたリスト（candidatesが変わった時だけ再計算）
  // ※ Firestoreに繋いだ後はこのソートは不要になる予定
  const sortedCandidates = useMemo(() => {
    return [...candidates].sort((a, b) => b.votes - a.votes);
  }, [candidates]);

  // 曲を追加する（AdditionalViewから呼ばれる）
  // ※ Firestore連携後は addDoc() に差し替える
  const handleAdd = (musicName: string) => {
    setCandidates((prev) => [
      ...prev,
      { id: crypto.randomUUID(), musicName, votes: 0 },
    ]);
  };

  // 投票する（RankingViewから呼ばれる）
  // ※ Firestore連携後は setDoc() に差し替える
  const handleVote = (id: string) => {
    if (votedId !== null) return;
    setVotedId(id);
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, votes: c.votes + 1 } : c))
    );
  };

  if (phase === "collect") {
    return (
      <AdditionalView
        onAdd={handleAdd}
        canFinish={candidates.length > 0}
        onFinish={() => setPhase("vote")}
      />
    );
  }

  return (
    <RankingView
      candidates={sortedCandidates}
      onVote={handleVote}
      votedId={votedId}
    />
  );
}