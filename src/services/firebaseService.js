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
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
} from "firebase/auth";
import { db, auth } from "../config/firebase";
import { collections, roles } from "../config/firestoreSchema";

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
      role: userData.role || roles.PARTICIPANT,
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

  // Google Sign In
  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("profile");
      provider.addScope("email");

      // Try popup first (works better on desktop)
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document exists
      const userDoc = await getDoc(doc(db, collections.USERS, user.uid));

      if (!userDoc.exists()) {
        // Create new user document for first-time Google sign-in
        await setDoc(doc(db, collections.USERS, user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || "",
          photoURL: user.photoURL || null,
          role: roles.PARTICIPANT,
          provider: "google",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        // Update last login time for existing user
        await updateDoc(doc(db, collections.USERS, user.uid), {
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      return user;
    } catch (error) {
      // If popup blocked, fall back to redirect
      if (error.code === "auth/popup-blocked") {
        const provider = new GoogleAuthProvider();
        provider.addScope("profile");
        provider.addScope("email");
        await signInWithRedirect(auth, provider);
        return null; // Will be handled by getRedirectResult
      }
      throw error;
    }
  },

  // Handle redirect result (for mobile or when popup is blocked)
  async getRedirectResult() {
    try {
      const result = await getRedirectResult(auth);
      if (result && result.user) {
        const user = result.user;

        // Check if user document exists
        const userDoc = await getDoc(doc(db, collections.USERS, user.uid));

        if (!userDoc.exists()) {
          // Create new user document
          await setDoc(doc(db, collections.USERS, user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "",
            photoURL: user.photoURL || null,
            role: roles.PARTICIPANT,
            provider: "google",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          // Update last login
          await updateDoc(doc(db, collections.USERS, user.uid), {
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        return user;
      }
      return null;
    } catch (error) {
      console.error("Error getting redirect result:", error);
      throw error;
    }
  },

  // Password Reset
  async sendPasswordResetEmail(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: "Password reset email sent successfully",
      };
    } catch (error) {
      console.error("Error sending password reset email:", error);
      throw error;
    }
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

    const docRef = await addDoc(
      collection(db, collections.TRAINING_SESSIONS),
      session
    );
    return { id: docRef.id, ...session };
  },

  async getSession(sessionId) {
    if (!sessionId) return null;
    const docRef = doc(db, collections.TRAINING_SESSIONS, sessionId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  },

  async getAdminSessions(userId) {
    if (!userId) return [];
    const q = query(
      collection(db, collections.TRAINING_SESSIONS),
      where("sessionAdmins", "array-contains", userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  async updateSession(sessionId, updates) {
    if (!sessionId) throw new Error("sessionId is required");
    const sessionRef = doc(db, collections.TRAINING_SESSIONS, sessionId);
    await updateDoc(sessionRef, { ...updates, updatedAt: serverTimestamp() });
  },

  async endSession(sessionId) {
    if (!sessionId) return;
    const sessionRef = doc(db, collections.TRAINING_SESSIONS, sessionId);
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
    // Note: SCORES collection not defined in firestoreSchema, using generic name
    const docRef = await addDoc(collection(db, "scores"), {
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
      collection(db, "scores"),
      where("sessionId", "==", sessionId),
      orderBy("timestamp", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  onScoresSnapshot(sessionId, callback) {
    if (!sessionId) return () => {};
    const q = query(
      collection(db, "scores"),
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
