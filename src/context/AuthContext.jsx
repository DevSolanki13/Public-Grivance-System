import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export const DEMO_PERSONAS = {
  citizen: {
    uid: 'demo-citizen-01',
    name: 'Aarav Patel',
    email: 'aarav.citizen@jansewa.gov.in',
    phone: '9876543210',
    role: 'citizen',
    departmentId: null,
    departmentName: null,
    isDemo: true,
  },
  officer: {
    uid: 'demo-officer-01',
    name: 'Rahul Sharma',
    email: 'rahul.officer@jansewa.gov.in',
    phone: '9876543211',
    role: 'officer',
    departmentId: 'Sanitation Department',
    departmentName: 'Sanitation & Waste Management',
    isDemo: true,
  },
  department_head: {
    uid: 'demo-head-01',
    name: 'Priya Verma',
    email: 'priya.head@jansewa.gov.in',
    phone: '9876543212',
    role: 'department_head',
    departmentId: 'Sanitation Department',
    departmentName: 'Sanitation Department',
    isDemo: true,
  },
  admin: {
    uid: 'demo-admin-01',
    name: 'Super Admin',
    email: 'admin@jansewa.gov.in',
    phone: '9876543213',
    role: 'admin',
    departmentId: null,
    departmentName: 'Central Municipal Administration',
    isDemo: true,
  },
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Check if a demo role is already chosen or default to citizen
  const savedDemoRole = localStorage.getItem('jansewa_demo_role') || 'citizen';
  const initialPersona = DEMO_PERSONAS[savedDemoRole] || DEMO_PERSONAS.citizen;

  const [demoRole, setDemoRole] = useState(savedDemoRole);
  const [user, setUser] = useState({
    uid: initialPersona.uid,
    email: initialPersona.email,
    displayName: initialPersona.name,
    isDemo: true,
  });
  const [profile, setProfile] = useState(initialPersona);
  const [loading, setLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);

  // Still support real Firebase if user explicitly logs in with Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setIsDemoMode(false);
        setUser(currentUser);
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setProfile({ uid: currentUser.uid, ...userSnap.data() });
          } else {
            const fallbackProfile = {
              uid: currentUser.uid,
              name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
              email: currentUser.email,
              role: 'citizen',
              departmentId: null,
              isActive: true,
              createdAt: serverTimestamp(),
            };
            setProfile(fallbackProfile);
          }
        } catch (err) {
          console.error('Error fetching user profile:', err);
        }
      } else {
        // If not logged into Firebase, stay in demo persona mode
        const currentSaved = localStorage.getItem('jansewa_demo_role') || 'citizen';
        const persona = DEMO_PERSONAS[currentSaved] || DEMO_PERSONAS.citizen;
        setIsDemoMode(true);
        setUser({
          uid: persona.uid,
          email: persona.email,
          displayName: persona.name,
          isDemo: true,
        });
        setProfile(persona);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Direct 1-Click Role Switcher (No login required)
  const switchRole = (newRole) => {
    const persona = DEMO_PERSONAS[newRole] || DEMO_PERSONAS.citizen;
    localStorage.setItem('jansewa_demo_role', newRole);
    setDemoRole(newRole);
    setIsDemoMode(true);
    setUser({
      uid: persona.uid,
      email: persona.email,
      displayName: persona.name,
      isDemo: true,
    });
    setProfile(persona);
    return persona;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      // Ignore if not logged in to Firebase
    }
    // In demo mode, reset to citizen
    switchRole('citizen');
  };

  const role = profile?.role || demoRole || 'citizen';

  const value = {
    user,
    profile,
    role,
    loading,
    isDemoMode,
    switchRole,
    logout,
    isCitizen: role === 'citizen',
    isOfficer: role === 'officer',
    isDeptHead: role === 'department_head',
    isAdmin: role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
