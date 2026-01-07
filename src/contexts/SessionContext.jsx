// src/contexts/SessionContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import {
  doc,
  collection,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../config/firebase";
import {
  collections,
  getSessionParticipantId,
} from "../config/firestoreSchema";

const SessionContext = createContext();

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return context;
};

export const SessionProvider = ({ children }) => {
  const { user } = useAuth();

  const [currentSession, setCurrentSession] = useState(null);
  const [sessions, setSessions] = useState([]); // all sessions user is part of
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user's sessions on mount/auth change
  useEffect(() => {
    if (!user) {
      setCurrentSession(null);
      setSessions([]);
      setLoading(false);
      return;
    }
    loadUserSessions();
  }, [user]);

  // Listen to current session participant doc changes
  useEffect(() => {
    if (!currentSession?.id || !user) return;

    const participantId = getSessionParticipantId(currentSession.id, user.uid);
    const unsubscribe = onSnapshot(
      doc(db, collections.SESSION_PARTICIPANTS, participantId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setCurrentSession((prev) => ({
            ...prev,
            roles: {
              sessionAdmin: data.role === "sessionAdmin",
              participant: data.role === "participant",
              orgAdmin: data.orgAdmin || false,
            },
            participantData: data,
          }));
        }
      },
      (err) => console.error("Error listening to session participant:", err)
    );

    return () => unsubscribe();
  }, [currentSession?.id, user]);

  const loadUserSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const q = query(
        collection(db, collections.SESSION_PARTICIPANTS),
        where("userId", "==", user.uid),
        where("isActive", "==", true)
      );

      const participantSnap = await getDocs(q);

      if (participantSnap.empty) {
        setSessions([]);
        setCurrentSession(null);
        setLoading(false);
        return;
      }

      console.log(`Found ${participantSnap.size} session participant records`);

      // Get session details and build roles object
      const sessionPromises = participantSnap.docs.map(
        async (participantDoc) => {
          const participantData = participantDoc.data();
          console.log("Participant data:", participantData);

          const sessionDoc = await getDoc(
            doc(db, collections.TRAINING_SESSIONS, participantData.sessionId)
          );

          if (sessionDoc.exists()) {
            const sessionData = sessionDoc.data();

            // CRITICAL: Filter out deleted sessions
            if (sessionData.status === "deleted") {
              console.log(`Filtering out deleted session: ${sessionDoc.id}`);
              return null;
            }

            console.log("Found session:", sessionDoc.id, sessionData.name);

            const roles = {
              sessionAdmin: participantData.role === "sessionAdmin",
              participant: participantData.role === "participant",
              orgAdmin: participantData.orgAdmin || false,
            };

            return {
              ...sessionData,
              id: sessionDoc.id,
              roles,
              participantData,
            };
          }
          console.warn("Session not found:", participantData.sessionId);
          return null;
        }
      );

      const sessionsList = (await Promise.all(sessionPromises)).filter(Boolean);
      console.log("Loaded sessions:", sessionsList);
      setSessions(sessionsList);

      // If current session is deleted or doesn't exist, clear it
      if (currentSession) {
        const currentStillExists = sessionsList.find(
          (s) => s.id === currentSession.id
        );
        if (!currentStillExists) {
          console.log("Current session no longer exists, clearing");
          setCurrentSession(null);
        }
      }

      // Auto-select most recent session if none selected
  //     if (!currentSession && sessionsList.length > 0) {
  //       const mostRecent = sessionsList.sort(
  //         (a, b) =>
  //           b.participantData.joinedAt?.toMillis() -
  //           a.participantData.joinedAt?.toMillis()
  //       )[0];
  //       setCurrentSession(mostRecent);
  //     }
  //   } catch (err) {
  //     console.error("Error loading sessions:", err);
  //     setError(err.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const selectSession = (sessionId) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
      localStorage.setItem("lastSessionId", sessionId);
    }
  };

  const refreshCurrentSession = async () => {
    if (!currentSession?.id) return;
    try {
      const sessionDoc = await getDoc(
        doc(db, collections.TRAINING_SESSIONS, currentSession.id)
      );
      if (sessionDoc.exists()) {
        const participantId = getSessionParticipantId(
          currentSession.id,
          user.uid
        );
        const participantDoc = await getDoc(
          doc(db, collections.SESSION_PARTICIPANTS, participantId)
        );
        if (participantDoc.exists()) {
          const data = participantDoc.data();
          const updated = {
            ...sessionDoc.data(),
            id: sessionDoc.id,
            roles: {
              sessionAdmin: data.role === "sessionAdmin",
              participant: data.role === "participant",
              orgAdmin: data.orgAdmin || false,
            },
            participantData: data,
          };
          setCurrentSession(updated);
          setSessions((prev) =>
            prev.map((s) => (s.id === updated.id ? updated : s))
          );
        }
      }
    } catch (err) {
      console.error("Error refreshing session:", err);
    }
  };

  const clearSession = () => {
    setCurrentSession(null);
    localStorage.removeItem("lastSessionId");
  };

  // Role helpers
  const isSessionAdmin = () => currentSession?.roles?.sessionAdmin;
  const isOrgAdmin = () => currentSession?.roles?.orgAdmin;
  const isParticipant = () => currentSession?.roles?.participant;

  const value = {
    currentSession,
    sessions,
    loading,
    error,
    selectSession,
    refreshCurrentSession,
    clearSession,
    loadUserSessions,
    isSessionAdmin,
    isOrgAdmin,
    isParticipant,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};
