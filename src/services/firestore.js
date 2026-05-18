import { db, auth } from '../firebase';
import { 
  collection, addDoc, updateDoc, deleteDoc, doc, 
  getDocs, query, orderBy, Timestamp
} from 'firebase/firestore';

// ============ BÂTIMENTS ============
export const getBatiments = async () => {
  try {
    const snapshot = await getDocs(query(collection(db, 'batiments'), orderBy('nom')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Erreur getBatiments:", error);
    return [];
  }
};

export const addBatiment = async (data) => {
  try {
    return await addDoc(collection(db, 'batiments'), {
      ...data,
      createdAt: Timestamp.now(),
      createdBy: auth.currentUser?.uid
    });
  } catch (error) {
    console.error("Erreur addBatiment:", error);
    throw error;
  }
};

export const updateBatiment = async (id, data) => {
  try {
    await updateDoc(doc(db, 'batiments', id), data);
  } catch (error) {
    console.error("Erreur updateBatiment:", error);
    throw error;
  }
};

export const deleteBatiment = async (id) => {
  try {
    await deleteDoc(doc(db, 'batiments', id));
  } catch (error) {
    console.error("Erreur deleteBatiment:", error);
    throw error;
  }
};

// ============ LOTS ============
export const getLots = async () => {
  try {
    const snapshot = await getDocs(query(collection(db, 'lots'), orderBy('dateArrivee', 'desc')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Erreur getLots:", error);
    return [];
  }
};

export const addLot = async (data) => {
  try {
    return await addDoc(collection(db, 'lots'), {
      ...data,
      dateArrivee: Timestamp.fromDate(new Date(data.dateArrivee)),
      statut: 'actif',
      createdAt: Timestamp.now(),
      createdBy: auth.currentUser?.uid
    });
  } catch (error) {
    console.error("Erreur addLot:", error);
    throw error;
  }
};

export const updateLot = async (id, data) => {
  try {
    await updateDoc(doc(db, 'lots', id), data);
  } catch (error) {
    console.error("Erreur updateLot:", error);
    throw error;
  }
};

export const deleteLot = async (id) => {
  try {
    await deleteDoc(doc(db, 'lots', id));
  } catch (error) {
    console.error("Erreur deleteLot:", error);
    throw error;
  }
};

// ============ PRODUCTION ============
export const getProduction = async (lotId) => {
  try {
    const snapshot = await getDocs(query(
      collection(db, 'lots', lotId, 'production'),
      orderBy('date', 'desc')
    ));
    return snapshot.docs.slice(0, 30).map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Erreur getProduction:", error);
    return [];
  }
};

export const addProduction = async (lotId, data) => {
  try {
    return await addDoc(collection(db, 'lots', lotId, 'production'), {
      ...data,
      date: Timestamp.now(),
      saisiePar: auth.currentUser?.uid
    });
  } catch (error) {
    console.error("Erreur addProduction:", error);
    throw error;
  }
};

// ============ SANTÉ ============
export const getSanteRecords = async (lotId) => {
  try {
    const snapshot = await getDocs(query(
      collection(db, 'lots', lotId, 'sante'),
      orderBy('date', 'desc')
    ));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Erreur getSanteRecords:", error);
    return [];
  }
};

export const addSanteRecord = async (lotId, data) => {
  try {
    return await addDoc(collection(db, 'lots', lotId, 'sante'), {
      ...data,
      date: Timestamp.now(),
      veterinaireId: auth.currentUser?.uid
    });
  } catch (error) {
    console.error("Erreur addSanteRecord:", error);
    throw error;
  }
};

// ============ STOCKS ============
export const getStocks = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'stocks'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Erreur getStocks:", error);
    return [];
  }
};

export const addStock = async (data) => {
  try {
    return await addDoc(collection(db, 'stocks'), {
      ...data,
      createdAt: Timestamp.now(),
      createdBy: auth.currentUser?.uid
    });
  } catch (error) {
    console.error("Erreur addStock:", error);
    throw error;
  }
};

export const updateStock = async (id, data) => {
  try {
    await updateDoc(doc(db, 'stocks', id), data);
  } catch (error) {
    console.error("Erreur updateStock:", error);
    throw error;
  }
};

export const deleteStock = async (id) => {
  try {
    await deleteDoc(doc(db, 'stocks', id));
  } catch (error) {
    console.error("Erreur deleteStock:", error);
    throw error;
  }
};
export const typesIntervention = [
  'Vaccination',
  'Traitement médical',
  'Nettoyage',
  'Désinfection',
  'Changement de litière'
];
// ============ INTERVENTIONS ============
// ============ INTERVENTIONS ============
export const getInterventions = async (lotId) => {
  try {
    const snapshot = await getDocs(query(
      collection(db, 'lots', lotId, 'interventions'),
      orderBy('date', 'desc')
    ));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Erreur getInterventions:", error);
    return [];
  }
};

export const addIntervention = async (lotId, data) => {
  try {
    // S'assurer que la date est convertie correctement
    let dateObj;
    if (data.date instanceof Date) {
      dateObj = Timestamp.fromDate(data.date);
    } else if (typeof data.date === 'string') {
      dateObj = Timestamp.fromDate(new Date(data.date));
    } else if (data.date?.toDate) {
      dateObj = data.date;
    } else {
      dateObj = Timestamp.now();
    }
    
    return await addDoc(collection(db, 'lots', lotId, 'interventions'), {
      ...data,
      date: dateObj,
      createdAt: Timestamp.now(),
      createdBy: auth.currentUser?.uid,
      createdByName: auth.currentUser?.email,
      estTerminee: false // ✅ NOUVEAU : Statut par défaut
    });
  } catch (error) {
    console.error("Erreur addIntervention:", error);
    throw error;
  }
};

export const updateIntervention = async (lotId, interventionId, data) => {
  try {
    await updateDoc(doc(db, 'lots', lotId, 'interventions', interventionId), data);
  } catch (error) {
    console.error("Erreur updateIntervention:", error);
    throw error;
  }
};

export const deleteIntervention = async (lotId, interventionId) => {
  try {
    await deleteDoc(doc(db, 'lots', lotId, 'interventions', interventionId));
  } catch (error) {
    console.error("Erreur deleteIntervention:", error);
    throw error;
  }
};

// ✅ NOUVELLE FONCTION : Pour changer le statut depuis le Web
export const toggleInterventionStatus = async (lotId, interventionId, nouveauStatut) => {
  try {
    await updateDoc(doc(db, 'lots', lotId, 'interventions', interventionId), {
      estTerminee: nouveauStatut
    });
  } catch (error) {
    console.error("Erreur toggleInterventionStatus:", error);
    throw error;
  }
};
// ============ SANTÉ (AJOUT des fonctions manquantes) ============
export const updateSanteRecord = async (lotId, recordId, data) => {
  try {
    await updateDoc(doc(db, 'lots', lotId, 'sante', recordId), data);
  } catch (error) {
    console.error("Erreur updateSanteRecord:", error);
    throw error;
  }
};

export const deleteSanteRecord = async (lotId, recordId) => {
  try {
    await deleteDoc(doc(db, 'lots', lotId, 'sante', recordId));
  } catch (error) {
    console.error("Erreur deleteSanteRecord:", error);
    throw error;
  }
};
// Diminuer le stock d'aliment après consommation
export const diminuerStockAliment = async (quantiteConsommee, typeAliment = "Aliment démarrage") => {
  try {
    // Récupérer tous les stocks
    const stocks = await getStocks();
    // Trouver le stock d'aliment correspondant
    const stockAliment = stocks.find(s => s.nom === typeAliment);
    
    if (!stockAliment) {
      console.error("Stock d'aliment non trouvé");
      return false;
    }
    
    if (stockAliment.quantite < quantiteConsommee) {
      console.error(`Stock insuffisant: ${stockAliment.quantite} kg < ${quantiteConsommee} kg`);
      return false;
    }
    
    // Mettre à jour la quantité
    await updateStock(stockAliment.id, {
      ...stockAliment,
      quantite: stockAliment.quantite - quantiteConsommee
    });
    
    console.log(`✅ Stock diminué: ${stockAliment.quantite - quantiteConsommee} kg restants`);
    return true;
  } catch (error) {
    console.error("Erreur diminution stock:", error);
    return false;
  }
};
