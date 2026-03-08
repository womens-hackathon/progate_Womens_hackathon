import { useState, useEffect } from 'react';
import { db } from '../firebase/database';
import { auth } from '../firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { APP_ID, STORAGE_KEYS } from '../appConfig';

// queueの合計人数をリアルタイムで返すフック
export function useWaitingCount(): number | null {
  const [waitingCount, setWaitingCount] = useState<number | null>(null);

  useEffect(() => {
    const tenpoId = localStorage.getItem(STORAGE_KEYS.tenpoId);
    if (!tenpoId) return;

    let unsub = () => {};

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      unsub();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];
      unsub = onSnapshot(
        query(
          collection(db, 'apps', APP_ID, 'general', tenpoId, 'queue'),
          where('status', '==', 'waiting'),
          where('date', '==', today),
        ),
        (snap) => setWaitingCount(snap.size)
      );
    });

    return () => {
      unsubAuth();
      unsub();
    };
  }, []);

  return waitingCount;
}
