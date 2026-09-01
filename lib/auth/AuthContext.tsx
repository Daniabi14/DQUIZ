"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User as FirebaseUser, onAuthStateChanged, signOut as fbSignOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase/client";
import { UserProfile, UserRole } from "@/types/user";
import { isSuperAdminEmail } from "./adminGuards";

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

  useEffect(() => {
    // Clear legacy mock profiles from storage
    if (typeof window !== "undefined") {
      const storedDev = localStorage.getItem("dquiz_dev_profile");
      if (storedDev && storedDev.includes("Prof. Alex Rivera")) {
        localStorage.removeItem("dquiz_dev_profile");
        localStorage.removeItem("dquiz_admin_users");
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
              const isSuper = isSuperAdminEmail(fbUser.email);
              const defaultRole: UserRole = isSuper ? "admin" : "host";

              const newProfile: UserProfile = {
                uid: fbUser.uid,
                email: fbUser.email,
                displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
                role: defaultRole,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              };
              await setDoc(userDocRef, newProfile);
              setProfile(newProfile);
            }
          } catch (err) {
            console.warn("Firestore profile fetch error:", err);
            const isSuper = isSuperAdminEmail(fbUser.email);
            setProfile({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: fbUser.displayName || "User",
              role: isSuper ? "admin" : "host",
            });
          }
        } else {
          // Check for valid active session
          const savedDevProfile = localStorage.getItem("dquiz_dev_profile");
          if (savedDevProfile) {
            try {
              const parsed = JSON.parse(savedDevProfile);
              setProfile(parsed);
            } catch {
              localStorage.removeItem("dquiz_dev_profile");
              setProfile(null);
            }
          } else {
            setProfile(null);
          }
        }
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("Firebase Auth listener error:", err);
      setLoading(false);
    }
  }, []);

  const loginAsDevRole = (role: UserRole, email = "danielabishek60@gmail.com", name = "Daniel Abishek") => {
    const isSuper = isSuperAdminEmail(email);
    const assignedRole: UserRole = isSuper ? "admin" : "host";

    const devProfile: UserProfile = {
      uid: `usr_${Date.now()}`,
      email: email,
      displayName: name || (isSuper ? "Daniel Abishek" : "Host User"),
      role: assignedRole,
      institution: "DQUIZ Platform",
      department: "Administration",
    };
    setProfile(devProfile);
    localStorage.setItem("dquiz_dev_profile", JSON.stringify(devProfile));
  };

  const logout = async () => {
    try {
      localStorage.removeItem("dquiz_dev_profile");
      localStorage.removeItem("dquiz_admin_users");
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
  const isHost = role === "host";
  const isAdmin = role === "admin";
  const isStudent = !user && !profile;

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
