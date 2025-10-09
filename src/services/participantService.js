// src/services/participantService.js
import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import { db } from "../config/firebase";
import {
  collections,
  getSessionParticipantId,
} from "../config/firestoreSchema";

export class ParticipantService {
  constructor() {
    // USE THE CORRECT COLLECTION
    this.collection = collections.SESSION_PARTICIPANTS; // "sessionParticipants"
    this.sessionsCollection = collections.TRAINING_SESSIONS;
    this.activitiesCollection = collections.ACTIVITIES;
  }

  // Create new participant in sessionParticipants collection
  async createParticipant(participantData, sessionId, userId) {
    try {
      // Generate the predictable participant ID
      const participantId = getSessionParticipantId(sessionId, userId);

      const participant = {
        sessionId,
        userId,
        role: "participant",
        name: participantData.name || "",
        email: participantData.email || "",
        department: participantData.department || "",
        totalScore: 0,
        scores: {},
        badges: [],
        achievements: [],
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        isActive: true,
      };

      // Use setDoc with the specific ID instead of addDoc
      await setDoc(doc(db, this.collection, participantId), participant);

      console.log("Participant created:", participantId);
      return { id: participantId, ...participant };
    } catch (error) {
      console.error("Error creating participant:", error);
      throw new Error("Failed to create participant");
    }
  }

  // Get all participants for a session from sessionParticipants
  async getSessionParticipants(sessionId) {
    try {
      const q = query(
        collection(db, this.collection),
        where("sessionId", "==", sessionId),
        where("isActive", "==", true),
        orderBy("totalScore", "desc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching participants:", error);
      throw new Error("Failed to fetch participants");
    }
  }

  // Real-time listener for participants in a session
  subscribeToSessionParticipants(sessionId, callback) {
    try {
      const q = query(
        collection(db, this.collection),
        where("sessionId", "==", sessionId),
        where("isActive", "==", true),
        orderBy("totalScore", "desc")
      );

      return onSnapshot(q, (querySnapshot) => {
        const participants = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(participants);
      });
    } catch (error) {
      console.error("Error setting up participants listener:", error);
      throw new Error("Failed to set up real-time listener");
    }
  }

  // Update participant
  async updateParticipant(participantId, updateData) {
    try {
      const participantRef = doc(db, this.collection, participantId);
      const updatedData = {
        ...updateData,
        lastActive: serverTimestamp(),
      };

      await updateDoc(participantRef, updatedData);
      return { id: participantId, ...updatedData };
    } catch (error) {
      console.error("Error updating participant:", error);
      throw new Error("Failed to update participant");
    }
  }

  // Soft delete participant
  async deleteParticipant(participantId) {
    try {
      const participantRef = doc(db, this.collection, participantId);
      await updateDoc(participantRef, {
        isActive: false,
        lastActive: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Error deleting participant:", error);
      throw new Error("Failed to delete participant");
    }
  }

  // Award/modify scores with activity log
  async updateParticipantScore(
    participantId,
    category,
    changeAmount,
    trainerId,
    reason = ""
  ) {
    try {
      const participantRef = doc(db, this.collection, participantId);
      const participantDoc = await getDoc(participantRef);

      if (!participantDoc.exists()) throw new Error("Participant not found");

      const participantData = participantDoc.data();
      const currentScores = participantData.scores || {};
      const currentCategoryScore = currentScores[category] || 0;
      const newCategoryScore = currentCategoryScore + changeAmount;

      const newScores = { ...currentScores, [category]: newCategoryScore };
      const newTotalScore = Object.values(newScores).reduce(
        (sum, score) => sum + score,
        0
      );

      // Update participant
      await updateDoc(participantRef, {
        scores: newScores,
        totalScore: newTotalScore,
        lastActive: serverTimestamp(),
      });

      // Log activity
      await this.createActivity({
        sessionId: participantData.sessionId,
        participantId,
        userId: participantData.userId,
        type: "score_change",
        description: `${
          changeAmount > 0 ? "+" : ""
        }${changeAmount} points in ${category}`,
        points: changeAmount,
        category,
        reason,
        changedBy: trainerId,
        timestamp: serverTimestamp(),
      });

      return {
        participantId,
        category,
        newCategoryScore,
        newTotalScore,
        changeAmount,
      };
    } catch (error) {
      console.error("Error updating participant score:", error);
      throw new Error("Failed to update score");
    }
  }

  // Create activity entry - FIXED
  async createActivity(activityData) {
    try {
      const activitiesRef = collection(db, this.activitiesCollection);
      // Use addDoc instead of setDoc(doc()) to auto-generate ID
      const docRef = await addDoc(activitiesRef, activityData);
      console.log("Activity created with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error creating activity:", error);
      throw error; // Re-throw to handle upstream
    }
  }

  // Get participant activity log
  async getParticipantActivities(participantId, max = 50) {
    try {
      const q = query(
        collection(db, this.activitiesCollection),
        where("participantId", "==", participantId),
        orderBy("timestamp", "desc"),
        limit(max)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching activities:", error);
      throw new Error("Failed to fetch activities");
    }
  }

  // Get session activities for dashboard
  async getSessionActivities(sessionId, max = 50) {
    try {
      const q = query(
        collection(db, this.activitiesCollection),
        where("sessionId", "==", sessionId),
        orderBy("timestamp", "desc"),
        limit(max)
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching session activities:", error);
      throw new Error("Failed to fetch session activities");
    }
  }

  // Real-time listener for session activities
  subscribeToSessionActivities(sessionId, callback, max = 50) {
    try {
      const q = query(
        collection(db, this.activitiesCollection),
        where("sessionId", "==", sessionId),
        orderBy("timestamp", "desc"),
        limit(max)
      );

      return onSnapshot(q, (querySnapshot) => {
        const activities = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(activities);
      });
    } catch (error) {
      console.error("Error setting up activities listener:", error);
      throw new Error("Failed to set up activities listener");
    }
  }

  // Bulk upload participants
  async bulkCreateParticipants(participantsList, sessionId) {
    const results = { successful: [], failed: [], duplicates: [] };

    for (const participantData of participantsList) {
      try {
        // Check for duplicates by userId
        if (!participantData.userId) {
          results.failed.push({
            data: participantData,
            error: "Missing userId",
          });
          continue;
        }

        const participantId = getSessionParticipantId(
          sessionId,
          participantData.userId
        );

        // Check if already exists
        const existingDoc = await getDoc(
          doc(db, this.collection, participantId)
        );

        if (existingDoc.exists()) {
          results.duplicates.push({
            email: participantData.email,
            name: participantData.name,
          });
          continue;
        }

        const newParticipant = await this.createParticipant(
          participantData,
          sessionId,
          participantData.userId
        );
        results.successful.push(newParticipant);
      } catch (error) {
        results.failed.push({
          data: participantData,
          error: error.message,
        });
      }
    }

    return results;
  }

  // Get participant by ID
  async getParticipant(participantId) {
    try {
      const participantRef = doc(db, this.collection, participantId);
      const participantDoc = await getDoc(participantRef);

      if (!participantDoc.exists()) throw new Error("Participant not found");

      return { id: participantDoc.id, ...participantDoc.data() };
    } catch (error) {
      console.error("Error fetching participant:", error);
      throw new Error("Failed to fetch participant");
    }
  }

  // Search participants
  async searchParticipants(sessionId, searchTerm) {
    try {
      const participants = await this.getSessionParticipants(sessionId);
      const searchLower = searchTerm.toLowerCase();

      return participants.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchLower) ||
          p.email?.toLowerCase().includes(searchLower) ||
          (p.department && p.department.toLowerCase().includes(searchLower))
      );
    } catch (error) {
      console.error("Error searching participants:", error);
      throw new Error("Failed to search participants");
    }
  }
}
