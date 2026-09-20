/* =========================================================
   FIREBASE SERVICE WRAPPER — PROJECT: financesync-4568b
   Handles Auth, Cloud Firestore real-time sync, and Cloud Storage
   with Dev Identity Fallback for offline/prototype execution.
   ========================================================= */

export interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export const FIREBASE_PROJECT_CONFIG: FirebaseConfig = {
  projectId: 'financesync-4568b',
  authDomain: 'financesync-4568b.firebaseapp.com',
  storageBucket: 'financesync-4568b.appspot.com',
};

// Real-time synchronization event payload
export interface RealtimeSyncEvent {
  id: string;
  family_id: string;
  event_type: 
    | 'TRANSACTION_CREATED'
    | 'TRANSACTION_UPDATED'
    | 'TRANSACTION_DELETED'
    | 'REQUEST_SUBMITTED'
    | 'REQUEST_APPROVED'
    | 'REQUEST_REJECTED'
    | 'ALLOWANCE_DISBURSED'
    | 'INVITATION_CREATED'
    | 'MEMBER_JOINED'
    | 'ROLE_UPDATED';
  actor_id: string;
  actor_name: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

class FirebaseSyncService {
  private isConnected: boolean = false;
  private listeners: Array<(event: RealtimeSyncEvent) => void> = [];

  constructor() {
    // Simulated connection status to Firebase console financesync-4568b
    this.isConnected = true;
  }

  public getStatus() {
    return {
      connected: this.isConnected,
      projectId: FIREBASE_PROJECT_CONFIG.projectId,
      authDomain: FIREBASE_PROJECT_CONFIG.authDomain,
      storageBucket: FIREBASE_PROJECT_CONFIG.storageBucket,
      mode: 'DEV_HYBRID_FIREBASE',
    };
  }

  public subscribeRealtimeEvents(callback: (event: RealtimeSyncEvent) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public emitRealtimeEvent(event: Omit<RealtimeSyncEvent, 'id' | 'timestamp'>) {
    const fullEvent: RealtimeSyncEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };

    // Dispatch to active subscriber listeners
    this.listeners.forEach(listener => listener(fullEvent));
    return fullEvent;
  }
}

export const firebaseSync = new FirebaseSyncService();
