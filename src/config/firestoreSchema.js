// src/config/firestoreSchema.js
// This file documents our Firestore database structure

/*
FIRESTORE COLLECTIONS STRUCTURE:

1. users/
   - userId (document ID)
   - Fields:
     - email: string
     - displayName: string
     - role: "admin" | "trainer" | "participant"
     - createdAt: timestamp
     - updatedAt: timestamp
     - profilePicture?: string

2. organizations/
   - orgId (document ID)
   - Fields:
     - name: string
     - createdBy: userId
     - members: array of userIds
     - settings: object
     - createdAt: timestamp

3. trainings/
   - trainingId (document ID)
   - Fields:
     - name: string
     - description: string
     - organizationId: string
     - createdBy: userId (trainer)
     - startDate: timestamp
     - endDate: timestamp
     - status: "draft" | "active" | "completed" | "cancelled"
     - maxParticipants?: number
     - participants: array of userIds
     - scoringScale: { min: number, max: number }
     - settings: {
       - allowSelfRegistration: boolean
       - publicLeaderboard: boolean
       - emailNotifications: boolean
       - achievementBadges: boolean
     }
     - registrationCode: string (for self-registration)
     - createdAt: timestamp
     - updatedAt: timestamp

4. participants/
   - participantId (document ID)
   - Fields:
     - userId: string
     - trainingId: string
     - name: string
     - email: string
     - phone?: string
     - department?: string
     - groupId?: string
     - joinedAt: timestamp
     - status: "active" | "inactive" | "completed"

5. groups/
   - groupId (document ID)
   - Fields:
     - name: string
     - trainingId: string
     - participantIds: array of participantIds
     - createdBy: userId
     - createdAt: timestamp

6. scores/
   - scoreId (document ID)
   - Fields:
     - participantId: string
     - trainingId: string
     - category: string (e.g., "attendance", "questions_asked")
     - value: number
     - awardedBy: userId (trainer who gave the score)
     - reason?: string
     - timestamp: timestamp
     - type: "positive" | "negative"

7. activities/
   - activityId (document ID)
   - Fields:
     - trainingId: string
     - participantId?: string
     - groupId?: string
     - type: "score_awarded" | "level_up" | "badge_earned" | "participant_joined"
     - description: string
     - points?: number
     - category?: string
     - timestamp: timestamp
     - metadata: object (flexible for different activity types)

8. achievements/
   - achievementId (document ID)
   - Fields:
     - participantId: string
     - trainingId: string
     - type: "level" | "badge" | "milestone"
     - name: string
     - description: string
     - earnedAt: timestamp
     - metadata: object

SECURITY RULES CONSIDERATIONS:
- Users can only read/write their own user document
- Trainers can manage trainings they created
- Participants can only read training data, not modify scores
- Admins have full access within their organization
*/

// Helper functions for Firestore operations
export const collections = {
  USERS: "users",
  ORGANIZATIONS: "organizations",
  TRAININGS: "trainings",
  PARTICIPANTS: "participants",
  GROUPS: "groups",
  SCORES: "scores",
  ACTIVITIES: "activities",
  ACHIEVEMENTS: "achievements",
};

export const userRoles = {
  ADMIN: "admin",
  TRAINER: "trainer",
  PARTICIPANT: "participant",
};

export const trainingStatus = {
  DRAFT: "draft",
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const activityTypes = {
  SCORE_AWARDED: "score_awarded",
  LEVEL_UP: "level_up",
  BADGE_EARNED: "badge_earned",
  PARTICIPANT_JOINED: "participant_joined",
};
