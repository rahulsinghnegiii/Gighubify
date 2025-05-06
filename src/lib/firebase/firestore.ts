import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QueryDocumentSnapshot,
  DocumentReference,
  QuerySnapshot,
  startAfter,
  Timestamp,
  onSnapshot,
  serverTimestamp,
  arrayUnion as firestoreArrayUnion,
  arrayRemove as firestoreArrayRemove
} from "firebase/firestore";
import { db } from "./firebase";

// Generic Types
export type FirestoreTimestamp = Timestamp;

// Collection names
const COLLECTIONS = {
  USERS: "users",
  SERVICES: "services",
  ORDERS: "orders",
  REVIEWS: "reviews",
  MESSAGES: "messages",
};

// Generic function to add a document with an auto-generated ID
export const addDocument = async<T extends DocumentData>(
  collectionName: string,
  data: T
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

// Generic function to set a document with a specific ID
export const setDocument = async<T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: T
): Promise<void> => {
  try {
    await setDoc(doc(db, collectionName, docId), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error(`Error setting document in ${collectionName}:`, error);
    throw error;
  }
};

// Generic function to get a document by ID
export const getDocument = async<T>(
  collectionName: string,
  docId: string
): Promise<T | null> => {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
};

// Generic function to update a document
export const updateDocument = async<T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: Partial<T>,
  arrayUnionOperation: boolean = false,
  arrayRemoveOperation: boolean = false
): Promise<void> => {
  try {
    const docRef = doc(db, collectionName, docId);
    
    // Check if document exists first
    const docSnapshot = await getDoc(docRef);
    
    if (!docSnapshot.exists()) {
      console.log(`Document doesn't exist, creating it: ${collectionName}/${docId}`);
      // Document doesn't exist, so create it
      return await setDocument(collectionName, docId, {
        ...data,
        id: docId
      } as any);
    }
    
    // Special handling for array operations if needed
    if (arrayUnionOperation || arrayRemoveOperation) {
      const updates: any = {};
      
      Object.entries(data).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          if (arrayUnionOperation) {
            // Array union operation
            updates[key] = firestoreArrayUnion(...value);
          } else if (arrayRemoveOperation) {
            // Array remove operation
            updates[key] = firestoreArrayRemove(...value);
          }
        } else {
          updates[key] = value;
        }
      });
      
      updates.updatedAt = serverTimestamp();
      await updateDoc(docRef, updates);
    } else {
      // Regular update
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

// Generic function to delete a document
export const deleteDocument = async(
  collectionName: string,
  docId: string
): Promise<void> => {
  try {
    await deleteDoc(doc(db, collectionName, docId));
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

// Generic function to get all documents from a collection
export const getDocuments = async<T>(
  collectionName: string,
  options?: {
    whereConditions?: [string, any, any][],
    orderByField?: string,
    orderDirection?: 'asc' | 'desc',
    limitCount?: number,
    startAfterDoc?: QueryDocumentSnapshot<DocumentData>
  }
): Promise<T[]> => {
  try {
    let q = collection(db, collectionName);
    let constraints = [];

    if (options?.whereConditions) {
      for (const condition of options.whereConditions) {
        constraints.push(where(condition[0], condition[1], condition[2]));
      }
    }

    if (options?.orderByField) {
      constraints.push(orderBy(options.orderByField, options.orderDirection || 'asc'));
    }

    if (options?.limitCount) {
      constraints.push(limit(options.limitCount));
    }

    if (options?.startAfterDoc) {
      constraints.push(startAfter(options.startAfterDoc));
    }

    const queryRef = constraints.length > 0 
      ? query(q, ...constraints) 
      : query(q);

    const querySnapshot = await getDocs(queryRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
};

// Listen to real-time updates for a document
export const subscribeToDocument = <T>(
  collectionName: string,
  docId: string,
  callback: (data: T | null) => void
): () => void => {
  const docRef = doc(db, collectionName, docId);
  
  const unsubscribe = onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as T);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error(`Error in subscription to ${collectionName}/${docId}:`, error);
  });

  return unsubscribe;
};

// Listen to real-time updates for a collection
export const subscribeToCollection = <T>(
  collectionName: string,
  callback: (data: T[]) => void,
  options?: {
    whereConditions?: [string, any, any][],
    orderByField?: string,
    orderDirection?: 'asc' | 'desc',
    limitCount?: number
  }
): () => void => {
  let q = collection(db, collectionName);
  let constraints = [];

  if (options?.whereConditions) {
    for (const condition of options.whereConditions) {
      constraints.push(where(condition[0], condition[1], condition[2]));
    }
  }

  if (options?.orderByField) {
    constraints.push(orderBy(options.orderByField, options.orderDirection || 'asc'));
  }

  if (options?.limitCount) {
    constraints.push(limit(options.limitCount));
  }

  const queryRef = constraints.length > 0 
    ? query(q, ...constraints) 
    : query(q);

  const unsubscribe = onSnapshot(queryRef, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
    callback(data);
  }, (error) => {
    console.error(`Error in subscription to ${collectionName}:`, error);
  });

  return unsubscribe;
};

// Export collection names
export { COLLECTIONS, serverTimestamp }; 