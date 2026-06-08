import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "../lib/firebase";
import type { AdminUser } from "../types";

export type AdminSession =
  | { status: "loading"; user: null; message?: string }
  | { status: "signed-out"; user: null; message?: string }
  | { status: "signed-in"; user: AdminUser; message?: string };

const DEMO_ADMIN_KEY = "hm-cheff-demo-admin";

function toAdminUser(user: User, isDemo = false): AdminUser {
  return {
    uid: user.uid,
    email: user.email,
    isDemo,
  };
}

function getDemoSession(): AdminSession {
  const raw = window.localStorage.getItem(DEMO_ADMIN_KEY);
  if (!raw) {
    return {
      status: "signed-out",
      user: null,
      message: "Firebase yapılandırılmadı. Demo yönetim modu yerel verileri kullanıyor.",
    };
  }

  return {
    status: "signed-in",
    user: {
      uid: "demo-admin",
      email: raw,
      isDemo: true,
    },
    message: "Firebase yapılandırılmadı. Demo yönetim modu yerel verileri kullanıyor.",
  };
}

export function subscribeAdminSession(
  callback: (session: AdminSession) => void,
) {
  if (!isFirebaseConfigured || !auth) {
    callback(getDemoSession());
    const onStorage = (event: StorageEvent) => {
      if (event.key === DEMO_ADMIN_KEY) callback(getDemoSession());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }

  const firebaseAuth = auth;

  return onAuthStateChanged(firebaseAuth, async (user) => {
    if (!user) {
      callback({ status: "signed-out", user: null });
      return;
    }

    const token = await user.getIdTokenResult(true);
    if (token.claims.admin !== true) {
      await signOut(firebaseAuth);
      callback({
        status: "signed-out",
        user: null,
        message: "Bu Firebase kullanıcısında admin yetkisi yok.",
      });
      return;
    }

    callback({ status: "signed-in", user: toAdminUser(user) });
  });
}

export async function signInAdmin(email: string, password: string) {
  if (!isFirebaseConfigured || !auth) {
    window.localStorage.setItem(DEMO_ADMIN_KEY, email || "admin@hmcheff.local");
    return;
  }

  const credential = await signInWithEmailAndPassword(auth, email, password);
  const token = await credential.user.getIdTokenResult(true);
  if (token.claims.admin !== true) {
    await signOut(auth);
    throw new Error("Bu Firebase kullanıcısında admin yetkisi yok.");
  }
}

export async function signOutAdmin() {
  if (!isFirebaseConfigured || !auth) {
    window.localStorage.removeItem(DEMO_ADMIN_KEY);
    return;
  }

  await signOut(auth);
}

export async function getCurrentAdminToken() {
  if (!isFirebaseConfigured || !auth?.currentUser) return "";
  return auth.currentUser.getIdToken();
}
