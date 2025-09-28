// src/services/trainingService.js
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
  serverTimestamp,
  limit,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { nanoid } from "nanoid"; // npm install nanoid

export class TrainingService {
  constructor() {
    this.collection = "trainings";
  }

  // Create new training session
  async createTraining(trainingData, trainerId) {
    try {
      const joinCode = nanoid(8).toUpperCase(); // Generate unique join code

      const training = {
        ...trainingData,
        trainerId,
        joinCode,
        participantIds: [],
        status: "active",
        isPublic: trainingData.isPublic || false,
        maxParticipants: trainingData.maxParticipants || null,
        registrationOpen: trainingData.registrationOpen !== false,
        scoringCategories: trainingData.scoringCategories || {
          positive: {
            participation: {
              name: "Active Participation",
              icon: "MessageSquare",
              points: 5,
            },
            punctuality: { name: "Punctuality", icon: "Clock", points: 3 },
            helpfulness: { name: "Helping Others", icon: "Users", points: 4 },
            excellence: { name: "Excellence", icon: "Star", points: 10 },
          },
          negative: {
            disruption: {
              name: "Disruption",
              icon: "AlertTriangle",
              points: -5,
            },
            lateness: { name: "Late Arrival", icon: "Clock", points: -2 },
            absence: { name: "Unexcused Absence", icon: "X", points: -10 },
          },
        },
        scoringScale: { min: -50, max: 50 },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, this.collection), training);
      return { id: docRef.id, ...training };
    } catch (error) {
      console.error("Error creating training:", error);
      throw new Error("Failed to create training session");
    }
  }

  // Get training by ID
  async getTraining(trainingId) {
    try {
      const trainingRef = doc(db, this.collection, trainingId);
      const trainingDoc = await getDoc(trainingRef);

      if (!trainingDoc.exists()) {
        throw new Error("Training session not found");
      }

      return { id: trainingDoc.id, ...trainingDoc.data() };
    } catch (error) {
      console.error("Error fetching training:", error);
      throw new Error("Failed to fetch training session");
    }
  }

  // Get training by join code
  async getTrainingByJoinCode(joinCode) {
    try {
      const q = query(
        collection(db, this.collection),
        where("joinCode", "==", joinCode.toUpperCase()),
        where("status", "==", "active"),
        where("registrationOpen", "==", true)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("Invalid or expired join code");
      }

      const trainingDoc = querySnapshot.docs[0];
      return { id: trainingDoc.id, ...trainingDoc.data() };
    } catch (error) {
      console.error("Error fetching training by join code:", error);
      throw new Error("Failed to find training session");
    }
  }

  // Get all trainings for a trainer
  async getTrainerTrainings(trainerId) {
    if (!trainerId) {
      console.warn("getTrainerTrainings called without trainerId");
      return [];
    }
    try {
      const q = query(
        collection(db, this.collection),
        where("trainerId", "==", trainerId),
        where("status", "==", "active"),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching trainer trainings:", error);
      throw new Error("Failed to fetch training sessions");
    }
  }

  // Update training
  async updateTraining(trainingId, updateData) {
    try {
      const trainingRef = doc(db, this.collection, trainingId);
      const updatedData = {
        ...updateData,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(trainingRef, updatedData);
      return { id: trainingId, ...updatedData };
    } catch (error) {
      console.error("Error updating training:", error);
      throw new Error("Failed to update training session");
    }
  }

  // Soft delete training
  async deleteTraining(trainingId) {
    try {
      const trainingRef = doc(db, this.collection, trainingId);
      await updateDoc(trainingRef, {
        status: "deleted",
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Error deleting training:", error);
      throw new Error("Failed to delete training session");
    }
  }

  // End/close training session
  async endTraining(trainingId) {
    try {
      const trainingRef = doc(db, this.collection, trainingId);
      await updateDoc(trainingRef, {
        status: "completed",
        endedAt: serverTimestamp(),
        registrationOpen: false,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Error ending training:", error);
      throw new Error("Failed to end training session");
    }
  }

  // Toggle registration
  async toggleRegistration(trainingId, isOpen) {
    try {
      const trainingRef = doc(db, this.collection, trainingId);
      await updateDoc(trainingRef, {
        registrationOpen: isOpen,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Error toggling registration:", error);
      throw new Error("Failed to update registration status");
    }
  }

  // Generate new join code
  async regenerateJoinCode(trainingId) {
    try {
      const newJoinCode = nanoid(8).toUpperCase();
      const trainingRef = doc(db, this.collection, trainingId);

      await updateDoc(trainingRef, {
        joinCode: newJoinCode,
        updatedAt: serverTimestamp(),
      });

      return newJoinCode;
    } catch (error) {
      console.error("Error regenerating join code:", error);
      throw new Error("Failed to generate new join code");
    }
  }

  // Get training statistics
  async getTrainingStats(trainingId) {
    try {
      const training = await this.getTraining(trainingId);

      // Get participants count (you'd integrate with ParticipantService here)
      const participantCount = training.participantIds?.length || 0;

      // Calculate other stats
      const stats = {
        totalParticipants: participantCount,
        maxParticipants: training.maxParticipants,
        registrationOpen: training.registrationOpen,
        status: training.status,
        daysRunning: training.createdAt
          ? Math.floor(
              (new Date() - training.createdAt.toDate()) / (1000 * 60 * 60 * 24)
            )
          : 0,
        joinCode: training.joinCode,
        joinUrl: `${window.location.origin}/join/${training.joinCode}`,
      };

      return stats;
    } catch (error) {
      console.error("Error fetching training stats:", error);
      throw new Error("Failed to fetch training statistics");
    }
  }

  // Search trainings (for public discovery)
  async searchPublicTrainings(searchTerm, limitCount = 20) {
    try {
      const q = query(
        collection(db, this.collection),
        where("status", "==", "active"),
        where("isPublic", "==", true),
        where("registrationOpen", "==", true),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const trainings = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Filter by search term if provided
        if (
          !searchTerm ||
          data.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          data.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          data.cohort?.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          trainings.push({
            id: doc.id,
            ...data,
            // Don't expose sensitive data in public search
            joinCode: undefined,
            trainerId: undefined,
          });
        }
      });

      return trainings;
    } catch (error) {
      console.error("Error searching public trainings:", error);
      throw new Error("Failed to search public training sessions");
    }
  }

  // Duplicate/clone training
  async cloneTraining(trainingId, newName) {
    try {
      const originalTraining = await this.getTraining(trainingId);

      const clonedTrainingData = {
        ...originalTraining,
        name: newName || `${originalTraining.name} (Copy)`,
        participantIds: [], // Start fresh with no participants
        status: "active",
        registrationOpen: true,
      };

      // Remove fields that shouldn't be cloned
      delete clonedTrainingData.id;
      delete clonedTrainingData.createdAt;
      delete clonedTrainingData.updatedAt;
      delete clonedTrainingData.endedAt;
      delete clonedTrainingData.deletedAt;

      return await this.createTraining(
        clonedTrainingData,
        originalTraining.trainerId
      );
    } catch (error) {
      console.error("Error cloning training:", error);
      throw new Error("Failed to clone training session");
    }
  }

  // Get training templates (predefined training configurations)
  getTrainingTemplates() {
    return [
      {
        id: "basic-workshop",
        name: "Basic Workshop",
        description: "Standard workshop with participation tracking",
        duration: "1 day",
        maxParticipants: 30,
        scoringCategories: {
          positive: {
            participation: {
              name: "Active Participation",
              icon: "MessageSquare",
              points: 5,
            },
            punctuality: { name: "Punctuality", icon: "Clock", points: 3 },
            helpfulness: { name: "Helping Others", icon: "Users", points: 4 },
          },
          negative: {
            disruption: {
              name: "Disruption",
              icon: "AlertTriangle",
              points: -3,
            },
            lateness: { name: "Late Arrival", icon: "Clock", points: -2 },
          },
        },
      },
      {
        id: "intensive-bootcamp",
        name: "Intensive Bootcamp",
        description: "Multi-day intensive with detailed scoring",
        duration: "5 days",
        maxParticipants: 20,
        scoringCategories: {
          positive: {
            participation: {
              name: "Active Participation",
              icon: "MessageSquare",
              points: 5,
            },
            punctuality: { name: "Punctuality", icon: "Clock", points: 3 },
            helpfulness: { name: "Helping Others", icon: "Users", points: 4 },
            excellence: { name: "Excellence", icon: "Star", points: 10 },
            leadership: { name: "Leadership", icon: "Crown", points: 8 },
            innovation: { name: "Innovation", icon: "Lightbulb", points: 7 },
          },
          negative: {
            disruption: {
              name: "Disruption",
              icon: "AlertTriangle",
              points: -5,
            },
            lateness: { name: "Late Arrival", icon: "Clock", points: -2 },
            absence: { name: "Unexcused Absence", icon: "X", points: -10 },
            unprepared: {
              name: "Came Unprepared",
              icon: "BookOpen",
              points: -3,
            },
          },
        },
      },
      {
        id: "team-building",
        name: "Team Building Session",
        description: "Focus on collaboration and team dynamics",
        duration: "4 hours",
        maxParticipants: 50,
        scoringCategories: {
          positive: {
            collaboration: {
              name: "Great Collaboration",
              icon: "Users",
              points: 8,
            },
            communication: {
              name: "Clear Communication",
              icon: "MessageSquare",
              points: 6,
            },
            positivity: { name: "Positive Attitude", icon: "Smile", points: 4 },
            creativity: {
              name: "Creative Thinking",
              icon: "Lightbulb",
              points: 7,
            },
          },
          negative: {
            negativity: {
              name: "Negative Attitude",
              icon: "Frown",
              points: -4,
            },
            nonparticipation: {
              name: "Non-participation",
              icon: "UserX",
              points: -6,
            },
          },
        },
      },
    ];
  }
}
