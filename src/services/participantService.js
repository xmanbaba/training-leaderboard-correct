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
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../config/firebase";

export class ParticipantService {
  constructor() {
    this.collection = "participants";
    this.trainingsCollection = "trainings";
    this.scoresCollection = "scores";
    this.auditCollection = "score_audit";
  }

  // Create new participant
  async createParticipant(participantData, trainingId) {
    try {
      const participant = {
        ...participantData,
        trainingIds: [trainingId],
        totalScore: 0,
        scores: {},
        level: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: "active",
      };

      const docRef = await addDoc(collection(db, this.collection), participant);

      // Add participant to training
      await this.addParticipantToTraining(trainingId, docRef.id);

      return { id: docRef.id, ...participant };
    } catch (error) {
      console.error("Error creating participant:", error);
      throw new Error("Failed to create participant");
    }
  }

  // Get all participants for a training
  async getTrainingParticipants(trainingId) {
    try {
      const q = query(
        collection(db, this.collection),
        where("trainingIds", "array-contains", trainingId),
        where("status", "==", "active"),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const participants = [];

      querySnapshot.forEach((doc) => {
        participants.push({ id: doc.id, ...doc.data() });
      });

      return participants;
    } catch (error) {
      console.error("Error fetching participants:", error);
      throw new Error("Failed to fetch participants");
    }
  }

  // Real-time listener for participants
  subscribeToTrainingParticipants(trainingId, callback) {
    try {
      const q = query(
        collection(db, this.collection),
        where("trainingIds", "array-contains", trainingId),
        where("status", "==", "active"),
        orderBy("totalScore", "desc")
      );

      return onSnapshot(q, (querySnapshot) => {
        const participants = [];
        querySnapshot.forEach((doc) => {
          participants.push({ id: doc.id, ...doc.data() });
        });
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
        updatedAt: serverTimestamp(),
      };

      await updateDoc(participantRef, updatedData);
      return { id: participantId, ...updatedData };
    } catch (error) {
      console.error("Error updating participant:", error);
      throw new Error("Failed to update participant");
    }
  }

  // Soft delete participant (set status to inactive)
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

  // Award/modify scores with audit trail
  async updateParticipantScore(
    participantId,
    category,
    changeAmount,
    trainerId,
    reason = ""
  ) {
    try {
      // Get current participant data
      const participantRef = doc(db, this.collection, participantId);
      const participantDoc = await getDoc(participantRef);

      if (!participantDoc.exists()) {
        throw new Error("Participant not found");
      }

      const participantData = participantDoc.data();
      const currentScores = participantData.scores || {};
      const currentCategoryScore = currentScores[category] || 0;
      const newCategoryScore = currentCategoryScore + changeAmount;

      // Calculate new total score
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

      // Create audit trail
      await this.createScoreAudit({
        participantId,
        trainerId,
        category,
        previousScore: currentCategoryScore,
        newScore: newCategoryScore,
        changeAmount,
        previousTotalScore: participantData.totalScore || 0,
        newTotalScore,
        reason,
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

  // Create score audit entry
  async createScoreAudit(auditData) {
    try {
      await addDoc(collection(db, this.auditCollection), auditData);
    } catch (error) {
      console.error("Error creating score audit:", error);
      // Don't throw here as this is supplementary
    }
  }

  // Get score audit trail for participant
  async getParticipantAuditTrail(participantId, limit = 50) {
    try {
      const q = query(
        collection(db, this.auditCollection),
        where("participantId", "==", participantId),
        orderBy("timestamp", "desc"),
        limit(limit)
      );

      const querySnapshot = await getDocs(q);
      const auditTrail = [];

      querySnapshot.forEach((doc) => {
        auditTrail.push({ id: doc.id, ...doc.data() });
      });

      return auditTrail;
    } catch (error) {
      console.error("Error fetching audit trail:", error);
      throw new Error("Failed to fetch audit trail");
    }
  }

  // Bulk upload participants
  async bulkCreateParticipants(participantsList, trainingId) {
    try {
      const results = {
        successful: [],
        failed: [],
        duplicates: [],
      };

      for (const participantData of participantsList) {
        try {
          // Check for duplicates by email
          const existingQuery = query(
            collection(db, this.collection),
            where("email", "==", participantData.email),
            where("trainingIds", "array-contains", trainingId)
          );

          const existingDocs = await getDocs(existingQuery);

          if (!existingDocs.empty) {
            results.duplicates.push({
              email: participantData.email,
              name: participantData.name,
            });
            continue;
          }

          // Create participant
          const newParticipant = await this.createParticipant(
            participantData,
            trainingId
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
    } catch (error) {
      console.error("Error in bulk upload:", error);
      throw new Error("Failed to process bulk upload");
    }
  }

  // Add participant to training
  async addParticipantToTraining(trainingId, participantId) {
    try {
      const trainingRef = doc(db, this.trainingsCollection, trainingId);
      await updateDoc(trainingRef, {
        participantIds: arrayUnion(participantId),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding participant to training:", error);
      // Don't throw as this is supplementary
    }
  }

  // Remove participant from training
  async removeParticipantFromTraining(trainingId, participantId) {
    try {
      const trainingRef = doc(db, this.trainingsCollection, trainingId);
      await updateDoc(trainingRef, {
        participantIds: arrayRemove(participantId),
        updatedAt: serverTimestamp(),
      });

      // Update participant's training list
      const participantRef = doc(db, this.collection, participantId);
      await updateDoc(participantRef, {
        trainingIds: arrayRemove(trainingId),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error removing participant from training:", error);
      throw new Error("Failed to remove participant from training");
    }
  }

  // Get participant by ID
  async getParticipant(participantId) {
    try {
      const participantRef = doc(db, this.collection, participantId);
      const participantDoc = await getDoc(participantRef);

      if (!participantDoc.exists()) {
        throw new Error("Participant not found");
      }

      return { id: participantDoc.id, ...participantDoc.data() };
    } catch (error) {
      console.error("Error fetching participant:", error);
      throw new Error("Failed to fetch participant");
    }
  }

  // Search participants
  async searchParticipants(trainingId, searchTerm) {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a simple implementation. Consider using Algolia for advanced search
      const participants = await this.getTrainingParticipants(trainingId);

      const searchLower = searchTerm.toLowerCase();
      return participants.filter(
        (participant) =>
          participant.name.toLowerCase().includes(searchLower) ||
          participant.email.toLowerCase().includes(searchLower) ||
          (participant.department &&
            participant.department.toLowerCase().includes(searchLower)) ||
          (participant.phone && participant.phone.includes(searchTerm))
      );
    } catch (error) {
      console.error("Error searching participants:", error);
      throw new Error("Failed to search participants");
    }
  }
}
