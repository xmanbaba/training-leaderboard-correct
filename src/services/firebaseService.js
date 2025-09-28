// src/services/firebaseService.js
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
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
  // Register new user
  async register(email, password, userData) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Create user document in Firestore
      await addDoc(collection(db, collections.USERS), {
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
      const docSnap = await getDoc(doc(db, collections.TRAININGS, trainingId));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      throw error;
    }
  },

  // Get trainings by trainer
  async getTrainingsByTrainer(trainerId) {
    try {
      const q = query(
        collection(db, collections.TRAININGS),
        where("createdBy", "==", trainerId),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      throw error;
    }
  },

  // Update training
  async updateTraining(trainingId, updates) {
    try {
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
      const q = query(
        collection(db, collections.PARTICIPANTS),
        where("trainingId", "==", trainingId),
        where("status", "==", "active")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      throw error;
    }
  },

  // Update participant
  async updateParticipant(participantId, updates) {
    try {
      await updateDoc(
        doc(db, collections.PARTICIPANTS, participantId),
        updates
      );
    } catch (error) {
      throw error;
    }
  },

  // Listen to participants changes
  onParticipantsSnapshot(trainingId, callback) {
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
      const q = query(
        collection(db, collections.SCORES),
        where("participantId", "==", participantId),
        where("trainingId", "==", trainingId),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      throw error;
    }
  },

  // Get all scores for a training
  async getTrainingScores(trainingId) {
    try {
      const q = query(
        collection(db, collections.SCORES),
        where("trainingId", "==", trainingId),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      throw error;
    }
  },

  // Listen to scores changes
  onScoresSnapshot(trainingId, callback) {
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
  // Get recent activities for training
  async getRecentActivities(trainingId, limit = 10) {
    try {
      const q = query(
        collection(db, collections.ACTIVITIES),
        where("trainingId", "==", trainingId),
        orderBy("timestamp", "desc"),
        limit(limit)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      throw error;
    }
  },

  // Listen to activities changes
  onActivitiesSnapshot(trainingId, callback, limit = 10) {
    const q = query(
      collection(db, collections.ACTIVITIES),
      where("trainingId", "==", trainingId),
      orderBy("timestamp", "desc"),
      limit(limit)
    );
    return onSnapshot(q, callback);
  },
};

// ===============================
// USER SERVICES
// ===============================

export const userService = {
  // Get user by ID
  async getUser(userId) {
    try {
      const q = query(
        collection(db, collections.USERS),
        where("uid", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data(),
        };
      }
      return null;
    } catch (error) {
      throw error;
    }
  },

  // Update user
  async updateUser(userId, updates) {
    try {
      // First find the user document
      const q = query(
        collection(db, collections.USERS),
        where("uid", "==", userId)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDocId = querySnapshot.docs[0].id;
        await updateDoc(doc(db, collections.USERS, userDocId), {
          ...updates,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      throw error;
    }
  },
};
