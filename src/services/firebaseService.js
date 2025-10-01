// src/services/firebaseService.js
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit as firestoreLimit,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { db, auth } from "../config/firebase";
import { collections, userRoles } from "../config/firestoreSchema";

// ===============================
// AUTHENTICATION SERVICES
// ===============================
export const authService = {
  // Register new user (store doc at /users/{uid})
  async register(email, password, userData) {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Create user document with UID as doc ID.
    await setDoc(doc(db, collections.USERS, user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: userData.displayName || "",
      role: userData.role || userRoles.PARTICIPANT,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return user;
  },

  async signIn(email, password) {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return userCredential.user;
  },

  async signOut() {
    await signOut(auth);
  },

  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  },
};

// ===============================
// SESSION SERVICES
// ===============================
export const sessionService = {
  // Create new session (any signed-in user can do this)
  async createSession(sessionData, creatorId, orgId = null) {
    const session = {
      ...sessionData,
      createdBy: creatorId,
      organizationId: orgId || null,
      sessionAdmins: [creatorId], // creator is always admin
      status: "active",
      registrationOpen: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, collections.SESSIONS), session);
    return { id: docRef.id, ...session };
  },

  async getSession(sessionId) {
    if (!sessionId) return null;
    const docRef = doc(db, collections.SESSIONS, sessionId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  },

  async getAdminSessions(userId) {
    if (!userId) return [];
    const q = query(
      collection(db, collections.SESSIONS),
      where("sessionAdmins", "array-contains", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async updateSession(sessionId, updates) {
    if (!sessionId) throw new Error("sessionId is required");
    const sessionRef = doc(db, collections.SESSIONS, sessionId);
    await updateDoc(sessionRef, { ...updates, updatedAt: serverTimestamp() });
  },

  async endSession(sessionId) {
    if (!sessionId) return;
    const sessionRef = doc(db, collections.SESSIONS, sessionId);
    await updateDoc(sessionRef, {
      status: "completed",
      registrationOpen: false,
      endedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },
};

// ===============================
// PARTICIPANT SERVICES
// ===============================
export const participantService = {
  async addParticipant(participantData) {
    const docRef = await addDoc(collection(db, collections.PARTICIPANTS), {
      ...participantData,
      joinedAt: serverTimestamp(),
      status: "active",
    });
    return docRef.id;
  },

  async getParticipantsBySession(sessionId) {
    if (!sessionId) return [];
    const q = query(
      collection(db, collections.PARTICIPANTS),
      where("sessionId", "==", sessionId),
      where("status", "==", "active")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async updateParticipant(participantId, updates) {
    if (!participantId) throw new Error("participantId required");
    await updateDoc(doc(db, collections.PARTICIPANTS, participantId), updates);
  },

  onParticipantsSnapshot(sessionId, callback) {
    if (!sessionId) return () => {};
    const q = query(
      collection(db, collections.PARTICIPANTS),
      where("sessionId", "==", sessionId),
      where("status", "==", "active")
    );
    return onSnapshot(q, callback);
  },
};

// ===============================
// SCORING SERVICES
// ===============================
export const scoringService = {
  async awardScore(scoreData) {
    const docRef = await addDoc(collection(db, collections.SCORES), {
      ...scoreData,
      timestamp: serverTimestamp(),
    });

    await addDoc(collection(db, collections.ACTIVITIES), {
      sessionId: scoreData.sessionId,
      participantId: scoreData.participantId,
      type: "score_awarded",
      description: `${scoreData.value > 0 ? "Earned" : "Lost"} ${Math.abs(
        scoreData.value
      )} points for ${scoreData.category}`,
      points: scoreData.value,
      category: scoreData.category,
      timestamp: serverTimestamp(),
    });

    return docRef.id;
  },

  async getScoresBySession(sessionId) {
    if (!sessionId) return [];
    const q = query(
      collection(db, collections.SCORES),
      where("sessionId", "==", sessionId),
      orderBy("timestamp", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  onScoresSnapshot(sessionId, callback) {
    if (!sessionId) return () => {};
    const q = query(
      collection(db, collections.SCORES),
      where("sessionId", "==", sessionId),
      orderBy("timestamp", "desc")
    );
    return onSnapshot(q, callback);
  },
};

// ===============================
// ACTIVITY SERVICES
// ===============================
export const activityService = {
  async getRecentActivities(sessionId, limitCount = 10) {
    if (!sessionId) return [];
    const q = query(
      collection(db, collections.ACTIVITIES),
      where("sessionId", "==", sessionId),
      orderBy("timestamp", "desc"),
      firestoreLimit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  onActivitiesSnapshot(sessionId, callback, limitCount = 10) {
    if (!sessionId) return () => {};
    const q = query(
      collection(db, collections.ACTIVITIES),
      where("sessionId", "==", sessionId),
      orderBy("timestamp", "desc"),
      firestoreLimit(limitCount)
    );
    return onSnapshot(q, callback);
  },
};

// ===============================
// USER SERVICES
// ===============================
export const userService = {
  async getUser(userId) {
    if (!userId) return null;
    const docSnap = await getDoc(doc(db, collections.USERS, userId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  },

  async updateUser(userId, updates) {
    if (!userId) throw new Error("userId required");
    const userRef = doc(db, collections.USERS, userId);
    await updateDoc(userRef, { ...updates, updatedAt: serverTimestamp() });
  },
};

// ===============================
// ORGANIZATION SERVICES
// ===============================
export const orgService = {
  async createOrganization(orgData, creatorId) {
    const org = {
      ...orgData,
      createdBy: creatorId,
      members: [creatorId],
      admins: [creatorId], // creator is org admin
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, collections.ORGANIZATIONS), org);
    return { id: docRef.id, ...org };
  },

  async getOrganization(orgId) {
    if (!orgId) return null;
    const docSnap = await getDoc(doc(db, collections.ORGANIZATIONS, orgId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  },
};
