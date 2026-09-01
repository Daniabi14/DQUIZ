"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/client";
import { UserProfile, UserRole } from "@/types/user";

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  role: UserRole | null;
  loading: boolean;
  isHost: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  loginAsDevRole: (role: UserRole, email?: string, name?: string) => void;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  loading: true,
  isHost: false,
  isAdmin: false,
  isStudent: false,
  loginAsDevRole: () => {},
  logout: async () => {},
  updateProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for local dev session fallback if using dev demo mode
  useEffect(() => {
    const savedDevProfile = localStorage.getItem("dquiz_dev_profile");
    if (savedDevProfile) {
      try {
        const parsed = JSON.parse(savedDevProfile);
        setProfile(parsed);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem("dquiz_dev_profile");
      }
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        setUser(fbUser);
        if (fbUser) {
          try {
            const userDocRef = doc(db, "users", fbUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              setProfile(userDoc.data() as UserProfile);
            } else {
              // Default fallback to host role on first login
              const newProfile: UserProfile = {
                uid: fbUser.uid,
                email: fbUser.email,
                displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "Host User",
                role: "host",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              };
              await setDoc(userDocRef, newProfile);
              setProfile(newProfile);
            }
          } catch (err) {
            console.warn("Firestore profile fetch error, using basic profile:", err);
            setProfile({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName || "Host User",
              role: "host",
            });
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("Firebase Auth listener initialization notice:", err);
      setLoading(false);
    }
  }, []);

  const loginAsDevRole = (role: UserRole, email = "host@dquiz.app", name = "Prof. Alex Rivera") => {
    const devProfile: UserProfile = {
      uid: `dev_${role}_${Date.now()}`,
      email: role === "admin" ? "admin@dquiz.app" : email,
      displayName: role === "admin" ? "System Admin" : name,
      role: role,
      institution: "Global Academy",
      department: "Computer Science",
    };
    setProfile(devProfile);
    localStorage.setItem("dquiz_dev_profile", JSON.stringify(devProfile));
  };

  const logout = async () => {
    try {
      localStorage.removeItem("dquiz_dev_profile");
      if (auth.currentUser) {
        await fbSignOut(auth);
      }
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...data };
    setProfile(updated);
    if (localStorage.getItem("dquiz_dev_profile")) {
      localStorage.setItem("dquiz_dev_profile", JSON.stringify(updated));
    }
    if (user?.uid) {
      try {
        await setDoc(doc(db, "users", user.uid), data, { merge: true });
      } catch (err) {
        console.error("Failed to update firestore profile:", err);
      }
    }
  };

  const role = profile?.role || null;
  const isHost = role === "host" || role === "admin";
  const isAdmin = role === "admin";
  const isStudent = role === "student";

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        loading,
        isHost,
        isAdmin,
        isStudent,
        loginAsDevRole,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
