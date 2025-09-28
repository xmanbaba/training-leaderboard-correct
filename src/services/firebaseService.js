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
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Create (or overwrite) user document with UID as doc ID.
      await setDoc(doc(db, collections.USERS, user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: userData.displayName || "",
        role: userData.role || userRoles.PARTICIPANT,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return user;
    } catch (error) {
      throw error;
    }
  },

  // Sign in user
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  },

  // Sign out user
  async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  },

  // Listen to auth state changes
  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, callback);
  },
};

// ===============================
// TRAINING SERVICES
// ===============================
export const trainingService = {
  // Create new training
  async createTraining(trainingData) {
    try {
      const docRef = await addDoc(collection(db, collections.TRAININGS), {
        ...trainingData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  // Get training by ID
  async getTraining(trainingId) {
    try {
      if (!trainingId) return null;
      const docSnap = await getDoc(doc(db, collections.TRAININGS, trainingId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      throw error;
    }
  },

  // Get trainings by trainer (safe if trainerId missing)
  async getTrainingsByTrainer(trainerId) {
    try {
      if (!trainerId) return []; // guard against undefined -> where(..., undefined)
      const q = query(
        collection(db, collections.TRAININGS),
        where("createdBy", "==", trainerId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      throw error;
    }
  },

  // Update training
  async updateTraining(trainingId, updates) {
    try {
      if (!trainingId) throw new Error("trainingId is required");
      await updateDoc(doc(db, collections.TRAININGS, trainingId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw error;
    }
  },

  // Listen to training changes
  onTrainingSnapshot(trainingId, callback) {
    if (!trainingId) return () => {};
    return onSnapshot(doc(db, collections.TRAININGS, trainingId), callback);
  },
};

// ===============================
// PARTICIPANT SERVICES
// ===============================
export const participantService = {
  // Add participant to training
  async addParticipant(participantData) {
    try {
      const docRef = await addDoc(collection(db, collections.PARTICIPANTS), {
        ...participantData,
        joinedAt: serverTimestamp(),
        status: "active",
      });
      return docRef.id;
    } catch (error) {
      throw error;
    }
  },

  // Get participants by training
  async getParticipantsByTraining(trainingId) {
    try {
      if (!trainingId) return [];
      const q = query(
        collection(db, collections.PARTICIPANTS),
        where("trainingId", "==", trainingId),
        where("status", "==", "active")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      throw error;
    }
  },

  // Update participant
  async updateParticipant(participantId, updates) {
    try {
      if (!participantId) throw new Error("participantId is required");
      await updateDoc(
        doc(db, collections.PARTICIPANTS, participantId),
        updates
      );
    } catch (error) {
      throw error;
    }
  },

  // Listen to participants changes (returns no-op if no trainingId)
  onParticipantsSnapshot(trainingId, callback) {
    if (!trainingId) return () => {};
    const q = query(
      collection(db, collections.PARTICIPANTS),
      where("trainingId", "==", trainingId),
      where("status", "==", "active")
    );
    return onSnapshot(q, callback);
  },
};

// ===============================
// SCORING SERVICES
// ===============================
export const scoringService = {
  // Award score to participant
  async awardScore(scoreData) {
    try {
      const docRef = await addDoc(collection(db, collections.SCORES), {
        ...scoreData,
        timestamp: serverTimestamp(),
      });

      // Also log this as an activity
      await addDoc(collection(db, collections.ACTIVITIES), {
        trainingId: scoreData.trainingId,
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
    } catch (error) {
      throw error;
    }
  },

  // Get scores for participant
  async getParticipantScores(participantId, trainingId) {
    try {
      if (!participantId || !trainingId) return [];
      const q = query(
        collection(db, collections.SCORES),
        where("participantId", "==", participantId),
        where("trainingId", "==", trainingId),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      throw error;
    }
  },

  // Get all scores for a training
  async getTrainingScores(trainingId) {
    try {
      if (!trainingId) return [];
      const q = query(
        collection(db, collections.SCORES),
        where("trainingId", "==", trainingId),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      throw error;
    }
  },

  // Listen to scores changes
  onScoresSnapshot(trainingId, callback) {
    if (!trainingId) return () => {};
    const q = query(
      collection(db, collections.SCORES),
      where("trainingId", "==", trainingId),
      orderBy("timestamp", "desc")
    );
    return onSnapshot(q, callback);
  },
};

// ===============================
// ACTIVITY SERVICES
// ===============================
export const activityService = {
  // Get recent activities for training (limitCount default 10)
  async getRecentActivities(trainingId, limitCount = 10) {
    try {
      if (!trainingId) return [];
      const q = query(
        collection(db, collections.ACTIVITIES),
        where("trainingId", "==", trainingId),
        orderBy("timestamp", "desc"),
        firestoreLimit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      throw error;
    }
  },

  // Listen to activities changes
  onActivitiesSnapshot(trainingId, callback, limitCount = 10) {
    if (!trainingId) return () => {};
    const q = query(
      collection(db, collections.ACTIVITIES),
      where("trainingId", "==", trainingId),
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
  // Get user by UID (doc id == uid)
  async getUser(userId) {
    try {
      if (!userId) return null;
      const docRef = doc(db, collections.USERS, userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      throw error;
    }
  },

  // Update user (doc id == uid)
  async updateUser(userId, updates) {
    try {
      if (!userId) throw new Error("userId is required");
      const userDocRef = doc(db, collections.USERS, userId);
      await updateDoc(userDocRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      throw error;
    }
  },
};
