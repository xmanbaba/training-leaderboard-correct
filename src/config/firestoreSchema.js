// src/config/firestoreSchema.js

/**
 * Firestore Collection Names
 */
export const collections = {
  USERS: "users",
  TRAINING_SESSIONS: "sessions",
  SESSION_PARTICIPANTS: "sessionParticipants",
  PARTICIPANTS: "participants", // Legacy - can be deprecated
  ACTIVITIES: "activities",
  ORGANIZATIONS: "organizations",
};

/**
 * Role Types
 */
export const roles = {
  ORG_ADMIN: "orgAdmin",
  SESSION_ADMIN: "sessionAdmin",
  PARTICIPANT: "participant",
};

/**
 * Session Status
 */
export const sessionStatus = {
  ACTIVE: "active",
  COMPLETED: "completed",
  DELETED: "deleted",
};

/**
 * Get the session participant document ID
 * Format: {sessionId}_{userId}
 * This creates a unique, predictable ID for each user-session relationship
 */
export const getSessionParticipantId = (sessionId, userId) => {
  if (!sessionId || !userId) {
    throw new Error(
      "Both sessionId and userId are required to generate participant ID"
    );
  }
  return `${sessionId}_${userId}`;
};

/**
 * Parse session participant ID back into components
 */
export const parseSessionParticipantId = (participantId) => {
  const parts = participantId.split("_");
  if (parts.length !== 2) {
    throw new Error("Invalid participant ID format");
  }
  return {
    sessionId: parts[0],
    userId: parts[1],
  };
};

/**
 * Firestore Document Schema Templates
 */

export const schemas = {
  // User Profile Schema
  user: (userData) => ({
    email: userData.email,
    displayName: userData.displayName || "",
    role: userData.role || roles.PARTICIPANT,
    photoURL: userData.photoURL || null,
    organizationId: userData.organizationId || null,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  }),

  // Session Schema
  session: (sessionData, creatorId) => ({
    name: sessionData.name,
    description: sessionData.description || "",
    cohort: sessionData.cohort || "",
    startDate: sessionData.startDate || null,
    endDate: sessionData.endDate || null,
    createdBy: creatorId,
    sessionAdmins: [creatorId], // Array of user IDs who can manage this session
    organizationId: sessionData.organizationId || null,
    joinCode: sessionData.joinCode,
    status: sessionStatus.ACTIVE,
    isPublic: sessionData.isPublic || false,
    maxParticipants: sessionData.maxParticipants || null,
    registrationOpen: sessionData.registrationOpen !== false,
    scoringCategories: sessionData.scoringCategories || {},
    scoringScale: sessionData.scoringScale || { min: -50, max: 50 },
    createdAt: new Date(),
    updatedAt: new Date(),
  }),

  // Session Participant Schema (Junction table)
  sessionParticipant: (sessionId, userId, role = roles.PARTICIPANT) => ({
    sessionId,
    userId,
    role, // 'sessionAdmin' or 'participant'
    totalScore: 0,
    scores: {}, // { categoryId: points }
    joinedAt: new Date(),
    lastActive: new Date(),
    isActive: true,
    // Additional participant data
    name: "",
    email: "",
    department: "",
    badges: [],
    achievements: [],
  }),

  // Activity/Score Change Log Schema
  activity: (activityData) => ({
    sessionId: activityData.sessionId,
    participantId: activityData.participantId,
    userId: activityData.userId,
    category: activityData.category,
    points: activityData.points,
    changedBy: activityData.changedBy, // User ID who made the change
    reason: activityData.reason || "",
    timestamp: new Date(),
    type: activityData.type || "score_change", // 'score_change', 'badge_earned', 'achievement'
  }),
};

/**
 * Validation Helpers
 */

export const validators = {
  isValidRole: (role) => {
    return Object.values(roles).includes(role);
  },

  isValidSessionStatus: (status) => {
    return Object.values(sessionStatus).includes(status);
  },

  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidJoinCode: (code) => {
    return typeof code === "string" && code.length >= 6 && code.length <= 12;
  },
};

/**
 * Query Helpers
 */

export const queryHelpers = {
  // Get all sessions where user is admin
  getUserAdminSessions: (userId) => ({
    collection: collections.TRAINING_SESSIONS,
    where: [
      ["sessionAdmins", "array-contains", userId],
      ["status", "==", sessionStatus.ACTIVE],
    ],
    orderBy: ["createdAt", "desc"],
  }),

  // Get all sessions where user is participant
  getUserParticipantSessions: (userId) => ({
    collection: collections.SESSION_PARTICIPANTS,
    where: [
      ["userId", "==", userId],
      ["isActive", "==", true],
    ],
  }),

  // Get all participants in a session
  getSessionParticipants: (sessionId) => ({
    collection: collections.SESSION_PARTICIPANTS,
    where: [
      ["sessionId", "==", sessionId],
      ["isActive", "==", true],
    ],
    orderBy: ["totalScore", "desc"],
  }),

  // Get recent activities for a session
  getSessionActivities: (sessionId, limitCount = 20) => ({
    collection: collections.ACTIVITIES,
    where: [["sessionId", "==", sessionId]],
    orderBy: ["timestamp", "desc"],
    limit: limitCount,
  }),
};

/**
 * Default Scoring Categories Template
 */
export const defaultScoringCategories = {
  positive: {
    participation: {
      name: "Active Participation",
      icon: "MessageSquare",
      points: 5,
      description: "Actively engaged in discussions",
    },
    punctuality: {
      name: "Punctuality",
      icon: "Clock",
      points: 3,
      description: "Arrived on time",
    },
    helpfulness: {
      name: "Helping Others",
      icon: "Users",
      points: 4,
      description: "Helped fellow participants",
    },
    excellence: {
      name: "Excellence",
      icon: "Star",
      points: 10,
      description: "Outstanding performance",
    },
  },
  negative: {
    disruption: {
      name: "Disruption",
      icon: "AlertTriangle",
      points: -5,
      description: "Disruptive behavior",
    },
    lateness: {
      name: "Late Arrival",
      icon: "Clock",
      points: -2,
      description: "Arrived late",
    },
    absence: {
      name: "Unexcused Absence",
      icon: "X",
      points: -10,
      description: "Absent without notice",
    },
  },
};

export default {
  collections,
  roles,
  sessionStatus,
  getSessionParticipantId,
  parseSessionParticipantId,
  schemas,
  validators,
  queryHelpers,
  defaultScoringCategories,
};
