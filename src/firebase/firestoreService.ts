/* =========================================================
   FIRESTORE MULTI-TENANT REALTIME SERVICE
   Provides real-time onSnapshot listeners, multi-tenant isolation,
   and immutable audit logging for Family Finance Sync.
   Sections 6, 26, 28, 40, 41, 42
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
  Unsubscribe,
} from "firebase/firestore";
import { db } from "./config";
import {
  FirestoreUserDocument,
  FirestoreFamilyDocument,
  FirestoreMemberDocument,
  FirestoreTransactionDocument,
  FirestoreAccountDocument,
  FirestoreBudgetDocument,
  FirestoreInvitationDocument,
  FirestoreAuditLogDocument,
  FirestoreNotificationDocument,
} from "../types/firestore";
import { FamilyRole, RolePermissions } from "../types";

export const firestoreService = {
  // Check if workspace is the isolated demo family
  isDemoFamily(familyId: string): boolean {
    return familyId === "demo_family" || familyId === "family_demo";
  },

  // 1. REALTIME TRANSACTIONS LISTENER (Section 28)
  subscribeTransactions(
    familyId: string,
    callback: (transactions: FirestoreTransactionDocument[]) => void
  ): Unsubscribe {
    const colRef = collection(db, `families/${familyId}/transactions`);
    const q = query(colRef, orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snapshot) => {
        const txs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as FirestoreTransactionDocument[];
        callback(txs);
      },
      (error) => {
        console.warn(`Firestore transactions listener error (${familyId}):`, error.message);
      }
    );
  },

  // 2. REALTIME MEMBERS LISTENER (Section 28)
  subscribeMembers(
    familyId: string,
    callback: (members: FirestoreMemberDocument[]) => void
  ): Unsubscribe {
    const colRef = collection(db, `families/${familyId}/members`);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const members = snapshot.docs.map((d) => ({
          uid: d.id,
          ...d.data(),
        })) as FirestoreMemberDocument[];
        callback(members);
      },
      (error) => {
        console.warn(`Firestore members listener error (${familyId}):`, error.message);
      }
    );
  },

  // 3. REALTIME FAMILY WORKSPACE LISTENER
  subscribeFamily(
    familyId: string,
    callback: (family: FirestoreFamilyDocument | null) => void
  ): Unsubscribe {
    const docRef = doc(db, "families", familyId);
    return onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          callback({ familyId: snap.id, ...snap.data() } as FirestoreFamilyDocument);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.warn(`Firestore family listener error (${familyId}):`, error.message);
      }
    );
  },

  // 4. REALTIME NOTIFICATIONS LISTENER (Section 42)
  subscribeNotifications(
    familyId: string,
    callback: (notifications: FirestoreNotificationDocument[]) => void
  ): Unsubscribe {
    const colRef = collection(db, `families/${familyId}/notifications`);
    const q = query(colRef, orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snapshot) => {
        const notifs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as FirestoreNotificationDocument[];
        callback(notifs);
      },
      (error) => {
        console.warn(`Firestore notifications listener error (${familyId}):`, error.message);
      }
    );
  },

  // 5. REALTIME AUDIT LOGS LISTENER (Section 41)
  subscribeAuditLogs(
    familyId: string,
    callback: (logs: FirestoreAuditLogDocument[]) => void
  ): Unsubscribe {
    const colRef = collection(db, `families/${familyId}/auditLogs`);
    const q = query(colRef, orderBy("timestamp", "desc"));
    return onSnapshot(
      q,
      (snapshot) => {
        const logs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as FirestoreAuditLogDocument[];
        callback(logs);
      },
      (error) => {
        console.warn(`Firestore auditLogs listener error (${familyId}):`, error.message);
      }
    );
  },

  // 6. REALTIME INVITATIONS LISTENER
  subscribeInvitations(
    familyId: string,
    callback: (invites: FirestoreInvitationDocument[]) => void
  ): Unsubscribe {
    const colRef = collection(db, `families/${familyId}/invitations`);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const invites = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as FirestoreInvitationDocument[];
        callback(invites);
      },
      (error) => {
        console.warn(`Firestore invitations listener error (${familyId}):`, error.message);
      }
    );
  },

  // ================= MUTATIONS (WITH DEMO PROTECTION & AUDIT) =================

  // Add Transaction
  async addTransaction(
    familyId: string,
    tx: Omit<FirestoreTransactionDocument, "id" | "createdAt">,
    actor?: { uid: string; name: string }
  ): Promise<string> {
    if (this.isDemoFamily(familyId)) {
      throw new Error("Demo Mode is read-only.");
    }
    const colRef = collection(db, `families/${familyId}/transactions`);
    const res = await addDoc(colRef, {
      ...tx,
      createdAt: serverTimestamp(),
    });

    if (actor) {
      await this.logAuditAction(familyId, {
        actorUid: actor.uid,
        actorName: actor.name,
        action: "TRANSACTION_CREATED",
        targetResource: res.id,
        metadata: { amountPaise: tx.amountPaise, category: tx.category, type: tx.type },
      });
    }

    return res.id;
  },

  // Delete Transaction
  async deleteTransaction(
    familyId: string,
    transactionId: string,
    actor?: { uid: string; name: string }
  ): Promise<void> {
    if (this.isDemoFamily(familyId)) {
      throw new Error("Demo Mode is read-only.");
    }
    const docRef = doc(db, `families/${familyId}/transactions`, transactionId);
    await deleteDoc(docRef);

    if (actor) {
      await this.logAuditAction(familyId, {
        actorUid: actor.uid,
        actorName: actor.name,
        action: "TRANSACTION_DELETED",
        targetResource: transactionId,
      });
    }
  },

  // Update Member Role (Family Head action)
  async updateMemberRole(
    familyId: string,
    targetUid: string,
    newRole: FamilyRole,
    newPermissions: RolePermissions,
    actor: { uid: string; name: string }
  ): Promise<void> {
    if (this.isDemoFamily(familyId)) {
      throw new Error("Demo Mode is read-only.");
    }
    const memberDocRef = doc(db, `families/${familyId}/members`, targetUid);
    await updateDoc(memberDocRef, {
      role: newRole,
      permissions: newPermissions,
    });

    await this.logAuditAction(familyId, {
      actorUid: actor.uid,
      actorName: actor.name,
      action: "ROLE_CHANGED",
      targetUid,
      metadata: { newRole },
    });

    await this.sendNotification(familyId, {
      recipientUid: targetUid,
      title: "Role Updated",
      message: `Your family role has been updated to ${newRole.replace("_", " ")}.`,
      type: "role_changed",
    });
  },

  // Update Member Permissions (Family Head action)
  async updateMemberPermissions(
    familyId: string,
    targetUid: string,
    permissions: RolePermissions,
    actor: { uid: string; name: string }
  ): Promise<void> {
    if (this.isDemoFamily(familyId)) {
      throw new Error("Demo Mode is read-only.");
    }
    const memberDocRef = doc(db, `families/${familyId}/members`, targetUid);
    await updateDoc(memberDocRef, { permissions });

    await this.logAuditAction(familyId, {
      actorUid: actor.uid,
      actorName: actor.name,
      action: "PERMISSION_CHANGED",
      targetUid,
    });

    await this.sendNotification(familyId, {
      recipientUid: targetUid,
      title: "Permissions Updated",
      message: "Your family financial access permissions have been updated.",
      type: "permission_updated",
    });
  },

  // Suspend Member
  async suspendMember(
    familyId: string,
    targetUid: string,
    suspended: boolean,
    actor: { uid: string; name: string }
  ): Promise<void> {
    if (this.isDemoFamily(familyId)) {
      throw new Error("Demo Mode is read-only.");
    }
    const memberDocRef = doc(db, `families/${familyId}/members`, targetUid);
    await updateDoc(memberDocRef, {
      status: suspended ? "suspended" : "active",
    });

    await this.logAuditAction(familyId, {
      actorUid: actor.uid,
      actorName: actor.name,
      action: suspended ? "MEMBER_SUSPENDED" : "ROLE_CHANGED",
      targetUid,
      metadata: { status: suspended ? "suspended" : "active" },
    });
  },

  // Remove Member
  async removeMember(
    familyId: string,
    targetUid: string,
    actor: { uid: string; name: string }
  ): Promise<void> {
    if (this.isDemoFamily(familyId)) {
      throw new Error("Demo Mode is read-only.");
    }
    const memberDocRef = doc(db, `families/${familyId}/members`, targetUid);
    await deleteDoc(memberDocRef);

    await this.logAuditAction(familyId, {
      actorUid: actor.uid,
      actorName: actor.name,
      action: "MEMBER_REMOVED",
      targetUid,
    });
  },

  // Create Family Member Invitation (Section 25)
  async createInvitation(
    familyId: string,
    invitation: Omit<FirestoreInvitationDocument, "id" | "createdAt">,
    actor: { uid: string; name: string }
  ): Promise<string> {
    if (this.isDemoFamily(familyId)) {
      throw new Error("Demo Mode is read-only.");
    }
    const colRef = collection(db, `families/${familyId}/invitations`);
    const res = await addDoc(colRef, {
      ...invitation,
      createdAt: serverTimestamp(),
    });

    // Also store in global /invites for fast code lookup
    try {
      await setDoc(doc(db, "invites", invitation.inviteCode), {
        ...invitation,
        invitationId: res.id,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("Could not write to global /invites:", e);
    }

    await this.logAuditAction(familyId, {
      actorUid: actor.uid,
      actorName: actor.name,
      action: "MEMBER_INVITED",
      metadata: { invitedEmail: invitation.invitedEmail, role: invitation.invitedRole },
    });

    return res.id;
  },

  // Accept Invitation (Sections 25 & 43)
  async acceptInvitation(
    inviteCode: string,
    user: { uid: string; name: string; email: string }
  ): Promise<{ familyId: string; role: FamilyRole }> {
    // 1. Lookup invitation
    const inviteRef = doc(db, "invites", inviteCode);
    const snap = await getDoc(inviteRef);

    if (!snap.exists()) {
      throw new Error("Invitation code is invalid or has expired.");
    }

    const data = snap.data() as FirestoreInvitationDocument;
    if (data.status !== "pending") {
      throw new Error("This invitation has already been used or revoked.");
    }

    const familyId = data.familyId;
    const assignedRole = data.invitedRole as FamilyRole;

    // 2. Add user to families/{familyId}/members/{uid}
    await setDoc(doc(db, `families/${familyId}/members`, user.uid), {
      uid: user.uid,
      role: assignedRole,
      status: "active",
      permissions: data.permissions || {},
      joinedAt: serverTimestamp(),
    });

    // 3. Update user profile's active familyId
    await updateDoc(doc(db, "users", user.uid), {
      familyId,
      updatedAt: serverTimestamp(),
    });

    // 4. Mark invitation as accepted
    await updateDoc(inviteRef, {
      status: "accepted",
      acceptedByUid: user.uid,
      acceptedAt: serverTimestamp(),
    });

    // 5. Send notification to Family Head
    await this.sendNotification(familyId, {
      recipientUid: data.invitedBy,
      title: "New Member Joined",
      message: `${user.name} accepted your invitation as ${assignedRole.replace("_", " ")}.`,
      type: "member_joined",
    });

    return { familyId, role: assignedRole };
  },

  // Log Audit Trail Item (Section 41)
  async logAuditAction(
    familyId: string,
    log: {
      actorUid: string;
      actorName: string;
      action: FirestoreAuditLogDocument["action"];
      targetUid?: string;
      targetResource?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    if (this.isDemoFamily(familyId)) return;
    try {
      const colRef = collection(db, `families/${familyId}/auditLogs`);
      await addDoc(colRef, {
        familyId,
        ...log,
        timestamp: serverTimestamp(),
      });
    } catch (e) {
      console.warn("Could not record audit log:", e);
    }
  },

  // Send Family Notification (Section 42)
  async sendNotification(
    familyId: string,
    notif: {
      recipientUid: string;
      title: string;
      message: string;
      type: FirestoreNotificationDocument["type"];
    }
  ): Promise<void> {
    if (this.isDemoFamily(familyId)) return;
    try {
      const colRef = collection(db, `families/${familyId}/notifications`);
      await addDoc(colRef, {
        familyId,
        ...notif,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.warn("Could not dispatch notification:", e);
    }
  },
};
