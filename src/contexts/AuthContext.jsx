
import React, { useContext, useState, useEffect, createContext } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

// Create Context
const AuthContext = createContext();

// Export useAuth to access context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRole(docSnap.data().role || "seller");
        } else {
          setRole("seller");
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    user,
    role,
    login,
    logout,
    signup,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
