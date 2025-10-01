// src/config/firestoreSchema.js
// This file documents our Firestore database structure (hybrid: sessions-first, org-ready)

/*
FIRESTORE COLLECTIONS STRUCTURE:

1. users/
   - userId (document ID)
   - Fields:
     - email: string
     - displayName: string
     - photoURL?: string
     - createdAt: timestamp
     - updatedAt: timestamp
     - lastLogin?: timestamp
     - activeSessionId?: string   // helps with "lock-in" flow

2. organizations/  (optional layer for companies/schools/etc)
   - orgId (document ID)
   - Fields:
     - name: string
     - createdBy: userId
     - createdAt: timestamp
     - members: array of userIds
     - orgAdmins: array of userIds
     - settings: {
         allowOrgWideAdmins: boolean
         defaultScoringCategories?: object
       }

3. sessions/
   - sessionId (document ID)
   - Fields:
     - name: string
     - description?: string
     - createdBy: userId (session creator → auto SessionAdmin)
     - createdAt: timestamp
     - updatedAt: timestamp
     - organizationId?: orgId   // null if standalone
     - sessionAdmins: array of userIds
     - status: "draft" | "active" | "completed" | "cancelled"
     - startDate?: timestamp
     - endDate?: timestamp
     - settings: {
         allowSelfRegistration: boolean
         publicLeaderboard: boolean
         emailNotifications: boolean
         achievementBadges: boolean
       }
     - registrationCode?: string  // for self-registration
     - maxParticipants?: number

4. participants/
   - sessions/{sessionId}/participants/{participantId}
   - Fields:
     - userId?: string   // null if external guest
     - name: string
     - email?: string
     - phone?: string
     - teamId?: string
     - joinedAt: timestamp
     - status: "active" | "inactive" | "completed"

5. teams/
   - sessions/{sessionId}/teams/{teamId}
   - Fields:
     - name: string
     - createdBy: userId
     - createdAt: timestamp
     - participants: array of participantIds
     - score: number

6. scores/
   - sessions/{sessionId}/scores/{scoreId}
   - Fields:
     - participantId: string
     - category: string (e.g., "attendance", "questions_asked")
     - value: number
     - awardedBy: userId (SessionAdmin who gave the score)
     - reason?: string
     - timestamp: timestamp
     - type: "positive" | "negative"

7. activities/
   - sessions/{sessionId}/activities/{activityId}
   - Fields:
     - participantId?: string
     - teamId?: string
     - type: "score_awarded" | "level_up" | "badge_earned" | "participant_joined"
     - description: string
     - points?: number
     - category?: string
     - timestamp: timestamp
     - metadata: object

8. achievements/
   - sessions/{sessionId}/achievements/{achievementId}
   - Fields:
     - participantId: string
     - type: "level" | "badge" | "milestone"
     - name: string
     - description: string
     - earnedAt: timestamp
     - metadata: object

SECURITY RULES CONSIDERATIONS:
- Users can only read/write their own user document.
- SessionAdmins can manage sessions they’re assigned to.
- OrgAdmins can manage everything under their org (including all sessions).
- Participants can only read session data; they cannot write scores or change session settings.
*/

export const collections = {
  USERS: "users",
  ORGANIZATIONS: "organizations",
  SESSIONS: "sessions",
  PARTICIPANTS: "participants",
  TEAMS: "teams",
  SCORES: "scores",
  ACTIVITIES: "activities",
  ACHIEVEMENTS: "achievements",
};

export const userRoles = {
  ORG_ADMIN: "orgAdmin",
  SESSION_ADMIN: "sessionAdmin",
  PARTICIPANT: "participant",
};

export const sessionStatus = {
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
