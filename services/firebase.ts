
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot,
  query, orderBy, where, serverTimestamp, getDoc, setDoc, Timestamp, getDocs,
  getDocFromServer
} from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence, sendPasswordResetEmail } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

import firebaseConfig from "../firebase-applet-config.json";

// Fix storage bucket if it's using the .app suffix which sometimes fails in certain environments
const config = {
  ...firebaseConfig,
  storageBucket: firebaseConfig.storageBucket.replace(".firebasestorage.app", ".appspot.com")
};

const app = initializeApp(config);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
export { Timestamp };

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

setPersistence(auth, browserLocalPersistence);

const MASTER_EMAIL = "giufarlosdias@hotmail.com";

export const dbService = {
  getUserProfile: async (uid: string) => {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      return snap.exists() ? snap.data() : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    }
  },

  resetPassword: async (email: string) => {
    return sendPasswordResetEmail(auth, email);
  },

  preRegisterReferral: async (email: string, phone: string, sponsor: any) => {
    try {
      // Verifica se já existe perfil para este email
      const q = query(collection(db, "users"), where("email", "==", email.toLowerCase()));
      const snap = await getDocs(q);
      if (!snap.empty) return null;

      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 3); // 3 dias de teste conforme pedido

      const tempId = `pre-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const profile = {
        uid: tempId, // ID temporário, será substituído no primeiro login
        email: email.toLowerCase(),
        phone: phone,
        officeName: `ESCRITÓRIO DE ${email.split('@')[0].toUpperCase()}`,
        role: 'admin',
        status: 'active',
        subscriptionStatus: 'TRIAL',
        createdAt: serverTimestamp(),
        subscriptionExpiresAt: Timestamp.fromDate(expiry),
        referralCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
        referredBy: sponsor.uid,
        lineage: {
          l1: sponsor.uid,
          l2: sponsor.lineage?.l1 || '',
          l3: sponsor.lineage?.l2 || ''
        }
      };

      await setDoc(doc(db, "users", tempId), profile);
      return profile;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "users");
    }
  },

  initProfile: async (uid: string, email: string, refCodeInput?: string) => {
    try {
      // Busca se existe um pré-cadastro pelo e-mail
      const qPre = query(collection(db, "users"), where("email", "==", email.toLowerCase()));
      const snapPre = await getDocs(qPre);
      
      if (!snapPre.empty) {
        const preData = snapPre.docs[0].data();
        const oldDocId = snapPre.docs[0].id;
        // Transfere o pré-cadastro para o UID real do Auth
        const finalProfile = { ...preData, uid };
        await setDoc(doc(db, "users", uid), finalProfile);
        if (oldDocId !== uid) await deleteDoc(doc(db, "users", oldDocId));
        return finalProfile;
      }

      const isMaster = email.toLowerCase() === MASTER_EMAIL.toLowerCase();
      let lineage = { l1: '', l2: '', l3: '' };
      let referredBy = '';

      if (refCodeInput) {
        const q = query(collection(db, "users"), where("referralCode", "==", refCodeInput.toUpperCase()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const sponsor = snap.docs[0].data();
          referredBy = sponsor.uid;
          lineage = {
            l1: sponsor.uid,
            l2: sponsor.lineage?.l1 || '',
            l3: sponsor.lineage?.l2 || ''
          };
        }
      }

      const profile = {
        uid, email,
        role: isMaster ? 'super-admin' : 'admin',
        status: 'active',
        subscriptionStatus: 'TRIAL',
        officeName: isMaster ? 'FACINDEMAIS Root' : `Escritório de ${email.split('@')[0]}`,
        phone: '', address: '', pixKey: '',
        createdAt: serverTimestamp(),
        subscriptionExpiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        referralCode: uid.substring(0, 6).toUpperCase(),
        referredBy, lineage
      };

      await setDoc(doc(db, "users", uid), profile);
      return profile;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    }
  },

  sync: (col: string, userId: string, cb: (data: any[]) => void) => {
    if (!auth.currentUser) {
      console.warn(`Attempted to sync ${col} without authentication.`);
      return () => {};
    }
    const q = query(collection(db, col), where("userId", "==", userId));
    return onSnapshot(q, (s) => {
      const data = s.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a: any, b: any) => {
        const timeA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : (a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0);
        const timeB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : (b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0);
        return timeB - timeA;
      });
      cb(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, col);
    });
  },

  add: (col: string, userId: string, data: any, userName?: string) => {
    try {
      return addDoc(collection(db, col), { 
        ...data, 
        userId, 
        createdBy: userName || 'Sistema',
        createdAt: serverTimestamp() 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, col);
    }
  },

  update: (col: string, id: string, data: any, userId?: string, userName?: string) => {
    try {
      const updateData = userId ? { 
        ...data, 
        updatedBy: userId, 
        updatedByName: userName || 'Sistema',
        updatedAt: serverTimestamp() 
      } : data;
      return updateDoc(doc(db, col, id), updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${col}/${id}`);
    }
  },

  del: (col: string, id: string) => {
    try {
      return deleteDoc(doc(db, col, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${col}/${id}`);
    }
  },

  updateProfile: (uid: string, data: any, userId?: string, userName?: string) => {
    try {
      const payload = {
        ...data,
        updatedAt: serverTimestamp(),
        updatedBy: userId || 'system',
        updatedByName: userName || 'System'
      };
      return updateDoc(doc(db, "users", uid), payload);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  },

  watchNetwork: (cb: (users: any[]) => void) => {
    return onSnapshot(collection(db, "users"), (s) => {
      cb(s.docs.map(d => ({ ...d.data(), uid: d.id })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "users");
    });
  },
  
  uploadVideo: async (userId: string, blob: Blob) => {
    try {
      const fileName = `ai_videos/${userId}/${Date.now()}.mp4`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Storage Error: ", error);
      throw error;
    }
  },

  uploadFile: async (userId: string, blob: Blob, extension: string) => {
    try {
      const fileName = `ai_assets/${userId}/${Date.now()}.${extension}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Storage Error: ", error);
      throw error;
    }
  }
};
