/* =========================================================
   FAMILY FINANCE SYNC — CLOUD FIRESTORE DATA ACCESS LAYER
   Implements CRUD operations and real-time synchronization
   for the hierarchical schema:
   users | families (members, settings, income, expense, debts) | invites
   ========================================================= */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { firestoreDb } from './firebase';
import {
  FirestoreUser,
  FirestoreFamily,
  FirestoreMember,
  FirestoreSettings,
  FirestoreInvite,
  FirestoreIncome,
  FirestoreExpense,
  FirestoreDebt,
} from '../types/firestore';

// ================= 1. USERS (/users/{uid}) =================

export const firestoreUserService = {
  async saveUserProfile(user: FirestoreUser): Promise<void> {
    const userRef = doc(firestoreDb, 'users', user.uid);
    await setDoc(userRef, {
      ...user,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  },

  async getUserProfile(uid: string): Promise<FirestoreUser | null> {
    const userRef = doc(firestoreDb, 'users', uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return null;
    return snap.data() as FirestoreUser;
  },

  subscribeUserProfile(uid: string, callback: (user: FirestoreUser | null) => void): () => void {
    const userRef = doc(firestoreDb, 'users', uid);
    return onSnapshot(userRef, snap => {
      callback(snap.exists() ? (snap.data() as FirestoreUser) : null);
    });
  },
};

// ================= 2. FAMILIES (/families/{familyId}) =================

export const firestoreFamilyService = {
  async createFamily(ownerUid: string, ownerName: string, ownerEmail: string, familyName: string): Promise<string> {
    const familyCol = collection(firestoreDb, 'families');
    const newFamilyRef = doc(familyCol);
    const familyId = newFamilyRef.id;
    const timestamp = new Date().toISOString();

    // 1. Create Family Document
    const familyData: FirestoreFamily = {
      id: familyId,
      name: familyName,
      ownerUid,
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    await setDoc(newFamilyRef, familyData);

    // 2. Add Creator as Family Head Member
    const memberRef = doc(firestoreDb, 'families', familyId, 'members', ownerUid);
    const memberData: FirestoreMember = {
      uid: ownerUid,
      familyId,
      name: ownerName,
      email: ownerEmail,
      role: 'FAMILY_HEAD',
      monthlyAllowancePaise: 0,
      monthlySpendingLimitPaise: 0,
      joinedAt: timestamp,
      status: 'active',
    };
    await setDoc(memberRef, memberData);

    // 3. Initialize Default Family Settings
    const settingsRef = doc(firestoreDb, 'families', familyId, 'settings', 'general');
    const settingsData: FirestoreSettings = {
      familyId,
      currency: 'INR',
      budgetThresholdAlerts: [70, 80, 90, 100],
      autoApproveAllowanceThresholdPaise: 500000, // ₹5,000
      auditLoggingEnabled: true,
      spendingAlertsEnabled: true,
      updatedAt: timestamp,
    };
    await setDoc(settingsRef, settingsData);

    // 4. Update User's Active Family ID
    await updateDoc(doc(firestoreDb, 'users', ownerUid), {
      activeFamilyId: familyId,
      updatedAt: timestamp,
    });

    return familyId;
  },

  async getFamily(familyId: string): Promise<FirestoreFamily | null> {
    const snap = await getDoc(doc(firestoreDb, 'families', familyId));
    return snap.exists() ? (snap.data() as FirestoreFamily) : null;
  },

  // Members Subcollection (/families/{familyId}/members/{uid})
  subscribeMembers(familyId: string, callback: (members: FirestoreMember[]) => void): () => void {
    const membersRef = collection(firestoreDb, 'families', familyId, 'members');
    return onSnapshot(membersRef, snap => {
      const members = snap.docs.map(d => d.data() as FirestoreMember);
      callback(members);
    });
  },

  async updateMemberRole(familyId: string, memberUid: string, role: FirestoreMember['role']): Promise<void> {
    const memberRef = doc(firestoreDb, 'families', familyId, 'members', memberUid);
    await updateDoc(memberRef, { role });
  },

  // Settings Document (/families/{familyId}/settings/general)
  async getSettings(familyId: string): Promise<FirestoreSettings | null> {
    const snap = await getDoc(doc(firestoreDb, 'families', familyId, 'settings', 'general'));
    return snap.exists() ? (snap.data() as FirestoreSettings) : null;
  },

  async updateSettings(familyId: string, updates: Partial<FirestoreSettings>): Promise<void> {
    const settingsRef = doc(firestoreDb, 'families', familyId, 'settings', 'general');
    await updateDoc(settingsRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  },
};

// ================= 3. INVITATIONS (/invites/{inviteId}) =================

export const firestoreInviteService = {
  async createInvite(invite: Omit<FirestoreInvite, 'id' | 'createdAt'>): Promise<string> {
    const invitesCol = collection(firestoreDb, 'invites');
    const newDocRef = doc(invitesCol);
    const inviteId = newDocRef.id;

    await setDoc(newDocRef, {
      ...invite,
      id: inviteId,
      createdAt: new Date().toISOString(),
    });
    return inviteId;
  },

  async getInviteByCode(code: string): Promise<FirestoreInvite | null> {
    const q = query(collection(firestoreDb, 'invites'), where('inviteCode', '==', code.trim().toUpperCase()), where('status', '==', 'pending'));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data() as FirestoreInvite;
  },

  async acceptInvite(inviteId: string, user: FirestoreUser): Promise<void> {
    const inviteRef = doc(firestoreDb, 'invites', inviteId);
    const inviteSnap = await getDoc(inviteRef);
    if (!inviteSnap.exists()) throw new Error('Invitation not found.');

    const invite = inviteSnap.data() as FirestoreInvite;

    // Add user as member to family
    const memberRef = doc(firestoreDb, 'families', invite.familyId, 'members', user.uid);
    const newMember: FirestoreMember = {
      uid: user.uid,
      familyId: invite.familyId,
      name: user.displayName,
      email: user.email,
      role: invite.role,
      monthlyAllowancePaise: 0,
      monthlySpendingLimitPaise: 0,
      joinedAt: new Date().toISOString(),
      status: 'active',
    };
    await setDoc(memberRef, newMember);

    // Update user active family
    await updateDoc(doc(firestoreDb, 'users', user.uid), {
      activeFamilyId: invite.familyId,
      updatedAt: new Date().toISOString(),
    });

    // Mark invite accepted
    await updateDoc(inviteRef, { status: 'accepted' });
  },
};

// ================= 4. FINANCE DATA SUBCOLLECTIONS =================

export const firestoreFinanceService = {
  // Income (/families/{familyId}/income/{incomeId})
  async addIncome(familyId: string, income: Omit<FirestoreIncome, 'id' | 'createdAt'>): Promise<string> {
    const colRef = collection(firestoreDb, 'families', familyId, 'income');
    const docRef = await addDoc(colRef, {
      ...income,
      createdAt: new Date().toISOString(),
    });
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  },

  subscribeIncome(familyId: string, callback: (incomes: FirestoreIncome[]) => void): () => void {
    const colRef = collection(firestoreDb, 'families', familyId, 'income');
    const q = query(colRef, orderBy('date', 'desc'));
    return onSnapshot(q, snap => {
      const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as FirestoreIncome));
      callback(items);
    });
  },

  // Expense (/families/{familyId}/expense/{expenseId})
  async addExpense(familyId: string, expense: Omit<FirestoreExpense, 'id' | 'createdAt'>): Promise<string> {
    const colRef = collection(firestoreDb, 'families', familyId, 'expense');
    const docRef = await addDoc(colRef, {
      ...expense,
      createdAt: new Date().toISOString(),
    });
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  },

  subscribeExpenses(familyId: string, callback: (expenses: FirestoreExpense[]) => void): () => void {
    const colRef = collection(firestoreDb, 'families', familyId, 'expense');
    const q = query(colRef, orderBy('date', 'desc'));
    return onSnapshot(q, snap => {
      const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as FirestoreExpense));
      callback(items);
    });
  },

  // Debts & Liabilities (/families/{familyId}/debts/{debtId})
  async addDebt(familyId: string, debt: Omit<FirestoreDebt, 'id' | 'createdAt'>): Promise<string> {
    const colRef = collection(firestoreDb, 'families', familyId, 'debts');
    const docRef = await addDoc(colRef, {
      ...debt,
      createdAt: new Date().toISOString(),
    });
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  },

  subscribeDebts(familyId: string, callback: (debts: FirestoreDebt[]) => void): () => void {
    const colRef = collection(firestoreDb, 'families', familyId, 'debts');
    return onSnapshot(colRef, snap => {
      const items = snap.docs.map(d => ({ ...d.data(), id: d.id } as FirestoreDebt));
      callback(items);
    });
  },
};
