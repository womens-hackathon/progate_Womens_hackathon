import { useEffect, useState } from "react";

// 各予測の結果
type GuessResult = {
  guess: number[];
  hit: number;
  blow: number;
};

// 重複なしの4桁の答えをランダム生成
function generateSecret(): number[] {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const shuffled = digits.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 4);
}

// Hit（数字も位置も合っている）とBlow（数字は合っているが位置が違う）を計算
function calcHitBlow(secret: number[], guess: number[]) {
  let hit = 0;
  let blow = 0;
  for (let i = 0; i < 4; i++) {
    if (guess[i] === secret[i]) {
      hit++;
    } else if (secret.includes(guess[i])) {
      blow++;
    }
  }
  return { hit, blow };
}

export default function HitAndBlow({
  onFinished,
}: {
  onFinished?: (payload?: { tries: number }) => void | Promise<void>;
}) {
  const [secret, setSecret] = useState<number[]>(generateSecret);
  const [input, setInput] = useState<number[]>([]); // 現在入力中の数字（最大4桁）
  const [history, setHistory] = useState<GuessResult[]>([]); // 予測の履歴
  const [cleared, setCleared] = useState(false); // クリアフラグ

  // 数字ボタンを押したとき
  const pushDigit = (d: number) => {
    if (cleared || input.length >= 4) return;
    // 同じ数字は入力できない
    if (input.includes(d)) return;
    setInput((prev) => [...prev, d]);
  };

  // 1文字削除
  const popDigit = () => {
    setInput((prev) => prev.slice(0, -1));
  };

  // 予測を確定する
  const submit = () => {
    if (input.length !== 4) return;

    const { hit, blow } = calcHitBlow(secret, input);
    const result: GuessResult = { guess: [...input], hit, blow };
    setHistory((prev) => [result, ...prev]); // 新しい結果を先頭に追加
    setInput([]);

    if (hit === 4) setCleared(true);
  };

  // リセット
  const reset = () => {
    setSecret(generateSecret());
    setInput([]);
    setHistory([]);
    setCleared(false);
  };

  useEffect(() => {
    if (cleared) {
      onFinished?.({ tries: history.length });
    }
  }, [cleared, history.length, onFinished]);
  return (
    <div style={containerStyle}>
      {/* ヘッダー */}
      <div style={headerStyle}>
        <span style={headerTitleStyle}>Hit & Blow</span>
      </div>

      <div style={contentStyle}>
        {cleared ? (
          // クリア画面
          <>
            <h2 style={pageTitleStyle}>クリア！🎉</h2>
            <div style={cardStyle}>
              <p style={cardLabelStyle}>答え</p>
              <p style={secretStyle}>{secret.join(" ")}</p>
              <p style={cardLabelStyle}>試行回数</p>
              <p style={triesStyle}>{history.length} 回</p>
            </div>
            <button onClick={reset} style={primaryButtonStyle}>
              もう一回
            </button>
          </>
        ) : (
          <>
            <h2 style={pageTitleStyle}>数字推理ゲーム</h2>
            <p style={subTitleStyle}>
              重複なし4桁の数字を当てよう！
            </p>

            {/* 入力中の数字を表示するスロット */}
            <div style={slotsRowStyle}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={slotStyle}>
                  {input[i] !== undefined ? input[i] : ""}
                </div>
              ))}
            </div>

            {/* 数字パッド */}
            <div style={padGridStyle}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                <button
                  key={d}
                  onClick={() => pushDigit(d)}
                  style={padButtonStyle}
                >
                  {d}
                </button>
              ))}
              {/* 下段: 削除 / 0 / 確定 */}
              <button onClick={popDigit} style={padButtonStyle}>⌫</button>
              <button onClick={() => pushDigit(0)} style={padButtonStyle}>0</button>
              <button
                onClick={submit}
                disabled={input.length !== 4}
                style={{
                  ...padButtonStyle,
                  background: input.length === 4 ? "#facc15" : "#e5e7eb",
                  fontWeight: 800,
                }}
              >
                OK
              </button>
            </div>

            {/* 予測の履歴 */}
            {history.length > 0 && (
              <div style={cardStyle}>
                <p style={cardLabelStyle}>履歴</p>
                {history.map((r, i) => (
                  <div key={i} style={historyRowStyle}>
                    <span style={historyGuessStyle}>
                      {r.guess.join(" ")}
                    </span>
                    <span style={historyBadgeStyle("#facc15")}>
                      {r.hit} Hit
                    </span>
                    <span style={historyBadgeStyle("#86efac")}>
                      {r.blow} Blow
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

//スタイル

const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#ffffff",
  display: "flex",
  flexDirection: "column",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "16px 20px",
  borderBottom: "1.5px solid #e5e7eb",
};

const headerTitleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: "#111",
};


const contentStyle: React.CSSProperties = {
  flex: 1,
  padding: "24px 20px",
  maxWidth: 480,
  width: "100%",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const pageTitleStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 800,
  color: "#111",
  margin: 0,
};

const subTitleStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#6b7280",
  margin: 0,
};

const cardStyle: React.CSSProperties = {
  border: "2px solid #111",
  borderRadius: 16,
  padding: "20px 16px",
  background: "#fff",
};

const cardLabelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#6b7280",
  margin: "0 0 8px",
  textTransform: "uppercase",
  letterSpacing: 1,
};

const slotsRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  justifyContent: "center",
};

const slotStyle: React.CSSProperties = {
  width: 64,
  height: 64,
  border: "2px solid #111",
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 28,
  fontWeight: 900,
  color: "#111",
  boxShadow: "3px 3px 0px #111",
};

const padGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 10,
};

const padButtonStyle: React.CSSProperties = {
  height: 60,
  fontSize: 22,
  fontWeight: 700,
  color: "#111",
  background: "#f3f4f6",
  border: "2px solid #111",
  borderRadius: 12,
  cursor: "pointer",
  boxShadow: "3px 3px 0px #111",
};

const historyRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 0",
  borderBottom: "1px solid #f3f4f6",
};

const historyGuessStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  color: "#111",
  flex: 1,
  letterSpacing: 6,
};

const historyBadgeStyle = (bg: string): React.CSSProperties => ({
  background: bg,
  border: "1.5px solid #111",
  borderRadius: 999,
  padding: "2px 12px",
  fontSize: 13,
  fontWeight: 700,
  color: "#111",
});

const primaryButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "18px 0",
  fontSize: 18,
  fontWeight: 800,
  color: "#111",
  background: "#facc15",
  border: "2px solid #111",
  borderRadius: 999,
  cursor: "pointer",
  boxShadow: "4px 4px 0px #111",
};

const secretStyle: React.CSSProperties = {
  fontSize: 36,
  fontWeight: 900,
  color: "#111",
  letterSpacing: 10,
  margin: "0 0 16px",
};

const triesStyle: React.CSSProperties = {
  fontSize: 48,
  fontWeight: 900,
  color: "#111",
  margin: 0,
};
