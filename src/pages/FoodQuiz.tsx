import { useState } from "react";

// 質問リスト（7問）
const questions = [
  {
    text: "どんな味が好き？",
    options: [
      { label: "甘め・マイルド", tag: "mild" },
      { label: "ピリ辛・スパイシー", tag: "spicy" },
    ],
  },
  {
    text: "メインの食材は？",
    options: [
      { label: "がっつりお肉", tag: "meat" },
      { label: "さっぱり野菜・魚", tag: "veggie" },
    ],
  },
  {
    text: "今日の気分は？",
    options: [
      { label: "こってり濃厚", tag: "rich" },
      { label: "あっさりさっぱり", tag: "light" },
    ],
  },
  {
    text: "主食はどっち？",
    options: [
      { label: "パスタ系", tag: "pasta" },
      { label: "ライス・ピザ系", tag: "rice" },
    ],
  },
  {
    text: "食べる量は？",
    options: [
      { label: "がっつりボリューム", tag: "large" },
      { label: "軽めでいい", tag: "small" },
    ],
  },
  {
    text: "温度の好みは？",
    options: [
      { label: "温かい料理", tag: "hot" },
      { label: "冷たい・常温でもOK", tag: "cold" },
    ],
  },
  {
    text: "今日のテーマは？",
    options: [
      { label: "間違いない定番", tag: "classic" },
      { label: "ちょっと冒険したい", tag: "adventure" },
    ],
  },
];

// サイゼリヤのメニュー
// imageUrl: サイゼリヤ公式サイトの画像URLを入れてください
const menuItems = [
  {
    name: "ミラノ風ドリア",
    price: 273,
    description: "サイゼリヤの看板メニュー！濃厚なホワイトソースとミートソースのドリア",
    tags: ["mild", "meat", "rich", "rice", "large", "hot", "classic"],
    emoji: "🍚",
    imageUrl: "https://www.saizeriya.co.jp/files/2101_%E3%83%9F%E3%83%A9%E3%83%8E%E9%A2%A8%E3%83%89%E3%83%AA%E3%82%A2-1.webp",
  },
  {
    name: "カルボナーラ",
    price: 455,
    description: "クリーミーで濃厚なカルボナーラ。卵黄とチーズの絶妙なハーモニー",
    tags: ["mild", "meat", "rich", "pasta", "large", "hot", "classic"],
    emoji: "🍝",
    imageUrl: "https://www.saizeriya.co.jp/files/2305_%E3%82%AB%E3%83%AB%E3%83%9C_SP%E3%83%A1%E3%82%A4%E3%83%B3.webp",
  },
  {
    name: "バッファローモッツァレラのマルゲリータピザ",
    price: 364,
    description: "水牛モッツァレラのミルキーなコクと風味が格別な、サイゼリヤを代表する人気のピザ",
    tags: ["mild", "veggie", "light", "pasta", "small", "hot", "classic"],
    emoji: "🌶️",
    imageUrl: "https://www.saizeriya.co.jp/files/2203_%E3%83%90%E3%83%83%E3%83%95%E3%82%A1%E3%83%AD%E3%83%BC%E3%83%A2%E3%83%83%E3%83%84%E3%82%A1%E3%83%AC%E3%83%A9%E3%81%AE%E3%83%9E%E3%83%AB%E3%82%B2%E3%83%AA%E3%83%BC%E3%82%BF%E3%83%94%E3%82%B6.webp",
  },
  {
    name: "ペペロンチーノ",
    price:273,
    description: "にんにくと唐辛子のシンプルなオイルパスタ。素材の旨みが引き立つ",
    tags: ["spicy", "veggie", "light", "pasta", "small", "hot", "adventure"],
    emoji: "🍝",
    imageUrl: "https://www.saizeriya.co.jp/files/2303_%E3%83%9A%E3%83%9A%E3%83%AD%E3%83%B3_PC.webp",
  },
  {
    name: "若鶏のディアボラ風",
    price: 455,
    description: "こんがり、じっくり、ジューシー。ライスによく合う、一番人気の肉料理",
    tags: ["mild", "meat", "rich", "rice", "large", "hot", "adventure"],
    emoji: "🍗",
    imageUrl: "https://www.saizeriya.co.jp/files/2402_%E8%8B%A5%E9%B6%8F%E3%81%AE%E3%83%87%E3%82%A3%E3%82%A2%E3%83%9C%E3%83%A9%E9%A2%A8.webp",
  },
  {
    name: "玉ねぎのズッパ",
    price: 273,
    description: "じっくり煮込んだ玉ねぎの甘みが凝縮したスープ。チーズがとろけてほっこり",
    tags: ["mild", "veggie", "rich", "rice", "small", "hot", "classic"],
    emoji: "🧅",
    imageUrl: "https://www.saizeriya.co.jp/files/1307_%E3%81%9F%E3%81%BE%E3%81%AD%E3%81%8E%E3%81%AE%E3%82%BA%E3%83%83%E3%83%91.webp",
  },
  {
    name: "エスカルゴのオーブン焼き",
    price: 364,
    description: "ガーリックバターが香るエスカルゴ。ちょっと大人な気分に",
    tags: ["mild", "meat", "rich", "rice", "small", "hot", "adventure"],
    emoji: "🐌",
    imageUrl: "https://www.saizeriya.co.jp/files/1405_%E3%82%A8%E3%82%B9%E3%82%AB%E3%83%AB%E3%82%B4%E3%81%AE%E3%82%AA%E3%83%BC%E3%83%96%E3%83%B3%E7%84%BC%E3%81%8D.webp",
  },
  {
    name: "ほうれん草のソテー",
    price: 182,
    description: "シンプルでヘルシー。あっさり食べたい時の定番サイドメニュー",
    tags: ["mild", "veggie", "light", "rice", "small", "hot", "classic"],
    emoji: "🥬",
    imageUrl: "https://www.saizeriya.co.jp/files/1403_%E3%81%BB%E3%81%86%E3%82%8C%E3%82%93%E8%8D%89_pc.webp",
  },
  {
    name: "イカの墨入りセピアソース",
    price: 455,
    description: "イカ墨の旨みとコクが絶妙な、本場イタリアのセピア色のソースパスタ。夏にぴったり",
    tags: ["mild", "veggie", "light", "pasta", "small", "cold", "adventure"],
    emoji: "🍅",
    imageUrl: "https://www.saizeriya.co.jp/files/2328_%E3%82%A4%E3%82%AB%E3%81%AE%E5%A2%A8%E5%85%A5%E3%82%8A%E3%82%BB%E3%83%94%E3%82%A2%E3%82%BD%E3%83%BC%E3%82%B9-1.webp",
  },
  {
    name: "辛味チキン",
    price: 273,
    description: "ピリッと辛いチキン。シンプルだけどやみつきになる人気メニュー",
    tags: ["spicy", "meat", "light", "rice", "small", "hot", "classic"],
    emoji: "🌶️",
    imageUrl: "https://www.saizeriya.co.jp/files/1401_%E8%BE%9B%E5%91%B3%E3%83%81%E3%82%AD%E3%83%B3.webp",
  },
  {
    name: "小エビのサラダ",
    price: 319,
    description: "プリッとした甘エビのおいしさを味わうサイゼリヤの名物サラダ。軽めに食べたい時に",
    tags: ["mild", "veggie", "light", "rice", "small", "cold", "adventure"],
    emoji: "🥗",
    imageUrl: "https://www.saizeriya.co.jp/files/1202_%E5%B0%8F%E3%82%A8%E3%83%93%E3%81%AE%E3%82%B5%E3%83%A9%E3%83%80.webp",
  },
  {
    name: "ハンバーグステーキ",
    price: 364,
    description: "ジューシーなハンバーグ。子供から大人まで大好きな定番メニュー",
    tags: ["mild", "meat", "rich", "rice", "large", "hot", "classic"],
    emoji: "🍔",
    imageUrl: "https://www.saizeriya.co.jp/files/2406_%E3%83%8F%E3%83%B3%E3%83%90%E3%83%BC%E3%82%B0%E3%82%B9%E3%83%86%E3%83%BC%E3%82%AD.webp",
  },
];

// 選んだタグとの一致数でスコアリングしてトップ3を返す
function getRecommendations(selectedTags: string[]) {
  const scored = menuItems.map((item) => ({
    ...item,
    score: item.tags.filter((t) => selectedTags.includes(t)).length,
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3);
}

export default function FoodQuiz() {
  const [step, setStep] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleSelect = (tag: string) => {
    const next = [...selectedTags, tag];
    setSelectedTags(next);
    setStep(step + 1);
  };

  const reset = () => {
    setStep(0);
    setSelectedTags([]);
  };

  const isResult = step >= questions.length;
  const recommendations = isResult ? getRecommendations(selectedTags) : [];

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={headerTitleStyle}>🍽️ おすすめメニュー診断</span>
      </div>

      <div style={contentStyle}>
        {!isResult ? (
          <>
            {/* 進捗バー */}
            <div style={progressBarBgStyle}>
              <div
                style={{
                  ...progressBarFillStyle,
                  width: `${(step / questions.length) * 100}%`,
                }}
              />
            </div>
            <p style={progressTextStyle}>{step + 1} / {questions.length}</p>

            {/* 質問 */}
            <h2 style={questionStyle}>{questions[step].text}</h2>

            {/* 選択肢 */}
            <div style={optionsStyle}>
              {questions[step].options.map((opt) => (
                <button
                  key={opt.tag}
                  onClick={() => handleSelect(opt.tag)}
                  style={optionButtonStyle}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 style={resultTitleStyle}>あなたへのおすすめ</h2>
            <p style={resultSubStyle}>サイゼリヤのおすすめメニューはこちら！</p>

            {recommendations.map((item, i) => (
              <div key={item.name} style={menuCardStyle}>
                {/* 画像（imageUrlが設定されていれば表示、なければ絵文字） */}
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    style={menuImageStyle}
                  />
                ) : (
                  <div style={menuEmojiBgStyle}>{item.emoji}</div>
                )}
                <div style={menuInfoStyle}>
                  <div style={menuHeaderStyle}>
                    <span style={menuRankStyle}>#{i + 1}</span>
                    <p style={menuNameStyle}>{item.name}</p>
                  </div>
                  <p style={menuDescStyle}>{item.description}</p>
                  <p style={menuPriceStyle}>¥{item.price}</p>
                </div>
              </div>
            ))}

            <button onClick={reset} style={primaryButtonStyle}>
              もう一度診断する
            </button>
          </>
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

const contentStyle: React.CSSProperties = {
  flex: 1,
  padding: "32px 20px",
  maxWidth: 480,
  width: "100%",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const progressBarBgStyle: React.CSSProperties = {
  width: "100%",
  height: 8,
  background: "#e5e7eb",
  borderRadius: 999,
  overflow: "hidden",
};

const progressBarFillStyle: React.CSSProperties = {
  height: "100%",
  background: "#facc15",
  borderRadius: 999,
  transition: "width 0.3s ease",
};

const progressTextStyle: React.CSSProperties = {
  fontSize: 13,
  color: "#6b7280",
  margin: 0,
  textAlign: "right",
};

const questionStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 900,
  color: "#111",
  margin: "8px 0",
  lineHeight: 1.4,
};

const optionsStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const optionButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "20px 16px",
  fontSize: 17,
  fontWeight: 800,
  color: "#111",
  background: "#f9fafb",
  border: "2px solid #111",
  borderRadius: 16,
  cursor: "pointer",
  boxShadow: "4px 4px 0px #111",
  textAlign: "left",
};

const resultTitleStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 900,
  color: "#111",
  margin: 0,
};

const resultSubStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#6b7280",
  margin: 0,
};

const menuCardStyle: React.CSSProperties = {
  display: "flex",
  gap: 14,
  border: "2px solid #111",
  borderRadius: 16,
  overflow: "hidden",
  background: "#fff",
  boxShadow: "3px 3px 0px #111",
};

const menuImageStyle: React.CSSProperties = {
  width: 100,
  height: 100,
  objectFit: "cover",
  flexShrink: 0,
};

const menuEmojiBgStyle: React.CSSProperties = {
  width: 100,
  height: 100,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 40,
  background: "#fef9c3",
};

const menuInfoStyle: React.CSSProperties = {
  flex: 1,
  padding: "12px 12px 12px 0",
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

const menuHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const menuRankStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 900,
  color: "#6b7280",
};

const menuNameStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 900,
  color: "#111",
  margin: 0,
};

const menuDescStyle: React.CSSProperties = {
  fontSize: 12,
  color: "#6b7280",
  margin: 0,
  lineHeight: 1.5,
};

const menuPriceStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 800,
  color: "#111",
  margin: 0,
};

const primaryButtonStyle: React.CSSProperties = {
  width: "100%",
  padding: "18px 0",
  fontSize: 17,
  fontWeight: 800,
  color: "#111",
  background: "#facc15",
  border: "2px solid #111",
  borderRadius: 999,
  cursor: "pointer",
  boxShadow: "4px 4px 0px #111",
};
