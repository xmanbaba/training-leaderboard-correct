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
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);


  useEffect(() => {
    // Check for redirect result first (for Google sign-in)
    const checkRedirectResult = async () => {
      try {
        await authService.getRedirectResult();
      } catch (err) {
        console.error("Redirect result error:", err);
      }
    };
    checkRedirectResult();

    // Set up auth state listener
    useEffect(() => {
      const unsubscribe = authService.onAuthStateChanged(
        async (firebaseUser) => {
          try {
            setError(null);

            if (firebaseUser) {
              setUser(firebaseUser);
              const profile = await userService.getUser(firebaseUser.uid);
              setUserProfile(profile);
            } else {
              setUser(null);
              setUserProfile(null);
            }
          } catch (err) {
            setError(err.message);
          } finally {
            setAuthReady(true);
          }
        }
      );

      return unsubscribe;
    }, []);


    return unsubscribe;
  }, []);

  // Sign up function
  const signUp = async (email, password, userData) => {
    try {
      setError(null);
      setAuthLoading(true);
      return await authService.register(email, password, userData);
    } finally {
      setAuthLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setError(null);
      setAuthLoading(true);
      return await authService.signIn(email, password);
    } finally {
      setAuthLoading(false);
    }
  };

  // Google Sign In
  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);

      const user = await authService.signInWithGoogle();
      // If null returned, it means redirect was initiated
      if (user) {
        return user;
      }
    } catch (err) {
      const errorMessage =
        err.code === "auth/popup-closed-by-user"
          ? "Sign-in cancelled. Please try again."
          : err.message;
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Password Reset
  const resetPassword = async (email) => {
    try {
      setError(null);
      setLoading(true);

      const result = await authService.sendPasswordResetEmail(email);
      return result;
    } catch (err) {
      let errorMessage = "Failed to send password reset email";

      // Provide user-friendly error messages
      if (err.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address";
      } else if (err.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address";
      } else if (err.code === "auth/too-many-requests") {
        errorMessage = "Too many attempts. Please try again later";
      }

      setError(errorMessage);
      throw new Error(errorMessage);
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
    authReady,
    authLoading,
    error,

    // Auth functions
    signUp,
    signIn,
    signInWithGoogle,
    resetPassword,
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
