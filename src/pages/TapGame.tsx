import { useCallback, useEffect, useMemo, useRef, useState } from "react";


// ゲームの進行状態
type Phase = "ready" | "playing" | "result";

export default function TapGame() {
  const DURATION_SEC = 10; // ゲームの制限時間（秒）

  //  値が変わると画面が再描画される
  const [phase, setPhase] = useState<Phase>("ready"); // 現在の画面
  const [count, setCount] = useState(0); // タップ数
  const [remainMs, setRemainMs] = useState(DURATION_SEC * 1000);// 残り時間（ミリ秒）

  // 値が変わっても画面を再描画しない変数 
  const endAtRef = useRef<number | null>(null); // ゲーム終了時刻（Unixタイム）
  const rafRef = useRef<number | null>(null);   // requestAnimationFrameのID

  // remainMs（ミリ秒）を秒に変換。remainMsが変わったときだけ再計算する
  const remainSec = useMemo(
    () => Math.max(0, Math.ceil(remainMs / 1000)),
    [remainMs]
  );

  // タイマーを止める
  const stopLoop = () => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  // ゲーム開始
  const start = () => {
    setCount(0);
    setPhase("playing");
    const endAt = Date.now() + DURATION_SEC * 1000; // 終了時刻を計算
    endAtRef.current = endAt;

    // 毎フレーム（約60fps）呼ばれるタイマーループ
    const loop = () => {
      const now = Date.now();
      const remain = Math.max(0, endAt - now); // 残り時間を計算
      setRemainMs(remain); // 残り時間を更新して画面に反映

      if (remain <= 0) {
        // 時間切れ → 結果画面へ
        setPhase("result");
        stopLoop();
        return;
      }
      // 次のフレームで再度loopを呼ぶ
      rafRef.current = requestAnimationFrame(loop);
    };

    stopLoop(); // 念のため既存のループを止めてから開始
    rafRef.current = requestAnimationFrame(loop);
  };

  // リセット（最初の状態に戻す）
  const reset = () => {
    stopLoop();
    endAtRef.current = null;
    setPhase("ready");
    setCount(0);
    setRemainMs(DURATION_SEC * 1000);
  };

  // タップ処理（ゲーム中以外は無視）
  // useCallback: phaseが変わったときだけ関数を再生成し、古いphaseを参照しないようにする
  const tap = useCallback(() => {
    if (phase !== "playing") return;
    setCount((c) => c + 1);
  }, [phase]);

  // スペースキーでもタップできるようにする
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        tap();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    // クリーンアップ
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tap]);

  // コンポーネントがアンマウントされたらタイマーを止める
  useEffect(() => stopLoop, []);

  return (
    <div style={containerStyle}>
      {/* ヘッダー */}
      <div style={headerStyle}>
        <span style={headerTitleStyle}>Tap Game</span>
      </div>

      <div style={contentStyle}>
        {phase === "ready" && (
          <>
            <h2 style={pageTitleStyle}>連打チャレンジ</h2>
            <p style={subTitleStyle}>{DURATION_SEC}秒間、ひたすら連打！</p>

            <div style={cardStyle}>
              <p style={cardLabelStyle}>ルール</p>
              <p style={cardTextStyle}>
                スタートボタンを押したら、できるだけ速くボタンを連打しよう！
                スマホは指で、PCはスペースキーでもOK。
              </p>
            </div>

            <button onClick={start} style={primaryButtonStyle}>
               スタート
            </button>
          </>
        )}

        {phase === "playing" && (
          <>
            <div style={cardStyle}>
              <div style={statsRowStyle}>
                <div style={statBoxStyle}>
                  <p style={statLabelStyle}>残り時間</p>
                  <p
                    style={{
                      ...statValueStyle,
                      color: remainSec <= 3 ? "#ef4444" : "#111",
                    }}
                  >
                    {remainSec}
                    <span style={statUnitStyle}>秒</span>
                  </p>
                </div>
                <div style={dividerStyle} />
                <div style={statBoxStyle}>
                  <p style={statLabelStyle}>タップ数</p>
                  <p style={statValueStyle}>
                    {count}
                    <span style={statUnitStyle}>回</span>
                  </p>
                </div>
              </div>
            </div>

            <button onPointerDown={tap} style={tapButtonStyle}>
              TAP!!
            </button>

            <p style={hintStyle}>スマホは指で連打 / PCはスペースキーでもOK</p>
          </>
        )}

        {phase === "result" && (
          <>
            <h2 style={pageTitleStyle}>結果発表 🎉</h2>

            <div style={cardStyle}>
              <p style={cardLabelStyle}>あなたのスコア</p>
              <p style={scoreStyle}>{count}</p>
              <p style={scoreUnitStyle}>回</p>
            </div>

            <button onClick={start} style={primaryButtonStyle}>
              🔄 もう一回
            </button>
            <button onClick={reset} style={secondaryButtonStyle}>
              ロビーに戻る
            </button>
          </>
        )}
      </div>
    </div>
  );
}

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

const cardTextStyle: React.CSSProperties = {
  fontSize: 15,
  color: "#374151",
  margin: 0,
  lineHeight: 1.7,
};

const statsRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-around",
};

const statBoxStyle: React.CSSProperties = {
  textAlign: "center",
  flex: 1,
};

const dividerStyle: React.CSSProperties = {
  width: 1.5,
  height: 60,
  background: "#e5e7eb",
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#6b7280",
  fontWeight: 600,
  margin: "0 0 4px",
};

const statValueStyle: React.CSSProperties = {
  fontSize: 48,
  fontWeight: 900,
  color: "#111",
  margin: 0,
  lineHeight: 1,
};

const statUnitStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  marginLeft: 4,
};

const tapButtonStyle: React.CSSProperties = {
  width: "100%",
  height: 140,
  fontSize: 36,
  fontWeight: 900,
  color: "#111",
  background: "#facc15",
  border: "2px solid #111",
  borderRadius: 16,
  cursor: "pointer",
  letterSpacing: 4,
  userSelect: "none",
  touchAction: "manipulation",
  boxShadow: "4px 4px 0px #111",
};

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

const secondaryButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "16px 0",
  fontSize: 16,
  fontWeight: 700,
  color: "#111",
  background: "#fff",
  border: "2px solid #111",
  borderRadius: 999,
  cursor: "pointer",
};

const hintStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#9ca3af",
  textAlign: "center",
  margin: 0,
};

const scoreStyle: React.CSSProperties = {
  fontSize: 96,
  fontWeight: 900,
  color: "#111",
  margin: 0,
  lineHeight: 1,
  textAlign: "center",
};

const scoreUnitStyle: React.CSSProperties = {
  fontSize: 20,
  color: "#6b7280",
  fontWeight: 600,
  textAlign: "center",
  margin: "4px 0 0",
};
