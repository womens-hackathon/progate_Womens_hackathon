import { useState, useEffect } from 'react';
import { db } from '../firebase/database';
import { collection, onSnapshot } from 'firebase/firestore';
import { APP_ID, STORAGE_KEYS } from '../appConfig';

// queueの合計人数をリアルタイムで返すフック
export function useWaitingCount(): number | null {
  const [waitingCount, setWaitingCount] = useState<number | null>(null);

  useEffect(() => {
    const tenpoId = localStorage.getItem(STORAGE_KEYS.tenpoId);
    if (!tenpoId) return;

    const unsub = onSnapshot(
      collection(db, 'apps', APP_ID, 'general', tenpoId, 'queue'),
      (snap) => setWaitingCount(snap.size)
    );

    return () => unsub();
  }, []);

  return waitingCount;
}
