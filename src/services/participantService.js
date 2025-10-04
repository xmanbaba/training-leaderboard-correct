// src/services/participantService.js
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
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

export class ParticipantService {
  constructor() {
    this.collection = "participants";
    this.sessionsCollection = "sessions";
    this.scoresCollection = "scores";
    this.activitiesCollection = "activities";
  }

  // Create new participant
  async createParticipant(participantData, sessionId) {
    try {
      const participant = {
        ...participantData,
        sessionId,
        totalScore: 0,
        scores: {},
        level: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "active",
      };

      const docRef = await addDoc(collection(db, this.collection), participant);

      // Don't add to session.participants array - we use sessionParticipants collection instead
      console.log("Participant created:", docRef.id);

      return { id: docRef.id, ...participant };
    } catch (error) {
      console.error("Error creating participant:", error);
      throw new Error("Failed to create participant");
    }
  }

  // Get all participants for a session
  async getSessionParticipants(sessionId) {
    try {
      const q = query(
        collection(db, this.collection),
        where("sessionId", "==", sessionId),
        where("status", "==", "active"),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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
        where("status", "==", "active"),
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
      const updatedData = { ...updateData, updatedAt: serverTimestamp() };

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
        status: "inactive",
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
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
        level: Math.floor(newTotalScore / 10) + 1,
        updatedAt: serverTimestamp(),
      });

      // Log activity
      await this.createActivity({
        sessionId: participantData.sessionId,
        participantId,
        type: "score_awarded",
        description: `${
          changeAmount > 0 ? "+" : ""
        }${changeAmount} points in ${category}`,
        points: changeAmount,
        category,
        reason,
        awardedBy: trainerId,
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

  // Create activity entry
  async createActivity(activityData) {
    try {
      await addDoc(collection(db, this.activitiesCollection), activityData);
    } catch (error) {
      console.error("Error creating activity:", error);
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

  // Bulk upload participants
  async bulkCreateParticipants(participantsList, sessionId) {
    const results = { successful: [], failed: [], duplicates: [] };

    for (const participantData of participantsList) {
      try {
        // Check for duplicates by email
        const existingQuery = query(
          collection(db, this.collection),
          where("email", "==", participantData.email),
          where("sessionId", "==", sessionId)
        );

        const existingDocs = await getDocs(existingQuery);

        if (!existingDocs.empty) {
          results.duplicates.push({
            email: participantData.email,
            name: participantData.name,
          });
          continue;
        }

        const newParticipant = await this.createParticipant(
          participantData,
          sessionId
        );
        results.successful.push(newParticipant);
      } catch (error) {
        results.failed.push({ data: participantData, error: error.message });
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
          p.name.toLowerCase().includes(searchLower) ||
          p.email.toLowerCase().includes(searchLower) ||
          (p.department && p.department.toLowerCase().includes(searchLower)) ||
          (p.phone && p.phone.includes(searchTerm))
      );
    } catch (error) {
      console.error("Error searching participants:", error);
      throw new Error("Failed to search participants");
    }
  }
}
