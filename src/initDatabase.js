import { db, auth } from './firebase';
import { collection, addDoc, setDoc, doc, Timestamp, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';

const batiments = [
  { nom: "Bâtiment A", capacite: 5000, surface: 200, typeElevage: "Poulet de chair" },
  { nom: "Bâtiment B", capacite: 3000, surface: 150, typeElevage: "Pondeuses" }
];

const stocks = [
  { nom: "Aliment démarrage", quantite: 1500, seuilAlerte: 200, unite: "kg" },
  { nom: "Aliment croissance", quantite: 2500, seuilAlerte: 300, unite: "kg" },
  { nom: "Aliment ponte", quantite: 2000, seuilAlerte: 250, unite: "kg" },
  { nom: "Vaccin Gumboro", quantite: 50, seuilAlerte: 10, unite: "doses" },
  { nom: "Vaccin Newcastle", quantite: 45, seuilAlerte: 10, unite: "doses" },
  { nom: "Antibiotique Amoxicilline", quantite: 30, seuilAlerte: 5, unite: "flacons" },
  { nom: "Désinfectant", quantite: 100, seuilAlerte: 20, unite: "litres" }
];

const utilisateurs = [
  { email: "admin@avibiotech.com", password: "admin123456", nom: "Administrateur", role: "admin" },
  { email: "responsable@avibiotech.com", password: "responsable123", nom: "Responsable Elevage", role: "responsable" },
  { email: "technicien@avibiotech.com", password: "technicien123", nom: "Technicien Terrain", role: "technicien" },
  { email: "veterinaire@avibiotech.com", password: "veterinaire123", nom: "Dr Vétérinaire", role: "veterinaire" }
];

const getProductionData = () => {
  const data = [];
  const dates = ["2026-04-01", "2026-04-02", "2026-04-03", "2026-04-04", "2026-04-05", "2026-04-06", "2026-04-07", "2026-04-08", "2026-04-09", "2026-04-10"];
  const mortalites = [5, 3, 2, 4, 2, 3, 1, 2, 3, 2];
  const consommations = [120, 125, 130, 128, 132, 135, 138, 140, 142, 145];
  for (let i = 0; i < dates.length; i++) {
    data.push({ mortalite: mortalites[i], consommationAliment: consommations[i], date: dates[i] });
  }
  return data;
};

const getProductionPondeuseData = () => {
  const data = [];
  const dates = ["2026-04-01", "2026-04-02", "2026-04-03", "2026-04-04", "2026-04-05", "2026-04-06", "2026-04-07", "2026-04-08", "2026-04-09", "2026-04-10"];
  const mortalites = [2, 1, 1, 2, 1, 1, 0, 1, 1, 0];
  const consommations = [95, 98, 100, 102, 105, 108, 110, 112, 115, 118];
  const oeufs = [850, 870, 890, 910, 920, 930, 940, 950, 960, 970];
  for (let i = 0; i < dates.length; i++) {
    data.push({ mortalite: mortalites[i], consommationAliment: consommations[i], productionOeufs: oeufs[i], date: dates[i] });
  }
  return data;
};

const getSanteData = () => {
  return [
    { diagnostic: "Contrôle sanitaire - Lot en bonne santé", traitement: "Aucun", medicaments: "Aucun", symptomes: ["Aucun symptôme"], recommandations: "Continuer le suivi", date: "2026-04-03" },
    { diagnostic: "Infection respiratoire légère", traitement: "Antibiotique 5 jours", medicaments: "Amoxicilline", symptomes: ["Éternuements", "Écoulement nasal"], recommandations: "Surveiller", date: "2026-04-07" },
    { diagnostic: "Amélioration", traitement: "Fin traitement", medicaments: "Vitamines", symptomes: ["Réduction symptômes"], recommandations: "Continuer surveillance", date: "2026-04-14" }
  ];
};

const getInterventionsData = () => {
  return [
    { type: "Vaccination", date: "2026-04-02", description: "Vaccin Gumboro", responsable: "Dr. Dupont", produits: "Vaccin Gumboro", duree: "2h", commentaires: "Bonne réaction" },
    { type: "Nettoyage", date: "2026-04-05", description: "Nettoyage abreuvoirs", responsable: "Technicien", produits: "Détergent", duree: "3h", commentaires: "Propreté effectuée" },
    { type: "Traitement médical", date: "2026-04-07", description: "Traitement antibiotique", responsable: "Dr. Vétérinaire", produits: "Amoxicilline", duree: "5 jours", commentaires: "Dans l'eau" }
  ];
};

const emailExists = async (email) => {
  try {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return methods.length > 0;
  } catch { return false; }
};

const createUserIfNotExists = async (userData) => {
  try {
    const exists = await emailExists(userData.email);
    let uid;
    if (!exists) {
      const userCred = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      uid = userCred.user.uid;
      console.log(`✅ Utilisateur créé: ${userData.email} (${userData.role})`);
    } else {
      console.log(`⚠️ Utilisateur existe déjà: ${userData.email}`);
      return null;
    }
    await setDoc(doc(db, 'users', uid), { email: userData.email, nom: userData.nom, role: userData.role, createdAt: Timestamp.now() });
    return uid;
  } catch (error) {
    console.error(`❌ Erreur:`, error.message);
    return null;
  }
};

export const initDatabase = async () => {
  console.log("🔄 INITIALISATION...");
  try {
    for (const user of utilisateurs) await createUserIfNotExists(user);

    const batimentsSnapshot = await getDocs(collection(db, 'batiments'));
    let batimentAId = null, batimentBId = null;
    if (batimentsSnapshot.empty) {
      const docA = await addDoc(collection(db, 'batiments'), { ...batiments[0], createdAt: Timestamp.now() });
      batimentAId = docA.id;
      const docB = await addDoc(collection(db, 'batiments'), { ...batiments[1], createdAt: Timestamp.now() });
      batimentBId = docB.id;
      console.log("✅ Bâtiments créés");
    } else {
      batimentAId = batimentsSnapshot.docs[0]?.id;
      batimentBId = batimentsSnapshot.docs[1]?.id;
    }

    const lotsSnapshot = await getDocs(collection(db, 'lots'));
    let lotId = null, lotPondeuseId = null;
    if (lotsSnapshot.empty) {
      const lotRef = await addDoc(collection(db, 'lots'), { batimentId: batimentAId, nbInitial: 4800, dateArrivee: Timestamp.fromDate(new Date("2026-04-01")), typeVolailles: "Poulet de chair", statut: "actif", createdAt: Timestamp.now() });
      lotId = lotRef.id;
      const lotPondeuseRef = await addDoc(collection(db, 'lots'), { batimentId: batimentBId, nbInitial: 3000, dateArrivee: Timestamp.fromDate(new Date("2026-04-01")), typeVolailles: "Poule pondeuse", statut: "actif", createdAt: Timestamp.now() });
      lotPondeuseId = lotPondeuseRef.id;
      console.log("✅ Lots créés (poulet de chair + pondeuse)");
    } else {
      lotId = lotsSnapshot.docs[0]?.id;
      lotPondeuseId = lotsSnapshot.docs[1]?.id;
    }

    const stocksSnapshot = await getDocs(collection(db, 'stocks'));
    if (stocksSnapshot.empty) {
      for (const stock of stocks) await addDoc(collection(db, 'stocks'), { ...stock, createdAt: Timestamp.now() });
      console.log("✅ Stocks créés");
    }

    if (lotId) {
      const prodSnapshot = await getDocs(collection(db, 'lots', lotId, 'production'));
      if (prodSnapshot.empty) {
        for (const prod of getProductionData()) await addDoc(collection(db, 'lots', lotId, 'production'), { mortalite: prod.mortalite, consommationAliment: prod.consommationAliment, date: Timestamp.fromDate(new Date(prod.date)), saisiePar: "system" });
        console.log("✅ Production poulet créée");
      }
    }

    if (lotPondeuseId) {
      const prodPondeuseSnapshot = await getDocs(collection(db, 'lots', lotPondeuseId, 'production'));
      if (prodPondeuseSnapshot.empty) {
        for (const prod of getProductionPondeuseData()) await addDoc(collection(db, 'lots', lotPondeuseId, 'production'), { mortalite: prod.mortalite, consommationAliment: prod.consommationAliment, productionOeufs: prod.productionOeufs, date: Timestamp.fromDate(new Date(prod.date)), saisiePar: "system" });
        console.log("✅ Production pondeuse créée (avec œufs)");
      }
    }

    if (lotId) {
      const santeSnapshot = await getDocs(collection(db, 'lots', lotId, 'sante'));
      if (santeSnapshot.empty) {
        for (const sante of getSanteData()) await addDoc(collection(db, 'lots', lotId, 'sante'), { ...sante, date: Timestamp.fromDate(new Date(sante.date)), veterinaireId: "system" });
        console.log("✅ Santé créée");
      }
    }

    if (lotId) {
      const interventionsSnapshot = await getDocs(collection(db, 'lots', lotId, 'interventions'));
      if (interventionsSnapshot.empty) {
        for (const intervention of getInterventionsData()) await addDoc(collection(db, 'lots', lotId, 'interventions'), { ...intervention, date: Timestamp.fromDate(new Date(intervention.date)), createdAt: Timestamp.now(), createdBy: "system" });
        console.log("✅ Interventions créées");
      }
    }

    console.log("🎉 INITIALISATION TERMINÉE !");
    return true;
  } catch (error) {
    console.error("❌ Erreur:", error);
    return false;
  }
};