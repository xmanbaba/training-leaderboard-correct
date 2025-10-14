// src/services/participantService.js - Fixed for guest users and team support
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
  generateGuestUserId,
} from "../config/firestoreSchema";

export class ParticipantService {
  constructor() {
    this.collection = collections.SESSION_PARTICIPANTS;
    this.sessionsCollection = collections.TRAINING_SESSIONS;
    this.activitiesCollection = collections.ACTIVITIES;
  }

  /**
   * Create new participant (supports both registered users and guests)
   * @param {Object} participantData - { name, email?, phone?, department?, team? }
   * @param {string} sessionId - The session ID
   * @param {string} [userId] - Optional: user ID if authenticated, otherwise creates guest
   */
  async createParticipant(participantData, sessionId, userId = null) {
    try {
      // Generate guest userId if none provided
      const effectiveUserId = userId || generateGuestUserId();
      const isGuest = !userId;

      // Generate the predictable participant ID
      const participantId = getSessionParticipantId(sessionId, effectiveUserId);

      // Check if participant already exists
      const existingDoc = await getDoc(doc(db, this.collection, participantId));
      if (existingDoc.exists() && existingDoc.data().isActive) {
        throw new Error("Participant already exists in this session");
      }

      const participant = {
        sessionId,
        userId: effectiveUserId,
        role: "participant",
        name: participantData.name?.trim() || "",
        email: participantData.email?.trim().toLowerCase() || null,
        phone: participantData.phone?.trim() || null,
        department: participantData.department?.trim() || null,
        team: participantData.team?.trim() || null,
        totalScore: 0,
        scores: {},
        badges: [],
        achievements: [],
        joinedAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        isActive: true,
        isGuest,
        connectionStatus: "active",
      };

      // Use setDoc with the specific ID
      await setDoc(doc(db, this.collection, participantId), participant);

      console.log("Participant created:", participantId, { isGuest });

      // Update session teams list if team is provided
      if (participant.team) {
        await this.addTeamToSession(sessionId, participant.team);
      }

      return { id: participantId, ...participant };
    } catch (error) {
      console.error("Error creating participant:", error);
      throw error;
    }
  }

  /**
   * Add a team to the session's teams array if it doesn't exist
   */
  async addTeamToSession(sessionId, teamName) {
    try {
      const sessionRef = doc(db, this.sessionsCollection, sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (sessionDoc.exists()) {
        const sessionData = sessionDoc.data();
        const currentTeams = sessionData.teams || [];

        if (!currentTeams.includes(teamName)) {
          await updateDoc(sessionRef, {
            teams: [...currentTeams, teamName],
            teamsEnabled: true,
            updatedAt: serverTimestamp(),
          });
          console.log(`Team "${teamName}" added to session ${sessionId}`);
        }
      }
    } catch (error) {
      console.error("Error adding team to session:", error);
      // Don't throw - team creation is optional
    }
  }

  /**
   * Get all participants for a session
   */
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

  /**
   * Real-time listener for participants in a session
   */
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

  /**
   * Update participant
   */
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

  /**
   * Soft delete participant
   */
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

  /**
   * Award/modify scores with activity log
   */
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

  /**
   * Create activity entry
   */
  async createActivity(activityData) {
    try {
      const activitiesRef = collection(db, this.activitiesCollection);
      const docRef = await addDoc(activitiesRef, activityData);
      console.log("Activity created with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Error creating activity:", error);
      throw error;
    }
  }

  /**
   * Get participant activity log
   */
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

  /**
   * Get session activities for dashboard
   */
  async getSessionActivities(sessionId, max = 100) {
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

  /**
   * Real-time listener for session activities
   */
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

  /**
   * Bulk upload participants - FIXED for guest users
   */
  async bulkCreateParticipants(participantsList, sessionId) {
    const results = { successful: [], failed: [], duplicates: [] };

    // Get existing participants to check for duplicates
    const existingParticipants = await this.getSessionParticipants(sessionId);
    const existingEmails = new Set(
      existingParticipants.map((p) => p.email?.toLowerCase()).filter((e) => e)
    );

    for (const participantData of participantsList) {
      try {
        // Validate required field
        if (!participantData.name || !participantData.name.trim()) {
          results.failed.push({
            data: participantData,
            error: "Name is required",
          });
          continue;
        }

        // Check for duplicate email if email is provided
        if (participantData.email) {
          const email = participantData.email.toLowerCase();
          if (existingEmails.has(email)) {
            results.duplicates.push({
              email: participantData.email,
              name: participantData.name,
            });
            continue;
          }
        }

        // Create participant as guest (no userId)
        const newParticipant = await this.createParticipant(
          participantData,
          sessionId
        );

        results.successful.push(newParticipant);

        // Add to existing emails set to prevent duplicates within this batch
        if (participantData.email) {
          existingEmails.add(participantData.email.toLowerCase());
        }
      } catch (error) {
        console.error("Error creating participant:", participantData, error);
        results.failed.push({
          data: participantData,
          error: error.message || "Unknown error",
        });
      }
    }

    return results;
  }

  /**
   * Get participant by ID
   */
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

  /**
   * Search participants
   */
  async searchParticipants(sessionId, searchTerm) {
    try {
      const participants = await this.getSessionParticipants(sessionId);
      const searchLower = searchTerm.toLowerCase();

      return participants.filter(
        (p) =>
          p.name?.toLowerCase().includes(searchLower) ||
          p.email?.toLowerCase().includes(searchLower) ||
          (p.department && p.department.toLowerCase().includes(searchLower)) ||
          (p.team && p.team.toLowerCase().includes(searchLower))
      );
    } catch (error) {
      console.error("Error searching participants:", error);
      throw new Error("Failed to search participants");
    }
  }

  /**
   * Get all teams in a session
   */
  async getSessionTeams(sessionId) {
    try {
      const participants = await this.getSessionParticipants(sessionId);
      const teams = [
        ...new Set(participants.map((p) => p.team).filter(Boolean)),
      ];

      return teams.map((teamName) => ({
        name: teamName,
        memberCount: participants.filter((p) => p.team === teamName).length,
        totalScore: participants
          .filter((p) => p.team === teamName)
          .reduce((sum, p) => sum + (p.totalScore || 0), 0),
      }));
    } catch (error) {
      console.error("Error fetching teams:", error);
      throw new Error("Failed to fetch teams");
    }
  }

  /**
   * Assign participant to a team
   */
  async assignTeam(participantId, teamName) {
    try {
      const participantRef = doc(db, this.collection, participantId);
      const participantDoc = await getDoc(participantRef);

      if (!participantDoc.exists()) {
        throw new Error("Participant not found");
      }

      const participantData = participantDoc.data();

      await updateDoc(participantRef, {
        team: teamName?.trim() || null,
        lastActive: serverTimestamp(),
      });

      // Add team to session if it doesn't exist
      if (teamName?.trim()) {
        await this.addTeamToSession(participantData.sessionId, teamName.trim());
      }

      return true;
    } catch (error) {
      console.error("Error assigning team:", error);
      throw new Error("Failed to assign team");
    }
  }

  /**
   * Update connection status (active, idle, disconnected, offline)
   */
  async updateConnectionStatus(participantId, status) {
    try {
      const participantRef = doc(db, this.collection, participantId);
      await updateDoc(participantRef, {
        connectionStatus: status,
        lastActive: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Error updating connection status:", error);
      throw new Error("Failed to update connection status");
    }
  }
}
