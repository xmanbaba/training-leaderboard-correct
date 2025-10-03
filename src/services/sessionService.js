// src/services/sessionService.js
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
  serverTimestamp,
  limit,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { nanoid } from "nanoid";
import {
  collections,
  getSessionParticipantId,
  schemas,
} from "../config/firestoreSchema";

export class SessionService {
  constructor() {
    this.collection = collections.TRAINING_SESSIONS;
  }

  // Create new session AND add creator as sessionAdmin participant
  async createSession(sessionData, adminId) {
    try {
      const joinCode = nanoid(8).toUpperCase();

      const session = {
        ...sessionData,
        createdBy: adminId,
        sessionAdmins: [adminId],
        joinCode,
        status: "active",
        isPublic: sessionData.isPublic || false,
        maxParticipants: sessionData.maxParticipants || null,
        registrationOpen: sessionData.registrationOpen !== false,
        scoringCategories: sessionData.scoringCategories || {
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
        scoringScale: sessionData.scoringScale || { min: -50, max: 50 },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Create session document
      const docRef = await addDoc(collection(db, this.collection), session);
      const sessionId = docRef.id;

      // CRITICAL: Create sessionParticipant record for the admin
      const participantId = getSessionParticipantId(sessionId, adminId);
      const participantData = schemas.sessionParticipant(
        sessionId,
        adminId,
        "sessionAdmin"
      );

      await setDoc(
        doc(db, collections.SESSION_PARTICIPANTS, participantId),
        participantData
      );

      console.log("Created session and admin participant:", {
        sessionId,
        participantId,
      });

      return { id: sessionId, ...session, joinCode };
    } catch (error) {
      console.error("Error creating session:", error);
      throw new Error("Failed to create session: " + error.message);
    }
  }

  // Get session by ID
  async getSession(sessionId) {
    try {
      const sessionRef = doc(db, this.collection, sessionId);
      const sessionDoc = await getDoc(sessionRef);

      if (!sessionDoc.exists()) {
        throw new Error("Session not found");
      }

      return { id: sessionDoc.id, ...sessionDoc.data() };
    } catch (error) {
      console.error("Error fetching session:", error);
      throw new Error("Failed to fetch session");
    }
  }

  // Get session by join code
  async getSessionByJoinCode(joinCode) {
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

      const sessionDoc = querySnapshot.docs[0];
      return { id: sessionDoc.id, ...sessionDoc.data() };
    } catch (error) {
      console.error("Error fetching session by join code:", error);
      throw new Error("Failed to find session");
    }
  }

  // Get all sessions for an admin
  async getAdminSessions(adminId) {
    if (!adminId) {
      console.warn("getAdminSessions called without adminId");
      return [];
    }
    try {
      const q = query(
        collection(db, this.collection),
        where("sessionAdmins", "array-contains", adminId),
        where("status", "==", "active"),
        orderBy("createdAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error fetching admin sessions:", error);
      throw new Error("Failed to fetch admin sessions");
    }
  }

  // Update session
  async updateSession(sessionId, updateData) {
    try {
      const sessionRef = doc(db, this.collection, sessionId);
      const updatedData = {
        ...updateData,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(sessionRef, updatedData);
      return { id: sessionId, ...updatedData };
    } catch (error) {
      console.error("Error updating session:", error);
      throw new Error("Failed to update session");
    }
  }

  // Soft delete session
  async deleteSession(sessionId) {
    try {
      const sessionRef = doc(db, this.collection, sessionId);
      await updateDoc(sessionRef, {
        status: "deleted",
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Error deleting session:", error);
      throw new Error("Failed to delete session");
    }
  }

  // End/close session
  async endSession(sessionId) {
    try {
      const sessionRef = doc(db, this.collection, sessionId);
      await updateDoc(sessionRef, {
        status: "completed",
        endedAt: serverTimestamp(),
        registrationOpen: false,
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error("Error ending session:", error);
      throw new Error("Failed to end session");
    }
  }

  // Toggle registration
  async toggleRegistration(sessionId, isOpen) {
    try {
      const sessionRef = doc(db, this.collection, sessionId);
      await updateDoc(sessionRef, {
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
  async regenerateJoinCode(sessionId) {
    try {
      const newJoinCode = nanoid(8).toUpperCase();
      const sessionRef = doc(db, this.collection, sessionId);

      await updateDoc(sessionRef, {
        joinCode: newJoinCode,
        updatedAt: serverTimestamp(),
      });

      return newJoinCode;
    } catch (error) {
      console.error("Error regenerating join code:", error);
      throw new Error("Failed to generate new join code");
    }
  }

  // Get session statistics
  async getSessionStats(sessionId) {
    try {
      const session = await this.getSession(sessionId);

      // Get participant count from sessionParticipants collection
      const participantsQuery = query(
        collection(db, collections.SESSION_PARTICIPANTS),
        where("sessionId", "==", sessionId),
        where("isActive", "==", true)
      );
      const participantsSnapshot = await getDocs(participantsQuery);
      const participantCount = participantsSnapshot.size || 0;

      const stats = {
        totalParticipants: participantCount,
        maxParticipants: session.maxParticipants,
        registrationOpen: session.registrationOpen,
        status: session.status,
        daysRunning: session.createdAt
          ? Math.floor(
              (new Date() - session.createdAt.toDate()) / (1000 * 60 * 60 * 24)
            )
          : 0,
        joinCode: session.joinCode,
        joinUrl: `${window.location.origin}/join/${session.joinCode}`,
      };

      return stats;
    } catch (error) {
      console.error("Error fetching session stats:", error);
      throw new Error("Failed to fetch session statistics");
    }
  }

  // Search sessions
  async searchPublicSessions(searchTerm, limitCount = 20) {
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
      const sessions = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (
          !searchTerm ||
          data.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          data.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          data.cohort?.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          sessions.push({
            id: doc.id,
            ...data,
            joinCode: undefined,
            sessionAdmins: undefined,
          });
        }
      });

      return sessions;
    } catch (error) {
      console.error("Error searching public sessions:", error);
      throw new Error("Failed to search public sessions");
    }
  }

  // Clone session
  async cloneSession(sessionId, newName, adminId) {
    try {
      const originalSession = await this.getSession(sessionId);

      const clonedSessionData = {
        ...originalSession,
        name: newName || `${originalSession.name} (Copy)`,
        status: "active",
        registrationOpen: true,
      };

      delete clonedSessionData.id;
      delete clonedSessionData.endedAt;
      delete clonedSessionData.deletedAt;
      delete clonedSessionData.createdAt;
      delete clonedSessionData.updatedAt;

      return await this.createSession(clonedSessionData, adminId);
    } catch (error) {
      console.error("Error cloning session:", error);
      throw new Error("Failed to clone session");
    }
  }

  // Get session templates
  getSessionTemplates() {
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
