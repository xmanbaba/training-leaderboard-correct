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
  const [userRole, setUserRole] = useState(null); // 'trainer' | 'participant' | null
  const [sessions, setSessions] = useState([]); // All sessions user is part of
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user's sessions on mount/auth change
  useEffect(() => {
    if (!user) {
      setCurrentSession(null);
      setUserRole(null);
      setSessions([]);
      setLoading(false);
      return;
    }

    loadUserSessions();
  }, [user]);

  // Listen to current session changes
  useEffect(() => {
    if (!currentSession?.id || !user) return;

    const participantId = getSessionParticipantId(currentSession.id, user.uid);
    const unsubscribe = onSnapshot(
      doc(db, collections.SESSION_PARTICIPANTS, participantId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setUserRole(data.role);
        }
      },
      (err) => {
        console.error("Error listening to session participant:", err);
      }
    );

    return () => unsubscribe();
  }, [currentSession?.id, user]);

  const loadUserSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query all sessionParticipants where userId matches
      const q = query(
        collection(db, collections.SESSION_PARTICIPANTS),
        where("userId", "==", user.uid)
      );

      const participantSnap = await getDocs(q);

      if (participantSnap.empty) {
        setSessions([]);
        setLoading(false);
        return;
      }

      // Get all session details
      const sessionPromises = participantSnap.docs.map(
        async (participantDoc) => {
          const participantData = participantDoc.data();
          const sessionDoc = await getDoc(
            doc(db, collections.TRAINING_SESSIONS, participantData.sessionId)
          );

          if (sessionDoc.exists()) {
            return {
              ...sessionDoc.data(),
              id: sessionDoc.id,
              userRole: participantData.role,
              participantData: participantData,
            };
          }
          return null;
        }
      );

      const sessionsList = (await Promise.all(sessionPromises)).filter(Boolean);
      setSessions(sessionsList);

      // Auto-select most recent session if none selected
      if (!currentSession && sessionsList.length > 0) {
        const mostRecent = sessionsList.sort(
          (a, b) =>
            b.participantData.joinedAt?.toMillis() -
            a.participantData.joinedAt?.toMillis()
        )[0];
        setCurrentSession(mostRecent);
        setUserRole(mostRecent.userRole);
      }
    } catch (err) {
      console.error("Error loading sessions:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectSession = (sessionId) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
      setUserRole(session.userRole);

      // Store in localStorage for persistence
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
          const updated = {
            ...sessionDoc.data(),
            id: sessionDoc.id,
            userRole: participantDoc.data().role,
            participantData: participantDoc.data(),
          };

          setCurrentSession(updated);
          setUserRole(updated.userRole);

          // Update in sessions list
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
    setUserRole(null);
    localStorage.removeItem("lastSessionId");
  };

  const isTrainer = () => userRole === "trainer";
  const isParticipant = () => userRole === "participant";

  const value = {
    currentSession,
    userRole,
    sessions,
    loading,
    error,
    selectSession,
    refreshCurrentSession,
    clearSession,
    loadUserSessions,
    isTrainer,
    isParticipant,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
};
