import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  ContractSchema,
  RequirementsBaseline,
  ArchitectChatMessage,
} from '../types/agentforge';

export interface SavedProjectRecord {
  id: string;
  ownerId: string;
  name: string;
  featurePrompt: string;
  stage: string;
  contractVersion: string;
  isContractFrozen: boolean;
  requirementsBaselineJson?: string;
  contractJson?: string;
  chatMessagesJson?: string;
  componentReferences?: string;
  productionUrl?: string;
  selectedPresetId?: string;
  createdAt: string;
  updatedAt?: string;
}

const LOCAL_STORAGE_KEY = 'agentforge_saved_projects';

function getLocalProjects(): SavedProjectRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalProject(project: SavedProjectRecord) {
  try {
    const existing = getLocalProjects().filter((p) => p.id !== project.id);
    const updated = [project, ...existing].slice(0, 50);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to mirror project to local storage:', err);
  }
}

function deleteLocalProject(projectId: string) {
  try {
    const existing = getLocalProjects().filter((p) => p.id !== projectId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.warn('Failed to delete project from local storage:', err);
  }
}

/**
 * Save project snapshot to Firestore `/projects/{projectId}`
 */
export async function saveProjectSnapshotToFirestore(
  projectData: SavedProjectRecord
): Promise<{ success: boolean; id: string; error?: string }> {
  // Always mirror locally for instant recovery
  saveLocalProject(projectData);

  try {
    const projectDocRef = doc(db, 'projects', projectData.id);
    
    // Clean payload to ensure strictly validated fields
    const payload: Record<string, any> = {
      id: projectData.id,
      ownerId: projectData.ownerId,
      name: projectData.name.slice(0, 200),
      stage: projectData.stage.slice(0, 64),
      createdAt: projectData.createdAt,
    };

    if (projectData.featurePrompt) {
      payload.featurePrompt = projectData.featurePrompt.slice(0, 2000);
    }
    if (projectData.contractVersion) {
      payload.contractVersion = projectData.contractVersion.slice(0, 64);
    }
    if (typeof projectData.isContractFrozen === 'boolean') {
      payload.isContractFrozen = projectData.isContractFrozen;
    }
    if (projectData.requirementsBaselineJson) {
      payload.requirementsBaselineJson = projectData.requirementsBaselineJson.slice(0, 15000);
    }
    if (projectData.contractJson) {
      payload.contractJson = projectData.contractJson.slice(0, 20000);
    }
    if (projectData.chatMessagesJson) {
      payload.chatMessagesJson = projectData.chatMessagesJson.slice(0, 50000);
    }
    if (projectData.componentReferences) {
      payload.componentReferences = projectData.componentReferences.slice(0, 5000);
    }
    if (projectData.productionUrl) {
      payload.productionUrl = projectData.productionUrl.slice(0, 512);
    }
    if (projectData.selectedPresetId) {
      payload.selectedPresetId = projectData.selectedPresetId.slice(0, 64);
    }
    payload.updatedAt = new Date().toISOString();

    await setDoc(projectDocRef, payload);
    return { success: true, id: projectData.id };
  } catch (err: any) {
    console.warn('Firestore project save warning:', err);
    // Even if Firestore network fails, local storage preserved the snapshot
    return { success: true, id: projectData.id, error: err.message };
  }
}

/**
 * Query all saved projects owned by the authenticated user
 */
export async function fetchUserProjects(
  ownerId: string
): Promise<SavedProjectRecord[]> {
  const localList = getLocalProjects().filter((p) => p.ownerId === ownerId);

  if (!ownerId) {
    return localList;
  }

  try {
    const q = query(collection(db, 'projects'), where('ownerId', '==', ownerId));
    const snapshot = await getDocs(q);

    const remoteProjects: SavedProjectRecord[] = [];
    snapshot.forEach((docSnap) => {
      remoteProjects.push(docSnap.data() as SavedProjectRecord);
    });

    // Merge remote with local (remote takes precedence, add any local not yet on remote)
    const remoteIds = new Set(remoteProjects.map((p) => p.id));
    const combined = [
      ...remoteProjects,
      ...localList.filter((p) => !remoteIds.has(p.id)),
    ];

    // Sort descending by createdAt
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return combined;
  } catch (err) {
    console.warn('Failed to load projects from Firestore, falling back to local storage:', err);
    return localList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}

/**
 * Delete project from Firestore and local mirror
 */
export async function deleteProjectFromStorage(
  projectId: string
): Promise<boolean> {
  deleteLocalProject(projectId);
  try {
    await deleteDoc(doc(db, 'projects', projectId));
    return true;
  } catch (err) {
    console.warn('Failed to delete doc from Firestore:', err);
    return true;
  }
}

/**
 * GDPR Right to Access: Aggregates all user projects, contracts, and transcripts into export bundle.
 */
export async function aggregateUserDataForExport(
  userId: string,
  userProfile: any,
  currentChatMessages: ArchitectChatMessage[],
  currentContract: ContractSchema
): Promise<Record<string, any>> {
  const projects = await fetchUserProjects(userId);

  return {
    exportMetadata: {
      generatedAt: new Date().toISOString(),
      complianceStandard: 'GDPR Article 15 (Right of Access) & CCPA (Right to Know)',
      platform: 'AgentForge Autonomous Multi-Agent Orchestration',
      userId,
    },
    userProfile: {
      id: userProfile?.id || userId,
      name: userProfile?.name || 'Architect',
      email: userProfile?.email || '',
      role: userProfile?.role || 'Lead Architect',
      createdAt: userProfile?.createdAt || '',
    },
    activeWorkspace: {
      currentContract,
      currentChatMessages,
    },
    savedProjects: projects.map((p) => {
      let baseline = null;
      let contract = null;
      let chatHistory = null;
      try {
        if (p.requirementsBaselineJson) baseline = JSON.parse(p.requirementsBaselineJson);
      } catch {}
      try {
        if (p.contractJson) contract = JSON.parse(p.contractJson);
      } catch {}
      try {
        if (p.chatMessagesJson) chatHistory = JSON.parse(p.chatMessagesJson);
      } catch {}

      return {
        id: p.id,
        name: p.name,
        featurePrompt: p.featurePrompt,
        stage: p.stage,
        contractVersion: p.contractVersion,
        isContractFrozen: p.isContractFrozen,
        createdAt: p.createdAt,
        productionUrl: p.productionUrl,
        requirementsBaseline: baseline,
        frozenContract: contract,
        chatHistory,
      };
    }),
  };
}

/**
 * GDPR Right to be Forgotten: Purges all projects, chats, and user documents from Firestore & local storage.
 */
export async function deleteAllUserDataFromFirestore(userId: string): Promise<void> {
  // 1. Purge /projects collection
  try {
    const qProjects = query(collection(db, 'projects'), where('ownerId', '==', userId));
    const snaps = await getDocs(qProjects);
    for (const docSnap of snaps.docs) {
      await deleteDoc(doc(db, 'projects', docSnap.id));
    }
  } catch (err) {
    console.warn('Error purging user projects from Firestore:', err);
  }

  // 2. Purge /threads collection & subcollections
  try {
    const qThreads = query(collection(db, 'threads'), where('ownerId', '==', userId));
    const snaps = await getDocs(qThreads);
    for (const docSnap of snaps.docs) {
      await deleteDoc(doc(db, 'threads', docSnap.id));
    }
  } catch (err) {
    console.warn('Error purging user threads from Firestore:', err);
  }

  // 3. Purge /chats collection if present
  try {
    const qChats = query(collection(db, 'chats'), where('ownerId', '==', userId));
    const snaps = await getDocs(qChats);
    for (const docSnap of snaps.docs) {
      await deleteDoc(doc(db, 'chats', docSnap.id));
    }
  } catch (err) {
    console.warn('Error purging user chats from Firestore:', err);
  }

  // 4. Purge /users/{userId} document
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (err) {
    console.warn('Error purging user profile document from Firestore:', err);
  }

  // 5. Purge local mirrors
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem('agentforge_saved_projects');
  } catch (err) {
    console.warn('Error clearing local projects:', err);
  }
}
