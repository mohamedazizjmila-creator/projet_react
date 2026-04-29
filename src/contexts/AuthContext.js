import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.data();
        setUser({ ...firebaseUser, ...userData });
        setUserRole(userData?.role);
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    const userData = userDoc.data();
    setUser({ ...result.user, ...userData });
    setUserRole(userData?.role);
    return result;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, userRole, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};