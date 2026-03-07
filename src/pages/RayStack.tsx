import { useEffect, useRef, useState } from "react";
import stingraySrc from "../assets/stingray.png";
import { useWaitingCount } from "../hooks/useWaitingCount";

type Phase = "ready" | "playing" | "collapsing" | "gameover";

// --- 定数 ---
const CW = 320;
const CH = 580;
const LAYER_H = 30;          // 積み重ねの縦ステップ
const DRAW_H = 50;           // エイ画像の描画高さ
const RAY_W = 150;           // エイの幅
const PLATE_Y = 500;         // お皿のY座標（タワーの回転ピボット）
const RAY_START_Y = 60;      // 移動中エイのY座標
const BASE_SPEED = 2.5;
const FALL_SPEED = 9;
const MAX_TILT = 0.32;       // ~18度：これ以上傾いたら崩れる
const TILT_SENSITIVITY = 0.004; // 重心ズレ1pxあたりの傾き（ラジアン）
const TIME_LIMIT = 30;       // 制限時間（秒）

// 各エイの着地位置（cx = 中心X座標）
interface Layer {
  cx: number;
}

// 崩れアニメーション用の物理レイヤー
interface PhysicsLayer {
  x: number; y: number; w: number;
  vx: number; vy: number;
  angle: number; av: number;
}

// エイを描く（クリップなし、画像をそのまま描画）
function drawRayAt(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number,
  img: HTMLImageElement
) {
  ctx.drawImage(img, x, y, w, DRAW_H);
}

export default function RayStack({ onFinished }: { onFinished?: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const physicsRef = useRef<PhysicsLayer[]>([]);
  const [phase, setPhase] = useState<Phase>("ready");
  const [score, setScore] = useState(0);
  const waitingCount = useWaitingCount();

  // ゲーム状態（アニメーションループからアクセスするためref管理）
  const gs = useRef({
    stack: [] as Layer[],
    rayX: CW / 2 - RAY_W / 2,
    dir: 1 as 1 | -1,
    falling: false,
    fallY: RAY_START_Y,
    score: 0,
    speed: BASE_SPEED,
    tiltAngle: 0,      // タワーの現在の傾き（ラジアン）
    tiltVelocity: 0,   // 傾きの速度（ばね振動用）
    targetTilt: 0,     // 目標傾き（重心から計算）
    startTime: 0,      // ゲーム開始時刻
    timeLeft: TIME_LIMIT, // 残り時間（秒）
  });

  // stingray.png を事前ロード（対戦モードは画像ロード後に即ゲーム開始）
  useEffect(() => {
    const img = new Image();
    img.src = stingraySrc;
    img.onload = () => {
      imgRef.current = img;
      if (onFinished) initGame();
    };
  }, [onFinished]);

  // ゲーム初期化
  const initGame = () => {
    const s = gs.current;
    s.stack = [{ cx: CW / 2 }]; 
    s.rayX = CW / 2 - RAY_W / 2;
    s.dir = 1;
    s.falling = false;
    s.fallY = RAY_START_Y;
    s.score = 0;
    s.speed = BASE_SPEED;
    s.tiltAngle = 0;
    s.tiltVelocity = 0;
    s.targetTilt = 0;
    s.startTime = Date.now();
    s.timeLeft = TIME_LIMIT;
    setScore(0);
    setPhase("playing");
  };

  // タップ：エイを落とす
  const handleTap = () => {
    if (phase !== "playing") return;
    const s = gs.current;
    if (!s.falling) {
      s.falling = true;
      s.fallY = RAY_START_Y;
    }
  };

  // --- ゲームプレイ中のループ ---
  useEffect(() => {
    if (phase !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const s = gs.current;

    const draw = () => {
      ctx.clearRect(0, 0, CW, CH);

      // 背景
      ctx.fillStyle = "#e0f2fe";
      ctx.fillRect(0, 0, CW, CH);
      ctx.fillStyle = "#bae6fd";
      ctx.fillRect(0, PLATE_Y + 30, CW, CH - PLATE_Y - 30);
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(0, CH - 25, CW, 25);

      // --- タワー全体を傾けて描画 ---
      ctx.save();
      ctx.translate(CW / 2, PLATE_Y); // お皿中心をピボットに
      ctx.rotate(s.tiltAngle);

      // 積んだエイ（ローカル座標で描画）
      if (imgRef.current) {
        s.stack.forEach((layer, i) => {
          // ローカルX: タワーピボットからの相対位置
          const localX = layer.cx - CW / 2 - RAY_W / 2;
          const localY = -(i + 1) * LAYER_H;

          ctx.save();
          ctx.translate(localX, localY);
          drawRayAt(ctx, 0, 0, RAY_W, imgRef.current!);
          ctx.restore();
        });
      }

      ctx.restore();
    

      // 落下中 or 移動中のエイ（常に画面座標で真っ直ぐ描画）
      if (imgRef.current) {
        const rayY = s.falling ? s.fallY : RAY_START_Y;
        ctx.save();
        ctx.translate(s.rayX, rayY);
        drawRayAt(ctx, 0, 0, RAY_W, imgRef.current);
        ctx.restore();
      }

      // 残り時間
      const secs = Math.ceil(s.timeLeft);
      ctx.fillStyle = secs <= 5 ? "#ef4444" : "#0f172a";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(`${secs}秒`, CW - 16, 36);

      // スコア
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 26px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${s.score}匹`, CW / 2, 36);
    };

    const gameLoop = () => {
      // 残り時間を更新
      s.timeLeft = TIME_LIMIT - (Date.now() - s.startTime) / 1000;
      if (s.timeLeft <= 0) {
        s.timeLeft = 0;
        setScore(s.score);
        setPhase("gameover");
        return;
      }

      // タワーのばね振動（傾きをなめらかに更新）
      s.tiltVelocity += (s.targetTilt - s.tiltAngle) * 0.04;
      s.tiltVelocity *= 0.88; // 減衰
      s.tiltAngle += s.tiltVelocity;

      if (s.falling) {
        s.fallY += FALL_SPEED;
        // 着地目標Y（画面座標・タワーの傾きは考慮しない簡易化）
        const landingY = PLATE_Y - (s.stack.length + 1) * LAYER_H;

        if (s.fallY >= landingY) {
          s.fallY = landingY;
          draw();

          const rayCX = s.rayX + RAY_W / 2;

          // 着地面の中心X（お皿またはひとつ下のエイ）
          const supportCX =
            s.stack.length === 0
              ? CW / 2
              : s.stack[s.stack.length - 1].cx;

          // 完全に乗り損ねた（エイ幅を超えて離れている）
          if (Math.abs(rayCX - supportCX) > RAY_W) {
            triggerCollapse(s);
            return;
          }

          // 着地成功：スタックに追加
          s.stack.push({ cx: rayCX });
          s.score++;
          setScore(s.score);

          // 重心を再計算してタワーの目標傾きを更新
          const comX =
            s.stack.reduce((sum, l) => sum + l.cx, 0) / s.stack.length;
          s.targetTilt = (comX - CW / 2) * TILT_SENSITIVITY;

          // 着地時にわずかな振動を加える（パンケーキタワーっぽさ）
          s.tiltVelocity += (Math.random() - 0.5) * 0.02;

          // 傾きすぎ → 崩れる
          if (Math.abs(s.targetTilt) > MAX_TILT) {
            triggerCollapse(s);
            return;
          }

          // 次のエイを準備（中央からスタート）
          s.rayX = CW / 2 - RAY_W / 2;
          s.falling = false;
          s.fallY = RAY_START_Y;
          s.speed = Math.min(BASE_SPEED + s.score * 0.25, 8);
        }
      } else {
        // 左右移動
        s.rayX += s.speed * s.dir;
        if (s.rayX + RAY_W >= CW) { s.rayX = CW - RAY_W; s.dir = -1; }
        if (s.rayX <= 0) { s.rayX = 0; s.dir = 1; }
      }

      draw();
      rafRef.current = requestAnimationFrame(gameLoop);
    };

    rafRef.current = requestAnimationFrame(gameLoop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phase]);

  useEffect(() => {
    if (phase === "gameover") {
      onFinished?.(score);
    }
  }, [onFinished, phase]);

  // 崩れアニメーション用に物理レイヤーをセット→"collapsing"へ
  const triggerCollapse = (s: typeof gs.current) => {
    physicsRef.current = s.stack.map((layer, i) => ({
      x: layer.cx - RAY_W / 2,
      y: PLATE_Y - (i + 1) * LAYER_H,
      w: RAY_W,
      vx: s.dir * (i + 1) * 0.9,
      vy: -(i * 0.4),
      angle: s.tiltAngle,
      av: s.dir * (i + 1) * 0.04,
    }));
    // 落下中だったエイも追加
    physicsRef.current.push({
      x: s.rayX, y: s.fallY, w: RAY_W,
      vx: s.dir * 2, vy: 0,
      angle: s.tiltAngle, av: s.dir * 0.06,
    });
    setScore(s.score);
    setPhase("collapsing");
  };

  // --- 崩れアニメーションループ ---
  useEffect(() => {
    if (phase !== "collapsing") return;

    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const ctx = canvas.getContext("2d")!;
    const img = imgRef.current;
    const layers = physicsRef.current;
    const GRAVITY = 0.45;
    let frame = 0;

    const loop = () => {
      frame++;
      ctx.clearRect(0, 0, CW, CH);

      // 背景
      ctx.fillStyle = "#e0f2fe";
      ctx.fillRect(0, 0, CW, CH);
      ctx.fillStyle = "#bae6fd";
      ctx.fillRect(0, PLATE_Y + 30, CW, CH - PLATE_Y - 30);
      ctx.fillStyle = "#0284c7";
      ctx.fillRect(0, CH - 25, CW, 25);

      // 物理演算で各エイを落下・回転させる
      layers.forEach(layer => {
        layer.vy += GRAVITY;
        layer.x += layer.vx;
        layer.y += layer.vy;
        layer.angle += layer.av;

        const cx = layer.x + layer.w / 2;
        const cy = layer.y + LAYER_H / 2;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(layer.angle);
        ctx.translate(-layer.w / 2, -LAYER_H / 2);
        drawRayAt(ctx, 0, 0, layer.w, img);
        ctx.restore();
      });

      const allGone = layers.every(l => l.y > CH + 60);
      if (frame > 90 || allGone) {
        setPhase("gameover");
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phase]);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={headerTitleStyle}>エイ積みゲーム</span>
        {waitingCount !== null && (
          <span style={waitingBadgeStyle}>あと{waitingCount}人待ち</span>
        )}
      </div>

      <div style={{ position: "relative" }}>
        <canvas
          ref={canvasRef}
          width={CW}
          height={CH}
          onPointerDown={handleTap}
          style={canvasStyle}
        />

        {phase !== "playing" && phase !== "collapsing" && !(phase === "gameover" && onFinished) && (
          <div style={overlayStyle}>
            {phase === "ready" && (
              <>
                <p style={overlayTitleStyle}>エイを積もう！</p>
                <div style={ruleCardStyle}>
                  <p style={ruleTextStyle}>タップしてエイを落とす</p>
                  <p style={ruleTextStyle}>30秒以内にできるだけ高く積もう</p>
                  <p style={ruleTextStyle}>傾きすぎたら崩れてゲームオーバー</p>
                </div>
              </>
            )}
            {phase === "gameover" && (
              <>
                <p style={overlayTitleStyle}>結果</p>
                <p style={bigScoreStyle}>{score}</p>
                <p style={overlaySubStyle}>匹積めた！</p>
              </>
            )}
            <button onClick={initGame} style={primaryButtonStyle}>
              {phase === "ready" ? "スタート" : "もう一回"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --- スタイル ---

const containerStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#fff",
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

const waitingBadgeStyle: React.CSSProperties = {
  marginLeft: "auto",
  fontSize: 15,
  fontWeight: 900,
  color: "#fff",
  background: "#ef4444",
  border: "2px solid #111",
  borderRadius: 999,
  padding: "5px 14px",
  boxShadow: "2px 2px 0px #111",
};

const canvasStyle: React.CSSProperties = {
  display: "block",
  margin: "0 auto",
  touchAction: "none",
};

const overlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(255,255,255,0.92)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 14,
  padding: 24,
};

const overlayTitleStyle: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 900,
  color: "#111",
  margin: 0,
};

const overlaySubStyle: React.CSSProperties = {
  fontSize: 15,
  color: "#555",
  margin: 0,
};

const bigScoreStyle: React.CSSProperties = {
  fontSize: 80,
  fontWeight: 900,
  color: "#111",
  lineHeight: 1,
  margin: 0,
};

const ruleCardStyle: React.CSSProperties = {
  border: "2px solid #111",
  borderRadius: 16,
  padding: "16px 20px",
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const ruleTextStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#374151",
  margin: 0,
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "16px 48px",
  fontSize: 18,
  fontWeight: 800,
  color: "#111",
  background: "#facc15",
  border: "2px solid #111",
  borderRadius: 999,
  cursor: "pointer",
  boxShadow: "4px 4px 0px #111",
};
