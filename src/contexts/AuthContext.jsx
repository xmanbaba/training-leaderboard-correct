// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { authService, userService } from "../services/firebaseService";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged(async (firebaseUser) => {
      try {
        setError(null);

        if (firebaseUser) {
          setUser(firebaseUser);

          // Fetch user profile from Firestore
          const profile = await userService.getUser(firebaseUser.uid);
          setUserProfile(profile);
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (err) {
        console.error("Auth state change error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Sign up function
  const signUp = async (email, password, userData) => {
    try {
      setError(null);
      setLoading(true);

      const user = await authService.register(email, password, userData);
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const user = await authService.signIn(email, password);
      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setError(null);
      await authService.signOut();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      setError(null);

      if (user) {
        await userService.updateUser(user.uid, updates);
        // Refresh user profile
        const updatedProfile = await userService.getUser(user.uid);
        setUserProfile(updatedProfile);
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Helper functions
  const isTrainer = () => userProfile?.role === "trainer";
  const isAdmin = () => userProfile?.role === "admin";
  const isParticipant = () => userProfile?.role === "participant";
  const isAuthenticated = () => !!user;

  const value = {
    // State
    user,
    userProfile,
    loading,
    error,

    // Auth functions
    signUp,
    signIn,
    signOut,
    updateProfile,

    // Helper functions
    isTrainer,
    isAdmin,
    isParticipant,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
