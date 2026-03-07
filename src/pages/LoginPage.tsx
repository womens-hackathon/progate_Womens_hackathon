import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../firebase/database';
import { auth } from '../firebase/auth';
import { signInAnonymously } from 'firebase/auth';
import { STORAGE_KEYS } from '../appConfig';
import { 
  doc, 
  setDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp, 
  orderBy,
  getCountFromServer 
} from 'firebase/firestore';

export default function Room() {
  const navigate = useNavigate();
  const { id: tenpoId } = useParams();
  const [userName, setUserName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [waitingCount, setWaitingCount] = useState(0);
  const [myOrder, setMyOrder] = useState<number | null>(null);

  const APP_ID = 'first_app';
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEYS.nickname)) {
      navigate('/games');
    }
  }, [navigate]);

  // 1. 匿名ログイン & 登録処理
  const handleRegister = async () => {
    if (!userName.trim() || !tenpoId) return;

    try {
      // A. 匿名認証
      const userCredential = await signInAnonymously(auth);
      const uid = userCredential.user.uid;

      // B. 今日の通し番号（order）を決定する
      const qCount = query(
        collection(db, 'apps', APP_ID, 'general', tenpoId, 'queue'),
        where('date', '==', today)
      );
      const snapshot = await getCountFromServer(qCount);
      const newOrder = snapshot.data().count + 1;

      // C. usersコレクションに基本情報を保存
      await setDoc(doc(db, 'apps', APP_ID, 'users', uid), {
        nickname: userName,
        lastSeenAt: serverTimestamp(),
        activeTenpoId: tenpoId
      });

      // D. 店舗のqueueサブコレクションに予約情報を登録
      const queueRef = doc(db, 'apps', APP_ID, 'general', tenpoId, 'queue', uid);
      await setDoc(queueRef, {
        uid: uid,
        nickname: userName,
        status: 'waiting',
        enteredAt: serverTimestamp(),
        date: today,
        order: newOrder
      });

      localStorage.setItem(STORAGE_KEYS.nickname, userName);
      localStorage.setItem(STORAGE_KEYS.tenpoId, tenpoId);
      setMyOrder(newOrder);
      setIsRegistered(true);
    } catch (e) {
      console.error("登録エラー:", e);
    }
  };

  // 2. 待ち人数のリアルタイム監視
  useEffect(() => {
    if (!isRegistered || !tenpoId || !auth.currentUser) return;

    const uid = auth.currentUser.uid;

    // 自分の予約情報を監視（店側でstatusが変わったのを検知するため）
    const myDocRef = doc(db, 'apps', APP_ID, 'general', tenpoId, 'queue', uid);
    const unsubMyDoc = onSnapshot(myDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.status === 'completed') {
          // 店側でチェックされたらリセット
          setIsRegistered(false);
          setUserName('');
          localStorage.removeItem('guest_name');
        }
      }
    });

    // 自分より前に並んでいる人数（待ち人数）をリアルタイムカウント
    const q = query(
      collection(db, 'apps', APP_ID, 'general', tenpoId, 'queue'),
      where('date', '==', today),
      where('status', '==', 'waiting'),
      orderBy('enteredAt', 'asc')
    );

    const unsubQueue = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs;
      const myIndex = docs.findIndex(d => d.id === uid);
      if (myIndex !== -1) {
        setWaitingCount(myIndex); 
      }
    });

    return () => {
      unsubMyDoc();
      unsubQueue();
    };
  }, [isRegistered, tenpoId, today]);

  // --- 画面A: 名前入力（予約前） ---
  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-black">
        <div className="w-full max-w-sm space-y-6">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-center">
            WHO ARE <br /> <span className="text-[#ff3344]">YOU?</span>
          </h1>
          <input
            type="text"
            placeholder="お名前を入力..."
            className="w-full border-4 border-black p-4 font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] outline-none"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <button
            onClick={handleRegister}
            className="w-full bg-[#ff3344] text-white font-black py-4 text-xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
          >
            順番待ちに並ぶ
          </button>
        </div>
      </div>
    );
  }

  // --- 画面B: 待ち状況確認 ---
  return (
    <div className="min-h-screen bg-white p-6 font-sans text-black flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Registration No. {myOrder}</p>
          <h2 className="text-6xl font-black italic tracking-tighter underline decoration-[#ff3344] decoration-8">
            {waitingCount === 0 ? "NEXT UP!" : `WAITING: ${waitingCount}`}
          </h2>
        </div>

        <div className="border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white relative overflow-hidden">
          {/* 背景に薄く番号を入れるとおしゃれ */}
          <span className="absolute -right-2 -bottom-4 text-8xl font-black text-gray-50 italic -z-10">#{myOrder}</span>
          
          <p className="text-sm font-bold text-gray-400 mb-1 uppercase tracking-widest">Guest</p>
          <p className="text-3xl font-black italic">{userName}</p>
          
          <hr className="my-6 border-2 border-black border-dashed" />
          
          <p className="text-md font-bold uppercase leading-tight">
            {waitingCount === 0 
              ? "まもなく呼ばれます。店内の近くでお待ちください。" 
              : `あなたの前に ${waitingCount} 人待っています。`}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase">
            店側のチェックでこの画面は自動更新されます
          </p>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-[#ff3344] rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-[#ff3344] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-[#ff3344] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          </div>
        </div>

        <button
          onClick={() => navigate('/games')}
          className="w-full bg-[#111] text-white font-black py-4 text-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
        >
          待ち時間にゲームをプレイ
        </button>
      </div>
    </div>
  );
}
