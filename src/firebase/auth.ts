import { app } from "./config";
import { getAuth, onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";

export const auth = getAuth(app);

export async function ensureAuth() {
  if (auth.currentUser) return auth.currentUser;

  const existing = await new Promise<User | null>(
    (resolve, reject) => {
      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          unsubscribe();
          resolve(user);
        },
        (error) => {
          unsubscribe();
          reject(error);
        }
      );
    }
  );

  if (existing) return existing;

  const result = await signInAnonymously(auth);
  return result.user;
}
