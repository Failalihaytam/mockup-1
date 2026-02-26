// generate-seed.mjs — Run once to produce db/data/*.csv from mockData equivalent
// Usage: node generate-seed.mjs
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'db', 'data');
mkdirSync(DATA_DIR, { recursive: true });

// ── helper ──────────────────────────────────────────────────────────────────
function writeCsv(entity, headers, rows) {
  const lines = [headers.join(';')];
  for (const r of rows) {
    lines.push(headers.map(h => {
      let v = r[h];
      if (v === undefined || v === null) return '';
      if (typeof v === 'boolean') return v ? 'true' : 'false';
      v = String(v);
      if (v.includes(';') || v.includes('"') || v.includes('\n')) {
        v = '"' + v.replace(/"/g, '""') + '"';
      }
      return v;
    }).join(';'));
  }
  const path = join(DATA_DIR, `cap.perf-${entity}.csv`);
  writeFileSync(path, lines.join('\n') + '\n', 'utf8');
  console.log(`  ✔ ${entity} (${rows.length} rows)`);
}

// ══════════════════════════════════════════════════════════════════════════════
// DATA
// ══════════════════════════════════════════════════════════════════════════════

// ── Users ───────────────────────────────────────────────────────────────────
const users = [
  { id:'u1', name:'Jean Dupont',     email:'jean.dupont@cap-consulting.fr',     role:'ADMIN',                  active:true, availabilityPercent:100 },
  { id:'u2', name:'Marie Martin',    email:'marie.martin@cap-consulting.fr',    role:'MANAGER',                active:true, availabilityPercent:100 },
  { id:'u3', name:'Pierre Dubois',   email:'pierre.dubois@cap-consulting.fr',   role:'CONSULTANT_TECHNIQUE',   active:true, availabilityPercent:90  },
  { id:'u4', name:'Sophie Bernard',  email:'sophie.bernard@cap-consulting.fr',  role:'CONSULTANT_FONCTIONNEL', active:true, availabilityPercent:85  },
  { id:'u5', name:'Luc Moreau',      email:'luc.moreau@cap-consulting.fr',      role:'CONSULTANT_TECHNIQUE',   active:true, availabilityPercent:80  },
  { id:'u6', name:'Claire Lefebvre', email:'claire.lefebvre@cap-consulting.fr', role:'CHEF_DE_PROJET',         active:true, availabilityPercent:100 },
  { id:'u7', name:'Thomas Girard',   email:'thomas.girard@cap-consulting.fr',   role:'COORDINATEUR_DEV',       active:true, availabilityPercent:100 },
];

// ── UserSkills ──────────────────────────────────────────────────────────────
const skillMap = {
  u1: ['SAP Basis','Security','ABAP'],
  u2: ['Project Management','SAP MM','Agile'],
  u3: ['ABAP','Fiori','CDS Views','OData','RAP'],
  u4: ['SAP FI/CO','MM','S/4HANA Configuration','Business Process'],
  u5: ['UI5','JavaScript','TypeScript','Fiori Elements'],
  u6: ['SAP Activate','PPM','JIRA','Risk Management'],
  u7: ['ABAP OO','Git','Code Review','CI/CD','ADT'],
};
const userSkills = [];
for (const [uid, skills] of Object.entries(skillMap)) {
  skills.forEach((s,i) => userSkills.push({ id:`sk-${uid}-${i+1}`, user_id:uid, skill:s }));
}

// ── Certifications ──────────────────────────────────────────────────────────
const certifications = [
  { id:'c1',  user_id:'u1', name:'SAP Certified Technology Associate',            issuingBody:'SAP',    dateObtained:'2025-03-15', expiryDate:'2027-03-15', status:'VALID' },
  { id:'c2',  user_id:'u1', name:'ITIL Foundation',                               issuingBody:'Axelos', dateObtained:'2024-06-01', expiryDate:'2026-06-01', status:'VALID' },
  { id:'c3',  user_id:'u2', name:'PMP',                                           issuingBody:'PMI',    dateObtained:'2024-01-10', expiryDate:'2027-01-10', status:'VALID' },
  { id:'c4',  user_id:'u2', name:'SAP Certified Application Associate – MM',      issuingBody:'SAP',    dateObtained:'2025-05-20', expiryDate:'2027-05-20', status:'VALID' },
  { id:'c5',  user_id:'u3', name:'SAP Certified Development Associate – ABAP',    issuingBody:'SAP',    dateObtained:'2025-09-01', expiryDate:'2027-09-01', status:'VALID' },
  { id:'c6',  user_id:'u3', name:'SAP Certified Development Specialist – Fiori',  issuingBody:'SAP',    dateObtained:'2025-11-01', expiryDate:'2027-11-01', status:'VALID' },
  { id:'c7',  user_id:'u3', name:'AWS Cloud Practitioner',                        issuingBody:'AWS',    dateObtained:'2024-04-15', expiryDate:'2026-04-15', status:'EXPIRING_SOON' },
  { id:'c8',  user_id:'u4', name:'SAP Certified Application Associate – FI',      issuingBody:'SAP',    dateObtained:'2025-07-01', expiryDate:'2027-07-01', status:'VALID' },
  { id:'c9',  user_id:'u4', name:'SAP Certified Application Associate – S/4HANA', issuingBody:'SAP',    dateObtained:'2025-08-20', expiryDate:'2027-08-20', status:'VALID' },
  { id:'c10', user_id:'u5', name:'SAP Certified Development Associate – UI5',     issuingBody:'SAP',    dateObtained:'2025-06-01', expiryDate:'2027-06-01', status:'VALID' },
  { id:'c11', user_id:'u6', name:'PRINCE2 Practitioner',                          issuingBody:'AXELOS', dateObtained:'2024-09-01', expiryDate:'2026-09-01', status:'VALID' },
  { id:'c12', user_id:'u7', name:'SAP Certified Development Associate – ABAP',    issuingBody:'SAP',    dateObtained:'2025-01-15', expiryDate:'2027-01-15', status:'VALID' },
];

// ── Projects ────────────────────────────────────────────────────────────────
const projects = [
  { id:'p1', code:'SAPS', name:'SAP S/4HANA Migration',      manager_id:'u2', startDate:'2026-01-01', endDate:'2026-06-30', status:'ACTIVE',  priority:'HIGH',   description:'Migration complète ECC → S/4HANA avec conversion données et adaptation processus métier', progress:35, budget:450000, complexity:'HIGH' },
  { id:'p2', code:'FIOR', name:'Fiori Launchpad Deployment',  manager_id:'u2', startDate:'2026-02-01', endDate:'2026-05-31', status:'ACTIVE',  priority:'MEDIUM', description:'Déploiement du Fiori Launchpad avec tuiles personnalisées et workflows', progress:20, budget:180000, complexity:'MEDIUM' },
  { id:'p3', code:'BIRP', name:'BI Reporting Platform',       manager_id:'u2', startDate:'2026-01-15', endDate:'2026-07-31', status:'ACTIVE',  priority:'HIGH',   description:'Plateforme de reporting BI avec dashboards temps réel et extraction SAP', progress:45, budget:320000, complexity:'HIGH' },
];

// ── ProjectKeywords ─────────────────────────────────────────────────────────
const kwMap = {
  p1: ['S/4HANA','ABAP','Migration','Fiori','CDS'],
  p2: ['Fiori','UI5','Launchpad','Workflow','SAP Build'],
  p3: ['BW/4HANA','CDS Views','SAC','Analytics','OData'],
};
const projectKeywords = [];
for (const [pid, kws] of Object.entries(kwMap)) {
  kws.forEach((k,i) => projectKeywords.push({ id:`kw-${pid}-${i+1}`, project_id:pid, keyword:k }));
}

// ── Objets ──────────────────────────────────────────────────────────────────
const objets = [
  // Project p1
  { id:'obj1',  project_id:'p1', code:'MM-001', name:'Gestion Articles MM',         module:'MM', devType:'Formulaire', complexite:'Complexe',       priorite:1, createdAt:'2026-01-10T09:00:00Z', createdBy_id:'u4' },
  { id:'obj2',  project_id:'p1', code:'MM-002', name:'Rapports Contrôle Factures',  module:'MM', devType:'Report',     complexite:'Moyen',          priorite:2, createdAt:'2026-01-12T10:00:00Z', createdBy_id:'u4' },
  { id:'obj1b', project_id:'p1', code:'MM-003', name:'Batch Input Prix',            module:'MM', devType:'Enhancement',complexite:'Complexe',       priorite:0, createdAt:'2026-01-15T09:00:00Z', createdBy_id:'u4' },
  { id:'obj1c', project_id:'p1', code:'MM-004', name:'Stock Valorisé Multi-Sté',    module:'MM', devType:'Report',     complexite:'Moyen',          priorite:2, createdAt:'2026-01-18T10:00:00Z', createdBy_id:'u2' },
  { id:'obj1d', project_id:'p1', code:'MM-005', name:'Anomalies Migration',         module:'MM', devType:'Report',     complexite:'Simple',         priorite:3, createdAt:'2026-01-20T09:00:00Z', createdBy_id:'u4' },
  { id:'obj1e', project_id:'p1', code:'SD-001', name:'Interface IDocs',             module:'SD', devType:'Enhancement',complexite:'Complexe',       priorite:2, createdAt:'2026-01-22T10:00:00Z', createdBy_id:'u2' },
  // Project p2
  { id:'obj3',  project_id:'p2', code:'FI-001', name:'Tuile Approbation PO',        module:'FI', devType:'Enhancement',complexite:'Complexe',       priorite:1, createdAt:'2026-01-14T09:00:00Z', createdBy_id:'u4' },
  { id:'obj4',  project_id:'p2', code:'BC-001', name:'My Inbox Améliorée',          module:'BC', devType:'Formulaire', complexite:'Complexe',       priorite:2, createdAt:'2026-01-16T10:00:00Z', createdBy_id:'u4' },
  { id:'obj3b', project_id:'p2', code:'HR-001', name:'Congés Fiori',                module:'HR', devType:'Formulaire', complexite:'Simple',         priorite:1, createdAt:'2026-01-20T09:00:00Z', createdBy_id:'u4' },
  { id:'obj3c', project_id:'p2', code:'BC-002', name:'Extension Launchpad Manager', module:'BC', devType:'Enhancement',complexite:'Complexe',       priorite:2, createdAt:'2026-01-25T11:00:00Z', createdBy_id:'u4' },
  { id:'obj3d', project_id:'p2', code:'BC-003', name:'Push Notification Workflow',  module:'BC', devType:'Enhancement',complexite:'Complexe',       priorite:1, createdAt:'2026-01-28T10:00:00Z', createdBy_id:'u4' },
  { id:'obj3e', project_id:'p2', code:'MM-001', name:'Éval Fournisseur Fiori',      module:'MM', devType:'Formulaire', complexite:'Moyen',          priorite:2, createdAt:'2026-02-01T14:00:00Z', createdBy_id:'u4' },
  // Project p3
  { id:'obj5',  project_id:'p3', code:'FI-001', name:'Extraction GL CDS',           module:'FI', devType:'Programme',  complexite:'Moyen',          priorite:0, createdAt:'2026-01-18T08:00:00Z', createdBy_id:'u4' },
  { id:'obj5b', project_id:'p3', code:'CO-001', name:'KPI Dashboard',               module:'CO', devType:'Programme',  complexite:'Très Complexe',  priorite:1, createdAt:'2026-01-20T08:00:00Z', createdBy_id:'u2' },
  { id:'obj5c', project_id:'p3', code:'HR-001', name:'Extraction RH BI',            module:'HR', devType:'Report',     complexite:'Moyen',          priorite:2, createdAt:'2026-01-22T10:00:00Z', createdBy_id:'u2' },
  { id:'obj5d', project_id:'p3', code:'SD-001', name:'Pipeline ETL Ventes',         module:'SD', devType:'Programme',  complexite:'Très Complexe',  priorite:0, createdAt:'2026-01-25T08:00:00Z', createdBy_id:'u2' },
  { id:'obj5e', project_id:'p3', code:'FI-002', name:'Consolidation Mensuelle',     module:'FI', devType:'Report',     complexite:'Complexe',       priorite:1, createdAt:'2026-01-28T09:00:00Z', createdBy_id:'u4' },
  { id:'obj5f', project_id:'p3', code:'CO-002', name:'Drill-down Centres de Coûts', module:'CO', devType:'Report',     complexite:'Complexe',       priorite:1, createdAt:'2026-01-30T08:00:00Z', createdBy_id:'u2' },
];

// ── Documentations ──────────────────────────────────────────────────────────
const documentations = [
  { id:'sfd1', objet_id:'obj1',  title:'SFD – Migration données maîtres MM',          content:'# Spécification Fonctionnelle\n## Contexte\nMigration des données maîtres articles...',                 version:2, createdBy_id:'u4', updatedBy_id:'u4', createdAt:'2026-01-12T09:00:00Z', updatedAt:'2026-01-20T14:00:00Z' },
  { id:'sfd2', objet_id:'obj2',  title:'SFD – Rapport contrôle factures',              content:'# Spécification Fonctionnelle\n## Contexte\nRapport de contrôle automatisé des factures...',            version:1, createdBy_id:'u4', createdAt:'2026-01-14T10:00:00Z' },
  { id:'sfd3', objet_id:'obj3',  title:'SFD – Tuile Fiori approbation PO',             content:'# Spécification Fonctionnelle\n## Contexte\nCréation tuile Fiori Launchpad pour approbation PO...',    version:1, createdBy_id:'u4', createdAt:'2026-01-16T09:00:00Z' },
  { id:'sfd4', objet_id:'obj4',  title:'SFD – Page Fiori My Inbox',                    content:'# Spécification Fonctionnelle\n## Contexte\nAmélioration My Inbox avec filtres avancés...',            version:1, createdBy_id:'u4', createdAt:'2026-01-18T14:00:00Z' },
  { id:'sfd5', objet_id:'obj5',  title:'SFD – CDS View Extraction GL',                 content:'# Spécification Fonctionnelle\n## Contexte\nCDS Views pour extraction données GL vers plateforme BI', version:1, createdBy_id:'u4', createdAt:'2026-01-20T08:00:00Z' },
  { id:'sfd6', objet_id:'obj1b', title:'SFD – Batch Input modification prix',          content:'# Spécification Fonctionnelle\n## Contexte\nProgramme batch pour mise à jour massive des prix...',    version:1, createdBy_id:'u4', createdAt:'2026-01-22T09:00:00Z' },
  { id:'sfd7', objet_id:'obj3b', title:'SFD – Formulaire congés Fiori',                content:'# Spécification Fonctionnelle\n## Contexte\nFormulaire Fiori de saisie des demandes de congés...',     version:1, createdBy_id:'u4', createdAt:'2026-01-28T10:00:00Z' },
  { id:'sfd8', objet_id:'obj5b', title:'SFD – KPI Dashboard temps réel',               content:'# Spécification Fonctionnelle\n## Contexte\nDashboard KPIs avec rafraîchissement temps réel...',      version:1, createdBy_id:'u2', createdAt:'2026-02-01T08:00:00Z' },
  { id:'sfd9', objet_id:'obj5d', title:'SFD – Pipeline ETL données ventes',            content:'# Spécification Fonctionnelle\n## Contexte\nPipeline ETL extraction données SD vers BI...',           version:1, createdBy_id:'u2', createdAt:'2026-02-05T09:00:00Z' },
];

// ── Tasks ───────────────────────────────────────────────────────────────────
const tasks = [
  { id:'t1', project_id:'p1', title:'Analyse données maîtres',     description:'Analyse structures données MM à migrer',            status:'DONE',        priority:'HIGH',   assignee_id:'u3', plannedStart:'2026-01-06', plannedEnd:'2026-01-20', realStart:'2026-01-06', realEnd:'2026-01-18', progressPercent:100, estimatedHours:40, actualHours:36, isCritical:true,  riskLevel:'LOW' },
  { id:'t2', project_id:'p1', title:'Développement programme migration', description:'ABAP pour extraction/transformation/chargement',status:'IN_PROGRESS', priority:'CRITICAL',assignee_id:'u3', plannedStart:'2026-01-21', plannedEnd:'2026-02-28', realStart:'2026-01-21',                       progressPercent:60,  estimatedHours:120,actualHours:72, isCritical:true,  riskLevel:'MEDIUM' },
  { id:'t3', project_id:'p2', title:'Configuration Fiori Launchpad',description:'Setup tuiles, groupes et catalogues',              status:'IN_PROGRESS', priority:'HIGH',   assignee_id:'u5', plannedStart:'2026-02-03', plannedEnd:'2026-03-15', realStart:'2026-02-03',                       progressPercent:40,  estimatedHours:80, actualHours:32, isCritical:false, riskLevel:'LOW' },
  { id:'t4', project_id:'p2', title:'Tests intégration workflow',    description:'Tests end-to-end workflows approbation',           status:'TO_DO',       priority:'MEDIUM', assignee_id:'u4', plannedStart:'2026-03-16', plannedEnd:'2026-04-15',                                                  progressPercent:0,   estimatedHours:60, actualHours:0,  isCritical:false, riskLevel:'NONE' },
  { id:'t5', project_id:'p3', title:'Modélisation données BI',      description:'Modèle données BW/4HANA pour reporting',           status:'DONE',        priority:'HIGH',   assignee_id:'u3', plannedStart:'2026-01-20', plannedEnd:'2026-02-10', realStart:'2026-01-20', realEnd:'2026-02-08', progressPercent:100, estimatedHours:50, actualHours:48, isCritical:true,  riskLevel:'LOW' },
  { id:'t6', project_id:'p3', title:'Développement dashboards',     description:'Dashboards SAC avec drill-down et filtres',         status:'IN_PROGRESS', priority:'HIGH',   assignee_id:'u5', plannedStart:'2026-02-11', plannedEnd:'2026-03-31', realStart:'2026-02-11',                       progressPercent:30,  estimatedHours:90, actualHours:27, isCritical:false, riskLevel:'MEDIUM' },
];

// ── Timesheets ──────────────────────────────────────────────────────────────
const timesheets = [
  { id:'ts1', user_id:'u3', date:'2026-02-20', hours:7.5, project_id:'p1', task_id:'t2', comment:'Développement programme ETL batch 3' },
  { id:'ts2', user_id:'u5', date:'2026-02-20', hours:6,   project_id:'p2', task_id:'t3', comment:'Configuration tuiles Fiori groupe achat' },
];

// ── Evaluations ─────────────────────────────────────────────────────────────
const evaluations = [
  { id:'e1', user_id:'u3', evaluator_id:'u2', project_id:'p1', period:'2026-Q1', score:4.2,
    qualitativeGrid_productivity:4, qualitativeGrid_quality:5, qualitativeGrid_autonomy:4, qualitativeGrid_collaboration:4, qualitativeGrid_innovation:4,
    feedback:'Excellent travail sur la migration. Très bon niveau technique ABAP et proactivité.',
    createdAt:'2026-02-15T10:00:00Z' },
];

// ── Deliverables ────────────────────────────────────────────────────────────
const deliverables = [
  { id:'d1', project_id:'p1', task_id:'t1', type:'Document',     name:'Analyse données maîtres MM',       validationStatus:'APPROVED',          functionalComment:'Analyse complète et détaillée', createdAt:'2026-01-18T16:00:00Z' },
  { id:'d2', project_id:'p1', task_id:'t2', type:'Code',         name:'Programme migration ETL v0.3',      validationStatus:'PENDING',           createdAt:'2026-02-15T14:00:00Z' },
  { id:'d3', project_id:'p2', task_id:'t3', type:'Configuration',name:'Config Fiori Launchpad',            validationStatus:'PENDING',           createdAt:'2026-02-20T10:00:00Z' },
  { id:'d4', project_id:'p3', task_id:'t5', type:'Document',     name:'Modèle données BW/4HANA',          validationStatus:'APPROVED',          functionalComment:'Modèle validé par équipe BI', createdAt:'2026-02-08T16:00:00Z' },
  { id:'d5', project_id:'p1', task_id:'t1', type:'Spreadsheet',  name:'Mapping champs ECC → S/4',         validationStatus:'APPROVED',          createdAt:'2026-01-15T11:00:00Z' },
  { id:'d6', project_id:'p1', task_id:'t2', type:'Code',         name:'Module conversion UoM',             validationStatus:'CHANGES_REQUESTED', functionalComment:'Ajouter gestion unités spécifiques client', createdAt:'2026-02-10T09:00:00Z' },
  { id:'d7', project_id:'p2', task_id:'t3', type:'Document',     name:'Guide utilisateur Launchpad',       validationStatus:'PENDING',           createdAt:'2026-02-18T15:00:00Z' },
  { id:'d8', project_id:'p3', task_id:'t6', type:'Code',         name:'Dashboard ventes v0.1',             validationStatus:'PENDING',           createdAt:'2026-02-19T10:00:00Z' },
  { id:'d9', project_id:'p3', task_id:'t5', type:'Code',         name:'CDS Views extraction GL',           validationStatus:'APPROVED',          functionalComment:'Extraction conforme au cahier des charges', createdAt:'2026-02-07T14:00:00Z' },
];

// ── Tickets ─────────────────────────────────────────────────────────────────
const tickets = [
  { id:'tk1',  project_id:'p1', objet_id:'obj1',  createdBy_id:'u4', assignedTo_id:'u3', status:'IN_PROGRESS',      priority:'HIGH',     devType:'Formulaire',  title:'Migration des données maîtres MM',       description:'Développer le programme de migration des données maîtres articles (MM) depuis ECC vers S/4HANA.',                       dueDate:'2026-03-15', createdAt:'2026-01-15T09:00:00Z', updatedAt:'2026-02-20T14:30:00Z', chiffrage:5,  complexite:'Complexe',       priorite:1, module:'MM', wricef:'SAPS-MM001-001' },
  { id:'tk2',  project_id:'p1', objet_id:'obj2',  createdBy_id:'u4', assignedTo_id:'u5', status:'WAITING_FEEDBACK', priority:'MEDIUM',   devType:'Report',      title:'Rapport de contrôle des factures',        description:'Créer un rapport de contrôle automatisé pour vérification des factures fournisseurs.',                                  dueDate:'2026-02-28', createdAt:'2026-01-18T11:00:00Z', updatedAt:'2026-02-18T16:00:00Z', chiffrage:3,  complexite:'Moyen',          priorite:2, module:'MM', wricef:'SAPS-MM002-001' },
  { id:'tk3',  project_id:'p2', objet_id:'obj3',  createdBy_id:'u4', assignedTo_id:'u3', status:'IN_PROGRESS',      priority:'HIGH',     devType:'Enhancement', title:'Tuile Fiori pour approbation PO',         description:'Créer une tuile Fiori Launchpad pour le processus d\'approbation des commandes d\'achat.',                              dueDate:'2026-04-10', createdAt:'2026-01-20T10:00:00Z', updatedAt:'2026-02-19T09:00:00Z', chiffrage:8,  complexite:'Complexe',       priorite:1, module:'FI', wricef:'FIOR-FI001-001' },
  { id:'tk4',  project_id:'p3', objet_id:'obj5',  createdBy_id:'u4', assignedTo_id:'u3', status:'OPEN',             priority:'CRITICAL', devType:'Programme',   title:'CDS View Extraction GL',                  description:'Développer les CDS Views pour l\'extraction des données GL vers la plateforme BI.',                                     dueDate:'2026-03-30', createdAt:'2026-02-01T08:00:00Z',                                   chiffrage:4,  complexite:'Moyen',          priorite:0, module:'FI', wricef:'BIRP-FI001-001' },
  { id:'tk5',  project_id:'p2', objet_id:'obj4',  createdBy_id:'u4', assignedTo_id:'u5', status:'IN_PROGRESS',      priority:'MEDIUM',   devType:'Formulaire',  title:'Page Fiori My Inbox améliorée',           description:'Améliorer la page My Inbox avec filtres avancés et vue compacte pour les approbations.',                                dueDate:'2026-03-31', createdAt:'2026-02-05T14:00:00Z', updatedAt:'2026-02-22T11:00:00Z', chiffrage:6,  complexite:'Complexe',       priorite:2, module:'BC', wricef:'FIOR-BC001-001' },
  { id:'tk6',  project_id:'p1', objet_id:'obj1',  createdBy_id:'u2', assignedTo_id:'u3', status:'RESOLVED',         priority:'HIGH',     devType:'Enhancement', title:'Conversion unités de mesure',             description:'Développer le module de conversion des unités de mesure pour la migration S/4HANA.',                                    dueDate:'2026-02-20', createdAt:'2026-01-10T08:00:00Z', updatedAt:'2026-02-15T10:00:00Z', chiffrage:2,  complexite:'Simple',         priorite:2, module:'MM', wricef:'SAPS-MM001-002' },
  { id:'tk7',  project_id:'p1', objet_id:'obj1b', createdBy_id:'u4', assignedTo_id:'u3', status:'IN_PROGRESS',      priority:'CRITICAL', devType:'Enhancement', title:'Batch Input modification prix',           description:'Programme batch pour mise à jour massive des prix articles dans S/4HANA.',                                              dueDate:'2026-03-05', createdAt:'2026-01-22T09:00:00Z', updatedAt:'2026-02-21T15:00:00Z', chiffrage:7,  complexite:'Complexe',       priorite:0, module:'MM', wricef:'SAPS-MM003-001' },
  { id:'tk8',  project_id:'p1', objet_id:'obj1c', createdBy_id:'u2', assignedTo_id:'u5', status:'OPEN',             priority:'MEDIUM',   devType:'Report',      title:'État stock valorisé multi-sociétés',      description:'Rapport stock valorisé consolidant les données de plusieurs sociétés.',                                                 dueDate:'2026-03-20', createdAt:'2026-01-25T10:00:00Z',                                   chiffrage:4,  complexite:'Moyen',          priorite:2, module:'MM', wricef:'SAPS-MM004-001' },
  { id:'tk9',  project_id:'p2', objet_id:'obj3b', createdBy_id:'u4', assignedTo_id:'u3', status:'RESOLVED',         priority:'HIGH',     devType:'Formulaire',  title:'Formulaire saisie congés Fiori',          description:'Formulaire Fiori de saisie des demandes de congés avec validation hiérarchique.',                                       dueDate:'2026-02-28', createdAt:'2026-01-28T09:00:00Z', updatedAt:'2026-02-22T16:00:00Z', chiffrage:3,  complexite:'Simple',         priorite:1, module:'HR', wricef:'FIOR-HR001-001' },
  { id:'tk10', project_id:'p2', objet_id:'obj3c', createdBy_id:'u4', assignedTo_id:'u5', status:'IN_PROGRESS',      priority:'MEDIUM',   devType:'Enhancement', title:'Extension launchpad rôle manager',        description:'Extension du Fiori Launchpad pour le rôle manager avec tuiles spécifiques.',                                            dueDate:'2026-04-15', createdAt:'2026-02-03T11:00:00Z', updatedAt:'2026-02-20T10:00:00Z', chiffrage:5,  complexite:'Complexe',       priorite:2, module:'BC', wricef:'FIOR-BC002-001' },
  { id:'tk11', project_id:'p3', objet_id:'obj5b', createdBy_id:'u2', assignedTo_id:'u5', status:'IN_PROGRESS',      priority:'HIGH',     devType:'Programme',   title:'KPI Dashboard temps réel',                description:'Dashboard de KPIs avec rafraîchissement temps réel depuis BW/4HANA.',                                                  dueDate:'2026-03-25', createdAt:'2026-02-05T08:00:00Z', updatedAt:'2026-02-22T14:00:00Z', chiffrage:10, complexite:'Très Complexe',  priorite:1, module:'CO', wricef:'BIRP-CO001-001' },
  { id:'tk12', project_id:'p3', objet_id:'obj5c', createdBy_id:'u2', assignedTo_id:'u3', status:'WAITING_FEEDBACK', priority:'MEDIUM',   devType:'Report',      title:'Extraction données RH pour BI',           description:'Rapport d\'extraction des données RH pour intégration BI.',                                                             dueDate:'2026-03-10', createdAt:'2026-02-07T10:00:00Z', updatedAt:'2026-02-19T11:00:00Z', chiffrage:3,  complexite:'Moyen',          priorite:2, module:'HR', wricef:'BIRP-HR001-001' },
  { id:'tk13', project_id:'p1', objet_id:'obj1d', createdBy_id:'u4', assignedTo_id:'u5', status:'OPEN',             priority:'LOW',      devType:'Report',      title:'Rapport anomalies migration',             description:'Rapport de suivi des anomalies détectées pendant la migration.',                                                        dueDate:'2026-04-30', createdAt:'2026-02-10T09:00:00Z',                                   chiffrage:2,  complexite:'Simple',         priorite:3, module:'MM', wricef:'SAPS-MM005-001' },
  { id:'tk14', project_id:'p2', objet_id:'obj3d', createdBy_id:'u4', assignedTo_id:'u3', status:'IN_PROGRESS',      priority:'HIGH',     devType:'Enhancement', title:'Notification push workflow',              description:'Notifications push pour les workflows d\'approbation dans le Fiori Launchpad.',                                          dueDate:'2026-03-20', createdAt:'2026-02-01T10:00:00Z', updatedAt:'2026-02-21T09:00:00Z', chiffrage:6,  complexite:'Complexe',       priorite:1, module:'BC', wricef:'FIOR-BC003-001' },
  { id:'tk15', project_id:'p2', objet_id:'obj3e', createdBy_id:'u4', assignedTo_id:'u5', status:'WAITING_FEEDBACK', priority:'MEDIUM',   devType:'Formulaire',  title:'Formulaire évaluation fournisseur',       description:'Formulaire d\'évaluation des fournisseurs dans le Fiori Launchpad.',                                                     dueDate:'2026-03-15', createdAt:'2026-02-04T14:00:00Z', updatedAt:'2026-02-20T16:00:00Z', chiffrage:4,  complexite:'Moyen',          priorite:2, module:'MM', wricef:'FIOR-MM001-001' },
  { id:'tk16', project_id:'p3', objet_id:'obj5d', createdBy_id:'u2', assignedTo_id:'u3', status:'IN_PROGRESS',      priority:'CRITICAL', devType:'Programme',   title:'Pipeline ETL données ventes',             description:'Pipeline ETL complet pour l\'extraction et transformation des données SD.',                                              dueDate:'2026-03-15', createdAt:'2026-02-08T08:00:00Z', updatedAt:'2026-02-22T10:00:00Z', chiffrage:12, complexite:'Très Complexe',  priorite:0, module:'SD', wricef:'BIRP-SD001-001' },
  { id:'tk17', project_id:'p1', objet_id:'obj1e', createdBy_id:'u2', assignedTo_id:'u7', status:'OPEN',             priority:'MEDIUM',   devType:'Enhancement', title:'Interface IDocs partenaires',             description:'Développement interface IDocs pour échange de données avec partenaires.',                                               dueDate:'2026-04-15', createdAt:'2026-02-12T10:00:00Z',                                   chiffrage:5,  complexite:'Complexe',       priorite:2, module:'SD', wricef:'SAPS-SD001-001' },
  { id:'tk18', project_id:'p3', objet_id:'obj5e', createdBy_id:'u4', assignedTo_id:'u7', status:'IN_PROGRESS',      priority:'HIGH',     devType:'Report',      title:'Rapport consolidation mensuelle',         description:'Rapport de consolidation mensuelle avec données FI multi-sociétés.',                                                    dueDate:'2026-03-20', createdAt:'2026-02-06T09:00:00Z', updatedAt:'2026-02-21T14:00:00Z', chiffrage:6,  complexite:'Complexe',       priorite:1, module:'FI', wricef:'BIRP-FI002-001' },
  { id:'tk19', project_id:'p1', objet_id:'obj2',  createdBy_id:'u4', assignedTo_id:'u7', status:'RESOLVED',         priority:'MEDIUM',   devType:'Programme',   title:'Job batch purge données temporaires',     description:'Job batch planifié pour purge automatique des données temporaires de migration.',                                       dueDate:'2026-02-25', createdAt:'2026-01-20T11:00:00Z', updatedAt:'2026-02-18T15:00:00Z', chiffrage:3,  complexite:'Moyen',          priorite:2, module:'BC', wricef:'SAPS-BC001-001' },
  { id:'tk20', project_id:'p2', objet_id:'obj4',  createdBy_id:'u2', assignedTo_id:'u3', status:'IN_PROGRESS',      priority:'HIGH',     devType:'Enhancement', title:'Intégration SAP Build Work Zone',         description:'Intégration complète du Launchpad dans SAP Build Work Zone.',                                                           dueDate:'2026-04-01', createdAt:'2026-02-10T08:00:00Z', updatedAt:'2026-02-22T09:00:00Z', chiffrage:8,  complexite:'Très Complexe',  priorite:1, module:'BC', wricef:'FIOR-BC004-001' },
  { id:'tk21', project_id:'p3', objet_id:'obj5f', createdBy_id:'u2', assignedTo_id:'u5', status:'CLOSED',           priority:'HIGH',     devType:'Report',      title:'Drill-down centres de coûts',             description:'Rapport drill-down hiérarchique des centres de coûts.',                                                                 dueDate:'2026-02-15', createdAt:'2026-01-28T08:00:00Z', updatedAt:'2026-02-12T17:00:00Z', chiffrage:4,  complexite:'Complexe',       priorite:1, module:'CO', wricef:'BIRP-CO002-001' },
  { id:'tk22', project_id:'p3', objet_id:'obj5c', createdBy_id:'u4', assignedTo_id:'u7', status:'CLOSED',           priority:'HIGH',     devType:'Programme',   title:'Pipeline données temps réel SLT',         description:'Pipeline de réplication temps réel via SLT pour données analytiques.',                                                   dueDate:'2026-02-20', createdAt:'2026-02-01T09:00:00Z', updatedAt:'2026-02-18T16:00:00Z', chiffrage:5,  complexite:'Complexe',       priorite:1, module:'BC', wricef:'BIRP-BC001-001' },
  { id:'tk23', project_id:'p3', objet_id:'obj5b', createdBy_id:'u2', assignedTo_id:'u5', status:'IN_PROGRESS',      priority:'MEDIUM',   devType:'Enhancement', title:'Sauvegarde filtres dashboard',            description:'Fonctionnalité de sauvegarde et partage des filtres de dashboard.',                                                     dueDate:'2026-03-28', createdAt:'2026-02-15T10:00:00Z', updatedAt:'2026-02-23T11:00:00Z', chiffrage:2,  complexite:'Simple',         priorite:2, module:'CO', wricef:'BIRP-CO003-001' },
  { id:'tk24', project_id:'p3', objet_id:'obj5d', createdBy_id:'u4', assignedTo_id:'u3', status:'RESOLVED',         priority:'MEDIUM',   devType:'Enhancement', title:'Export Excel multi-rapports',             description:'Fonctionnalité d\'export Excel pour tous les rapports de la plateforme BI.',                                             dueDate:'2026-03-05', createdAt:'2026-02-10T09:00:00Z', updatedAt:'2026-02-21T15:00:00Z', chiffrage:2,  complexite:'Simple',         priorite:2, module:'SD', wricef:'BIRP-SD002-001' },
  { id:'tk25', project_id:'p1', objet_id:'obj1b', createdBy_id:'u2', assignedTo_id:'u7', status:'OPEN',             priority:'LOW',      devType:'Report',      title:'Tableau de bord suivi migration',         description:'Dashboard de suivi global de la progression de la migration.',                                                          dueDate:'2026-05-01', createdAt:'2026-02-18T10:00:00Z',                                   chiffrage:3,  complexite:'Moyen',          priorite:3, module:'MM', wricef:'SAPS-MM006-001' },
  { id:'tk26', project_id:'p3', objet_id:'obj5e', createdBy_id:'u2', assignedTo_id:'u3', status:'CLOSED',           priority:'HIGH',     devType:'Report',      title:'Analyse écarts P&L budget/réel',          description:'Rapport d\'analyse des écarts entre budget et réel sur le P&L.',                                                        dueDate:'2026-02-15', createdAt:'2026-01-30T08:00:00Z', updatedAt:'2026-02-13T17:00:00Z', chiffrage:4,  complexite:'Complexe',       priorite:1, module:'FI', wricef:'BIRP-FI003-001' },
  { id:'tk27', project_id:'p2', objet_id:'obj3b', createdBy_id:'u4', assignedTo_id:'u5', status:'OPEN',             priority:'LOW',      devType:'Formulaire',  title:'Formulaire note de frais simplifié',      description:'Formulaire simplifié de saisie des notes de frais dans Fiori.',                                                         dueDate:'2026-04-20', createdAt:'2026-02-17T14:00:00Z',                                   chiffrage:2,  complexite:'Simple',         priorite:3, module:'HR', wricef:'FIOR-HR002-001' },
  { id:'tk28', project_id:'p1', objet_id:'obj1c', createdBy_id:'u2', assignedTo_id:'u5', status:'IN_PROGRESS',      priority:'HIGH',     devType:'Programme',   title:'Contrôle limite crédit client',           description:'Programme de contrôle automatisé des limites de crédit client.',                                                        dueDate:'2026-03-10', createdAt:'2026-02-14T09:00:00Z', updatedAt:'2026-02-24T10:00:00Z', chiffrage:7,  complexite:'Complexe',       priorite:1, module:'SD', wricef:'SAPS-SD002-001' },
  { id:'tk29', project_id:'p1', objet_id:'obj1d', createdBy_id:'u4', assignedTo_id:'u7', status:'WAITING_FEEDBACK', priority:'MEDIUM',   devType:'Enhancement', title:'Dashboard progression migration',         description:'Dashboard de visualisation de la progression de la migration par module.',                                              dueDate:'2026-03-20', createdAt:'2026-02-13T10:00:00Z', updatedAt:'2026-02-22T14:00:00Z', chiffrage:4,  complexite:'Moyen',          priorite:2, module:'MM', wricef:'SAPS-MM007-001' },
  { id:'tk30', project_id:'p2', objet_id:'obj3c', createdBy_id:'u2', assignedTo_id:'u7', status:'OPEN',             priority:'MEDIUM',   devType:'Programme',   title:'Job synchronisation rôles LDAP',          description:'Job de synchronisation automatique des rôles SAP depuis LDAP.',                                                         dueDate:'2026-04-10', createdAt:'2026-02-20T09:00:00Z',                                   chiffrage:4,  complexite:'Moyen',          priorite:2, module:'BC', wricef:'FIOR-BC005-001' },
];

// ── TicketEvents (representative set for each ticket) ───────────────────────
const ticketEvents = [];
function addHistory(tkId, createdBy, assignedTo, createdAt, status, extraEvents = []) {
  const base = `h-${tkId}`;
  let idx = 1;
  ticketEvents.push({ id:`${base}-${idx++}`, ticket_id:tkId, timestamp:createdAt, user_id:createdBy, action:'CREATED', comment:'Ticket créé' });
  if (assignedTo) {
    const t = new Date(new Date(createdAt).getTime() + 3600000).toISOString();
    ticketEvents.push({ id:`${base}-${idx++}`, ticket_id:tkId, timestamp:t, user_id:'u2', action:'ASSIGNED', toValue:assignedTo });
  }
  if (status !== 'OPEN') {
    const t = new Date(new Date(createdAt).getTime() + 86400000).toISOString();
    ticketEvents.push({ id:`${base}-${idx++}`, ticket_id:tkId, timestamp:t, user_id:assignedTo || createdBy, action:'STATUS_CHANGE', fromValue:'OPEN', toValue: status === 'CLOSED' ? 'IN_PROGRESS' : status });
  }
  if (status === 'RESOLVED' || status === 'CLOSED') {
    const t = new Date(new Date(createdAt).getTime() + 86400000 * 10).toISOString();
    ticketEvents.push({ id:`${base}-${idx++}`, ticket_id:tkId, timestamp:t, user_id:assignedTo || createdBy, action:'STATUS_CHANGE', fromValue:'IN_PROGRESS', toValue:'RESOLVED' });
  }
  if (status === 'CLOSED') {
    const t = new Date(new Date(createdAt).getTime() + 86400000 * 15).toISOString();
    ticketEvents.push({ id:`${base}-${idx++}`, ticket_id:tkId, timestamp:t, user_id:'u2', action:'STATUS_CHANGE', fromValue:'RESOLVED', toValue:'CLOSED' });
  }
  for (const e of extraEvents) {
    ticketEvents.push({ id:`${base}-${idx++}`, ticket_id:tkId, ...e });
  }
}

for (const tk of tickets) {
  addHistory(tk.id, tk.createdBy_id, tk.assignedTo_id, tk.createdAt, tk.status);
}

// ── TicketMessages (representative messages for key tickets) ────────────────
const ticketMessages = [
  { id:'msg-tk1-1',  ticket_id:'tk1',  sender_id:'u4',  senderName:'Sophie Bernard', senderRole:'CONSULTANT_FONCTIONNEL', content:'J\'ai finalisé la SFD pour la migration MM. Pierre, peux-tu valider la faisabilité technique ?', sentAt:'2026-01-16T09:00:00Z' },
  { id:'msg-tk1-2',  ticket_id:'tk1',  sender_id:'u3',  senderName:'Pierre Dubois',  senderRole:'CONSULTANT_TECHNIQUE',   content:'SFD validée. Je commence le développement ABAP cette semaine.',                                   sentAt:'2026-01-16T14:00:00Z' },
  { id:'msg-tk2-1',  ticket_id:'tk2',  sender_id:'u5',  senderName:'Luc Moreau',     senderRole:'CONSULTANT_TECHNIQUE',   content:'Rapport prêt. En attente de validation du format par le contrôle de gestion.',                    sentAt:'2026-02-18T10:00:00Z' },
  { id:'msg-tk3-1',  ticket_id:'tk3',  sender_id:'u3',  senderName:'Pierre Dubois',  senderRole:'CONSULTANT_TECHNIQUE',   content:'La tuile Fiori est en cours. Le backend OData fonctionne, UI en construction.',                   sentAt:'2026-02-15T11:00:00Z' },
  { id:'msg-tk5-1',  ticket_id:'tk5',  sender_id:'u5',  senderName:'Luc Moreau',     senderRole:'CONSULTANT_TECHNIQUE',   content:'Le composant filtres avancés est terminé. Je passe aux tests.',                                   sentAt:'2026-02-20T09:00:00Z' },
  { id:'msg-tk7-1',  ticket_id:'tk7',  sender_id:'u3',  senderName:'Pierre Dubois',  senderRole:'CONSULTANT_TECHNIQUE',   content:'Le batch input fonctionne en environnement de test. Besoin de validation données réelles.',       sentAt:'2026-02-19T15:00:00Z' },
  { id:'msg-tk9-1',  ticket_id:'tk9',  sender_id:'u3',  senderName:'Pierre Dubois',  senderRole:'CONSULTANT_TECHNIQUE',   content:'Formulaire congés terminé et testé. En attente de validation fonctionnelle.',                     sentAt:'2026-02-20T16:00:00Z' },
  { id:'msg-tk10-1', ticket_id:'tk10', sender_id:'u5',  senderName:'Luc Moreau',     senderRole:'CONSULTANT_TECHNIQUE',   content:'Extension manager en cours. Les tuiles KPI sont fonctionnelles.',                                 sentAt:'2026-02-18T10:00:00Z' },
  { id:'msg-tk14-1', ticket_id:'tk14', sender_id:'u3',  senderName:'Pierre Dubois',  senderRole:'CONSULTANT_TECHNIQUE',   content:'Push notifications implémentées via SAP BTP. Tests en cours.',                                    sentAt:'2026-02-19T14:00:00Z' },
  { id:'msg-tk15-1', ticket_id:'tk15', sender_id:'u5',  senderName:'Luc Moreau',     senderRole:'CONSULTANT_TECHNIQUE',   content:'Formulaire d\'évaluation prêt. En attente retour utilisateur final.',                              sentAt:'2026-02-19T16:00:00Z' },
  { id:'msg-tk20-1', ticket_id:'tk20', sender_id:'u3',  senderName:'Pierre Dubois',  senderRole:'CONSULTANT_TECHNIQUE',   content:'L\'intégration Work Zone est complexe. J\'ai besoin d\'un accès sub-account BTP.',                 sentAt:'2026-02-20T08:00:00Z' },
];

// ── ActivityEvents (representative events for key tickets) ──────────────────
const activityEvents = [];
let aeIdx = 1;
function addAE(tkId, type, actorId, actorName, actorRole, description, occurredAt, metadata) {
  activityEvents.push({
    id: `ae-${aeIdx++}`,
    ticket_id: tkId,
    type, actor_id: actorId, actorName, actorRole,
    description, metadata: metadata ? JSON.stringify(metadata) : '',
    occurredAt,
  });
}

// tk1 activity
addAE('tk1','ticket_created','u4','Sophie Bernard','CONSULTANT_FONCTIONNEL','Ticket créé','2026-01-15T09:00:00Z');
addAE('tk1','assignee_change','u2','Marie Martin','MANAGER','Assigné à Pierre Dubois','2026-01-15T09:30:00Z',{from:null,to:'u3'});
addAE('tk1','status_change','u3','Pierre Dubois','CONSULTANT_TECHNIQUE','Statut changé : OPEN → IN_PROGRESS','2026-02-01T08:00:00Z',{from:'OPEN',to:'IN_PROGRESS'});
addAE('tk1','work_session_logged','u3','Pierre Dubois','CONSULTANT_TECHNIQUE','Session de travail : 3.5h','2026-02-19T18:00:00Z',{hours:3.5});
addAE('tk1','chiffrage_updated','u4','Sophie Bernard','CONSULTANT_FONCTIONNEL','Chiffrage mis à jour : 5 jours','2026-02-20T14:30:00Z',{chiffrage:5});

// tk2 activity
addAE('tk2','ticket_created','u4','Sophie Bernard','CONSULTANT_FONCTIONNEL','Ticket créé','2026-01-18T11:00:00Z');
addAE('tk2','status_change','u5','Luc Moreau','CONSULTANT_TECHNIQUE','Statut changé : OPEN → IN_PROGRESS','2026-01-25T08:00:00Z',{from:'OPEN',to:'IN_PROGRESS'});
addAE('tk2','status_change','u5','Luc Moreau','CONSULTANT_TECHNIQUE','Statut changé : IN_PROGRESS → WAITING_FEEDBACK','2026-02-18T16:00:00Z',{from:'IN_PROGRESS',to:'WAITING_FEEDBACK'});

// tk3 activity
addAE('tk3','ticket_created','u4','Sophie Bernard','CONSULTANT_FONCTIONNEL','Ticket créé','2026-01-20T10:00:00Z');
addAE('tk3','status_change','u3','Pierre Dubois','CONSULTANT_TECHNIQUE','Statut changé : OPEN → IN_PROGRESS','2026-02-03T09:00:00Z',{from:'OPEN',to:'IN_PROGRESS'});
addAE('tk3','work_session_logged','u3','Pierre Dubois','CONSULTANT_TECHNIQUE','Session de travail : 4h','2026-02-10T18:00:00Z',{hours:4});

// tk5 activity
addAE('tk5','ticket_created','u4','Sophie Bernard','CONSULTANT_FONCTIONNEL','Ticket créé','2026-02-05T14:00:00Z');
addAE('tk5','status_change','u5','Luc Moreau','CONSULTANT_TECHNIQUE','Statut changé : OPEN → IN_PROGRESS','2026-02-10T08:00:00Z',{from:'OPEN',to:'IN_PROGRESS'});

// tk7 activity
addAE('tk7','ticket_created','u4','Sophie Bernard','CONSULTANT_FONCTIONNEL','Ticket créé','2026-01-22T09:00:00Z');
addAE('tk7','priority_change','u2','Marie Martin','MANAGER','Priorité changée : HIGH → CRITICAL','2026-01-23T10:00:00Z',{from:'HIGH',to:'CRITICAL'});
addAE('tk7','status_change','u3','Pierre Dubois','CONSULTANT_TECHNIQUE','Statut changé : OPEN → IN_PROGRESS','2026-02-01T08:00:00Z',{from:'OPEN',to:'IN_PROGRESS'});

// tk9 activity
addAE('tk9','ticket_created','u4','Sophie Bernard','CONSULTANT_FONCTIONNEL','Ticket créé','2026-01-28T09:00:00Z');
addAE('tk9','status_change','u3','Pierre Dubois','CONSULTANT_TECHNIQUE','Statut changé : IN_PROGRESS → RESOLVED','2026-02-22T16:00:00Z',{from:'IN_PROGRESS',to:'RESOLVED'});

// tk10 activity
addAE('tk10','ticket_created','u4','Sophie Bernard','CONSULTANT_FONCTIONNEL','Ticket créé','2026-02-03T11:00:00Z');
addAE('tk10','status_change','u5','Luc Moreau','CONSULTANT_TECHNIQUE','Statut changé : OPEN → IN_PROGRESS','2026-02-07T08:00:00Z',{from:'OPEN',to:'IN_PROGRESS'});

// tk14 activity
addAE('tk14','ticket_created','u4','Sophie Bernard','CONSULTANT_FONCTIONNEL','Ticket créé','2026-02-01T10:00:00Z');
addAE('tk14','status_change','u3','Pierre Dubois','CONSULTANT_TECHNIQUE','Statut changé : OPEN → IN_PROGRESS','2026-02-10T08:00:00Z',{from:'OPEN',to:'IN_PROGRESS'});

// tk20 activity
addAE('tk20','ticket_created','u2','Marie Martin','MANAGER','Ticket créé','2026-02-10T08:00:00Z');
addAE('tk20','status_change','u3','Pierre Dubois','CONSULTANT_TECHNIQUE','Statut changé : OPEN → IN_PROGRESS','2026-02-15T09:00:00Z',{from:'OPEN',to:'IN_PROGRESS'});

// ── WorkSessions ────────────────────────────────────────────────────────────
const workSessions = [
  // tk3
  { id:'ws1',  consultant_id:'u3', ticket_id:'tk3',  project_id:'p2', date:'2026-02-10', hours:4,   description:'Backend OData service pour tuile approbation PO',        sentToStraTIME:true,  sentAt:'2026-02-10T18:00:00Z' },
  { id:'ws2',  consultant_id:'u3', ticket_id:'tk3',  project_id:'p2', date:'2026-02-14', hours:3.5, description:'UI5 frontend tuile avec statuts visuels',                sentToStraTIME:true,  sentAt:'2026-02-14T18:00:00Z' },
  { id:'ws3',  consultant_id:'u3', ticket_id:'tk3',  project_id:'p2', date:'2026-02-19', hours:2,   description:'Tests intégration avec workflow SAP',                    sentToStraTIME:false },
  // tk2
  { id:'ws4',  consultant_id:'u5', ticket_id:'tk2',  project_id:'p1', date:'2026-02-12', hours:3,   description:'Requête ALV rapport contrôle factures',                 sentToStraTIME:true,  sentAt:'2026-02-12T18:00:00Z' },
  { id:'ws5',  consultant_id:'u5', ticket_id:'tk2',  project_id:'p1', date:'2026-02-17', hours:2.5, description:'Formatage et totaux rapport factures',                   sentToStraTIME:true,  sentAt:'2026-02-17T18:00:00Z' },
  { id:'ws5b', consultant_id:'u5', ticket_id:'tk2',  project_id:'p1', date:'2026-02-18', hours:1.5, description:'Corrections mineures et envoi pour validation',          sentToStraTIME:false },
  // tk1
  { id:'ws6',  consultant_id:'u3', ticket_id:'tk1',  project_id:'p1', date:'2026-02-03', hours:4,   description:'Mapping champs ECC → S/4HANA pour articles',            sentToStraTIME:true,  sentAt:'2026-02-03T18:00:00Z' },
  { id:'ws9',  consultant_id:'u3', ticket_id:'tk1',  project_id:'p1', date:'2026-02-19', hours:3.5, description:'Programme ABAP extraction données maîtres',              sentToStraTIME:false },
  // tk5
  { id:'ws7',  consultant_id:'u5', ticket_id:'tk5',  project_id:'p2', date:'2026-02-10', hours:3,   description:'Layout page My Inbox avec composants Fiori',            sentToStraTIME:true,  sentAt:'2026-02-10T18:00:00Z' },
  { id:'ws10', consultant_id:'u5', ticket_id:'tk5',  project_id:'p2', date:'2026-02-20', hours:2.5, description:'Filtres avancés et barre de recherche',                 sentToStraTIME:false },
  { id:'ws10b',consultant_id:'u5', ticket_id:'tk5',  project_id:'p2', date:'2026-02-22', hours:2,   description:'Tests composant filtres et corrections responsive',     sentToStraTIME:false },
  // tk6
  { id:'ws8',  consultant_id:'u3', ticket_id:'tk6',  project_id:'p1', date:'2026-02-13', hours:2,   description:'Module conversion UoM — développement et tests',        sentToStraTIME:true,  sentAt:'2026-02-13T18:00:00Z' },
  // tk7
  { id:'ws11', consultant_id:'u3', ticket_id:'tk7',  project_id:'p1', date:'2026-02-05', hours:4,   description:'Analyse structure batch input et mapping champs prix',  sentToStraTIME:true,  sentAt:'2026-02-05T18:00:00Z' },
  { id:'ws11b',consultant_id:'u3', ticket_id:'tk7',  project_id:'p1', date:'2026-02-21', hours:3,   description:'Programme batch input — traitement erreurs et logs',    sentToStraTIME:false },
  // tk8
  { id:'ws12', consultant_id:'u5', ticket_id:'tk8',  project_id:'p1', date:'2026-02-07', hours:2,   description:'Analyse requirements rapport stock multi-sociétés',     sentToStraTIME:true,  sentAt:'2026-02-07T18:00:00Z' },
  { id:'ws13', consultant_id:'u5', ticket_id:'tk8',  project_id:'p1', date:'2026-02-14', hours:3,   description:'Prototype requête ALV multi-sociétés',                 sentToStraTIME:true,  sentAt:'2026-02-14T18:00:00Z' },
  // tk9
  { id:'ws14', consultant_id:'u3', ticket_id:'tk9',  project_id:'p2', date:'2026-02-07', hours:2,   description:'Analyse requirements formulaire congés Fiori',         sentToStraTIME:true,  sentAt:'2026-02-07T18:00:00Z' },
  { id:'ws15', consultant_id:'u3', ticket_id:'tk9',  project_id:'p2', date:'2026-02-14', hours:3,   description:'Développement formulaire avec validation hiérarchique',sentToStraTIME:true,  sentAt:'2026-02-14T18:00:00Z' },
  { id:'ws16', consultant_id:'u3', ticket_id:'tk9',  project_id:'p2', date:'2026-02-20', hours:1.5, description:'Tests et corrections finales formulaire congés',        sentToStraTIME:true,  sentAt:'2026-02-20T18:00:00Z' },
  // tk10
  { id:'ws17', consultant_id:'u5', ticket_id:'tk10', project_id:'p2', date:'2026-02-10', hours:2.5, description:'Configuration tuiles KPI rôle manager',                sentToStraTIME:true,  sentAt:'2026-02-10T18:00:00Z' },
  { id:'ws18', consultant_id:'u5', ticket_id:'tk10', project_id:'p2', date:'2026-02-18', hours:3,   description:'Intégration données temps réel pour tuiles manager',   sentToStraTIME:false },
  // tk11
  { id:'ws19', consultant_id:'u5', ticket_id:'tk11', project_id:'p3', date:'2026-02-10', hours:4,   description:'Architecture KPI dashboard et modèle données',         sentToStraTIME:true,  sentAt:'2026-02-10T18:00:00Z' },
  { id:'ws20', consultant_id:'u5', ticket_id:'tk11', project_id:'p3', date:'2026-02-17', hours:3.5, description:'Composants graphiques et widgets KPI',                 sentToStraTIME:true,  sentAt:'2026-02-17T18:00:00Z' },
  { id:'ws21', consultant_id:'u5', ticket_id:'tk11', project_id:'p3', date:'2026-02-22', hours:3,   description:'Rafraîchissement auto et gestion cache',               sentToStraTIME:false },
  // tk12
  { id:'ws22', consultant_id:'u3', ticket_id:'tk12', project_id:'p3', date:'2026-02-12', hours:3,   description:'Query extraction données RH vers BW',                  sentToStraTIME:true,  sentAt:'2026-02-12T18:00:00Z' },
  { id:'ws23', consultant_id:'u3', ticket_id:'tk12', project_id:'p3', date:'2026-02-19', hours:2,   description:'Transformation données et mapping champs BI',          sentToStraTIME:false },
  // tk14
  { id:'ws24', consultant_id:'u3', ticket_id:'tk14', project_id:'p2', date:'2026-02-10', hours:3,   description:'Architecture notification push via BTP',               sentToStraTIME:true,  sentAt:'2026-02-10T18:00:00Z' },
  { id:'ws25', consultant_id:'u3', ticket_id:'tk14', project_id:'p2', date:'2026-02-17', hours:4,   description:'Implémentation service notification avec templates',   sentToStraTIME:true,  sentAt:'2026-02-17T18:00:00Z' },
  { id:'ws26', consultant_id:'u3', ticket_id:'tk14', project_id:'p2', date:'2026-02-19', hours:2,   description:'Tests push notifications multi-devices',               sentToStraTIME:false },
  { id:'ws27', consultant_id:'u3', ticket_id:'tk14', project_id:'p2', date:'2026-02-21', hours:1.5, description:'Corrections et retry mechanism',                       sentToStraTIME:false },
  // tk15
  { id:'ws28', consultant_id:'u5', ticket_id:'tk15', project_id:'p2', date:'2026-02-10', hours:2.5, description:'Layout formulaire évaluation fournisseur',             sentToStraTIME:true,  sentAt:'2026-02-10T18:00:00Z' },
  { id:'ws29', consultant_id:'u5', ticket_id:'tk15', project_id:'p2', date:'2026-02-17', hours:3,   description:'Logique validation et scoring fournisseur',            sentToStraTIME:true,  sentAt:'2026-02-17T18:00:00Z' },
  { id:'ws30', consultant_id:'u5', ticket_id:'tk15', project_id:'p2', date:'2026-02-20', hours:1.5, description:'Tests et soumission pour review',                      sentToStraTIME:false },
  // tk16
  { id:'ws31', consultant_id:'u3', ticket_id:'tk16', project_id:'p3', date:'2026-02-12', hours:4,   description:'Architecture pipeline ETL données ventes',             sentToStraTIME:true,  sentAt:'2026-02-12T18:00:00Z' },
  { id:'ws32', consultant_id:'u3', ticket_id:'tk16', project_id:'p3', date:'2026-02-22', hours:5,   description:'Développement extracteurs et transformations SD',      sentToStraTIME:false },
  // tk18
  { id:'ws33', consultant_id:'u7', ticket_id:'tk18', project_id:'p3', date:'2026-02-10', hours:3,   description:'Structure rapport consolidation mensuelle',            sentToStraTIME:true,  sentAt:'2026-02-10T18:00:00Z' },
  { id:'ws34', consultant_id:'u7', ticket_id:'tk18', project_id:'p3', date:'2026-02-17', hours:4,   description:'Requêtes données FI multi-sociétés',                  sentToStraTIME:true,  sentAt:'2026-02-17T18:00:00Z' },
  { id:'ws35', consultant_id:'u7', ticket_id:'tk18', project_id:'p3', date:'2026-02-21', hours:2.5, description:'Mise en page et graphiques consolidation',             sentToStraTIME:false },
  // tk19
  { id:'ws36', consultant_id:'u7', ticket_id:'tk19', project_id:'p1', date:'2026-02-03', hours:2,   description:'Analyse données temporaires à purger',                sentToStraTIME:true,  sentAt:'2026-02-03T18:00:00Z' },
  { id:'ws37', consultant_id:'u7', ticket_id:'tk19', project_id:'p1', date:'2026-02-10', hours:3,   description:'Développement job batch avec scheduling',             sentToStraTIME:true,  sentAt:'2026-02-10T18:00:00Z' },
  // tk4
  { id:'ws38', consultant_id:'u3', ticket_id:'tk4',  project_id:'p3', date:'2026-02-22', hours:2,   description:'Investigating CDS fiscal year association bug',        sentToStraTIME:false },
  { id:'ws39', consultant_id:'u3', ticket_id:'tk4',  project_id:'p3', date:'2026-02-24', hours:1.5, description:'Found root cause — association key misaligned on period boundaries', sentToStraTIME:false },
  // tk21
  { id:'ws40', consultant_id:'u5', ticket_id:'tk21', project_id:'p3', date:'2026-01-30', hours:3,   description:'Hierarchy data model for drill-down',                 sentToStraTIME:true,  sentAt:'2026-01-30T18:00:00Z' },
  { id:'ws41', consultant_id:'u5', ticket_id:'tk21', project_id:'p3', date:'2026-02-04', hours:4,   description:'Drill-down navigation with breadcrumbs',              sentToStraTIME:true,  sentAt:'2026-02-04T18:00:00Z' },
  { id:'ws42', consultant_id:'u5', ticket_id:'tk21', project_id:'p3', date:'2026-02-10', hours:3,   description:'Sparkline trend charts per cost center',              sentToStraTIME:true,  sentAt:'2026-02-10T18:00:00Z' },
  // tk22
  { id:'ws43', consultant_id:'u7', ticket_id:'tk22', project_id:'p3', date:'2026-02-03', hours:4,   description:'SLT replication setup for core tables',               sentToStraTIME:true,  sentAt:'2026-02-03T18:00:00Z' },
  { id:'ws44', consultant_id:'u7', ticket_id:'tk22', project_id:'p3', date:'2026-02-07', hours:4,   description:'Delta extraction and error handling configuration',   sentToStraTIME:true,  sentAt:'2026-02-07T18:00:00Z' },
  { id:'ws45', consultant_id:'u7', ticket_id:'tk22', project_id:'p3', date:'2026-02-13', hours:3,   description:'Performance tuning — achieved 2-3 min latency',       sentToStraTIME:true,  sentAt:'2026-02-13T18:00:00Z' },
  { id:'ws46', consultant_id:'u7', ticket_id:'tk22', project_id:'p3', date:'2026-02-17', hours:2,   description:'Final load testing and documentation',                sentToStraTIME:true,  sentAt:'2026-02-17T18:00:00Z' },
  // tk23
  { id:'ws47', consultant_id:'u5', ticket_id:'tk23', project_id:'p3', date:'2026-02-23', hours:2.5, description:'URL serialization of filter state parameters',        sentToStraTIME:false },
  // tk24
  { id:'ws48', consultant_id:'u3', ticket_id:'tk24', project_id:'p3', date:'2026-02-14', hours:1.5, description:'SheetJS library integration',                         sentToStraTIME:true,  sentAt:'2026-02-14T18:00:00Z' },
  { id:'ws49', consultant_id:'u3', ticket_id:'tk24', project_id:'p3', date:'2026-02-20', hours:2,   description:'Export formatting and testing across all 5 reports',   sentToStraTIME:true,  sentAt:'2026-02-20T18:00:00Z' },
  // tk26
  { id:'ws50', consultant_id:'u3', ticket_id:'tk26', project_id:'p3', date:'2026-02-02', hours:3,   description:'CDS views for actual/budget/forecast P&L data',       sentToStraTIME:true,  sentAt:'2026-02-02T18:00:00Z' },
  { id:'ws51', consultant_id:'u3', ticket_id:'tk26', project_id:'p3', date:'2026-02-06', hours:4,   description:'Waterfall chart component for variance visualization',sentToStraTIME:true,  sentAt:'2026-02-06T18:00:00Z' },
  { id:'ws52', consultant_id:'u3', ticket_id:'tk26', project_id:'p3', date:'2026-02-12', hours:3.5, description:'Monthly/quarterly toggle and final styling',           sentToStraTIME:true,  sentAt:'2026-02-12T18:00:00Z' },
  // tk28
  { id:'ws53', consultant_id:'u5', ticket_id:'tk28', project_id:'p1', date:'2026-02-24', hours:2,   description:'UI layout for credit limit comparison form',          sentToStraTIME:false },
  // tk29
  { id:'ws54', consultant_id:'u7', ticket_id:'tk29', project_id:'p1', date:'2026-02-17', hours:3,   description:'Dashboard layout with live counter widgets',          sentToStraTIME:true,  sentAt:'2026-02-17T18:00:00Z' },
  { id:'ws55', consultant_id:'u7', ticket_id:'tk29', project_id:'p1', date:'2026-02-20', hours:4,   description:'ETA algorithm based on throughput rate',              sentToStraTIME:true,  sentAt:'2026-02-20T18:00:00Z' },
  { id:'ws56', consultant_id:'u7', ticket_id:'tk29', project_id:'p1', date:'2026-02-22', hours:2.5, description:'Success/error/pending counters per object type',      sentToStraTIME:false },
];

// ── Notifications ───────────────────────────────────────────────────────────
const notifications = [
  { id:'n1', user_id:'u3', type:'ticket_assigned',  title:'Nouveau ticket assigné',       message:'Le ticket TK-001 vous a été assigné',                  read:false, createdAt:'2026-02-20T09:00:00Z' },
  { id:'n2', user_id:'u5', type:'ticket_assigned',  title:'Nouveau ticket assigné',       message:'Le ticket TK-002 vous a été assigné',                  read:true,  createdAt:'2026-02-19T14:00:00Z' },
  { id:'n3', user_id:'u3', type:'deadline_warning', title:'Échéance proche',              message:'Le ticket TK-007 arrive à échéance dans 3 jours',      read:false, createdAt:'2026-02-20T08:00:00Z' },
  { id:'n4', user_id:'u2', type:'status_change',    title:'Ticket résolu',                message:'Le ticket TK-006 a été marqué comme résolu',           read:true,  createdAt:'2026-02-15T10:00:00Z' },
  { id:'n5', user_id:'u4', type:'validation_needed',title:'Validation requise',           message:'Le livrable Programme migration ETL v0.3 est en attente de validation', read:false, createdAt:'2026-02-15T14:30:00Z' },
  { id:'n6', user_id:'u7', type:'ticket_assigned',  title:'Nouveau ticket assigné',       message:'Le ticket TK-017 Interface IDocs vous a été assigné',  read:false, createdAt:'2026-02-12T10:30:00Z' },
  { id:'n7', user_id:'u3', type:'comment_added',    title:'Nouveau commentaire',          message:'Marie Martin a commenté le ticket TK-007',             read:true,  createdAt:'2026-02-21T16:00:00Z' },
];

// ── ReferenceData ───────────────────────────────────────────────────────────
const referenceData = [
  { id:'r1', type:'TASK_STATUS',   code:'IN_PROGRESS', label:'En cours',   active:true, orderIndex:2 },
  { id:'r2', type:'PRIORITY',      code:'HIGH',        label:'Haute',      active:true, orderIndex:3 },
  { id:'r3', type:'PROJECT_TYPE',  code:'MIGRATION',   label:'Migration',  active:true, orderIndex:1 },
];

// ── Allocations ─────────────────────────────────────────────────────────────
const allocations = [
  { id:'a1', user_id:'u3', project_id:'p1', allocationPercent:50,  startDate:'2026-01-01', endDate:'2026-06-30' },
  { id:'a2', user_id:'u3', project_id:'p2', allocationPercent:30,  startDate:'2026-02-01', endDate:'2026-05-31' },
  { id:'a3', user_id:'u5', project_id:'p2', allocationPercent:40,  startDate:'2026-02-01', endDate:'2026-05-31' },
];

// ── LeaveRequests ───────────────────────────────────────────────────────────
const leaveRequests = [
  { id:'lr1', consultant_id:'u3', startDate:'2026-03-10', endDate:'2026-03-14', reason:'Vacances',                   status:'APPROVED', manager_id:'u2', createdAt:'2026-02-10T09:00:00Z', reviewedAt:'2026-02-11T10:00:00Z' },
  { id:'lr2', consultant_id:'u5', startDate:'2026-04-01', endDate:'2026-04-04', reason:'Formation SAP BTP',           status:'APPROVED', manager_id:'u2', createdAt:'2026-02-15T14:00:00Z', reviewedAt:'2026-02-16T09:00:00Z' },
  { id:'lr3', consultant_id:'u7', startDate:'2026-03-17', endDate:'2026-03-21', reason:'Congé personnel',             status:'PENDING',  manager_id:'u2', createdAt:'2026-02-20T10:00:00Z' },
  { id:'lr4', consultant_id:'u3', startDate:'2026-05-05', endDate:'2026-05-09', reason:'Conférence SAP TechEd',       status:'PENDING',  manager_id:'u2', createdAt:'2026-02-22T11:00:00Z' },
];

// ── ImputationPeriods ───────────────────────────────────────────────────────
const imputationPeriods = [
  { id:'ip1', user_id:'u3', year:2026, month:1, period:1, totalHours:32,   status:'validated', sentAt:'2026-01-16T09:00:00Z', validatedBy_id:'u6', validatedAt:'2026-01-17T10:00:00Z' },
  { id:'ip2', user_id:'u3', year:2026, month:1, period:2, totalHours:28,   status:'validated', sentAt:'2026-02-01T08:30:00Z', validatedBy_id:'u6', validatedAt:'2026-02-02T11:00:00Z' },
  { id:'ip3', user_id:'u5', year:2026, month:1, period:1, totalHours:35,   status:'validated', sentAt:'2026-01-16T10:00:00Z', validatedBy_id:'u6', validatedAt:'2026-01-17T11:00:00Z' },
  { id:'ip4', user_id:'u5', year:2026, month:1, period:2, totalHours:30,   status:'validated', sentAt:'2026-02-01T09:00:00Z', validatedBy_id:'u6', validatedAt:'2026-02-02T14:00:00Z' },
  { id:'ip5', user_id:'u3', year:2026, month:2, period:1, totalHours:4.75, status:'sent',      sentAt:'2026-02-16T09:00:00Z' },
  { id:'ip6', user_id:'u5', year:2026, month:2, period:1, totalHours:4,    status:'sent',      sentAt:'2026-02-16T10:00:00Z' },
  { id:'ip7', user_id:'u7', year:2026, month:2, period:1, totalHours:10,   status:'sent',      sentAt:'2026-02-16T11:00:00Z' },
];

// ── Abaques ─────────────────────────────────────────────────────────────────
const abaques = [
  { id:'abq-p1-v1', project_id:'p1', title:'Abaque S/4HANA – Initial',              version:'v1.0', createdAt:'2026-01-05T10:00:00Z', createdBy_id:'u4', lastUpdatedAt:'2026-01-10T14:00:00Z', lastUpdatedBy_id:'u2', approvedByClient:true,  approvedAt:'2026-01-12T09:00:00Z' },
  { id:'abq-p1-v2', project_id:'p1', title:'Abaque S/4HANA – Révision Sprint 2',    version:'v1.1', createdAt:'2026-02-01T10:00:00Z', createdBy_id:'u2', lastUpdatedAt:'2026-02-05T16:00:00Z', lastUpdatedBy_id:'u2', approvedByClient:false },
  { id:'abq-p2-v1', project_id:'p2', title:'Abaque Fiori Launchpad',                version:'v1.0', createdAt:'2026-02-03T10:00:00Z', createdBy_id:'u4', lastUpdatedAt:'2026-02-03T10:00:00Z', lastUpdatedBy_id:'u4', approvedByClient:true,  approvedAt:'2026-02-04T11:00:00Z' },
  { id:'abq-p3-v1', project_id:'p3', title:'Abaque BI Reporting Platform',          version:'v1.0', createdAt:'2026-01-20T08:00:00Z', createdBy_id:'u4', lastUpdatedAt:'2026-01-22T10:00:00Z', lastUpdatedBy_id:'u2', approvedByClient:true,  approvedAt:'2026-01-25T09:00:00Z' },
];

// ── AbaqueEntries (generated, replicating frontend genEntries) ──────────────
function genEntries(prefix) {
  const devTypes = ['Formulaire','Report','Enhancement','Programme'];
  const complexites = ['Simple','Moyen','Complexe','Très Complexe'];
  const priorites = [0,1,2,3];
  const baseDays = { Simple:1, Moyen:3, Complexe:6, 'Très Complexe':12 };
  const devMul = { Formulaire:1, Report:0.8, Enhancement:1.2, Programme:1.5 };
  const prioOff = { 0:1, 1:0.5, 2:0, 3:0 };
  const entries = [];
  let idx = 1;
  for (const dt of devTypes) {
    for (const cx of complexites) {
      for (const pr of priorites) {
        if ((idx + pr) % 5 === 0) { idx++; continue; }
        const std = Math.max(1, Math.round(baseDays[cx] * devMul[dt] + prioOff[pr]));
        const max = std + Math.max(1, Math.round(std * 0.5));
        const note = cx === 'Très Complexe' ? 'Revue architecturale obligatoire' : '';
        entries.push({ id:`${prefix}-e${idx}`, abaque_id: prefix, devType:dt, complexite:cx, priorite:pr, standardDays:std, maxDays:max, notes:note });
        idx++;
      }
    }
  }
  return entries;
}

const abaqueEntries = [
  ...genEntries('abq-p1-v1'),
  ...genEntries('abq-p1-v2'),
  ...genEntries('abq-p2-v1'),
  ...genEntries('abq-p3-v1'),
];

// ══════════════════════════════════════════════════════════════════════════════
// WRITE ALL CSV FILES
// ══════════════════════════════════════════════════════════════════════════════
console.log('Generating CSV seed data...\n');

writeCsv('Users', ['id','name','email','role','active','availabilityPercent','teamId','avatarUrl'], users);
writeCsv('UserSkills', ['id','user_id','skill'], userSkills);
writeCsv('Certifications', ['id','user_id','name','issuingBody','dateObtained','expiryDate','status'], certifications);
writeCsv('Projects', ['id','code','name','manager_id','startDate','endDate','status','priority','description','progress','budget','complexity','documentation'], projects);
writeCsv('ProjectKeywords', ['id','project_id','keyword'], projectKeywords);
writeCsv('Objets', ['id','project_id','code','name','description','module','devType','complexite','priorite','createdAt','createdBy_id'], objets);
writeCsv('Documentations', ['id','objet_id','title','content','version','createdBy_id','updatedBy_id','createdAt','updatedAt'], documentations);
writeCsv('Tasks', ['id','project_id','title','description','status','priority','assignee_id','plannedStart','plannedEnd','realStart','realEnd','progressPercent','estimatedHours','actualHours','isCritical','riskLevel','comments'], tasks);
writeCsv('Timesheets', ['id','user_id','date','hours','project_id','task_id','comment'], timesheets);
writeCsv('Evaluations', ['id','user_id','evaluator_id','project_id','period','score','qualitativeGrid_productivity','qualitativeGrid_quality','qualitativeGrid_autonomy','qualitativeGrid_collaboration','qualitativeGrid_innovation','feedback','createdAt'], evaluations);
writeCsv('Deliverables', ['id','project_id','task_id','type','name','url','fileRef','validationStatus','functionalComment','createdAt'], deliverables);
writeCsv('Tickets', ['id','project_id','objet_id','createdBy_id','assignedTo_id','status','priority','devType','title','description','dueDate','createdAt','updatedAt','chiffrage','complexite','priorite','module','wricef','chiffrageJustification'], tickets);
writeCsv('TicketEvents', ['id','ticket_id','timestamp','user_id','action','fromValue','toValue','comment'], ticketEvents);
writeCsv('TicketMessages', ['id','ticket_id','sender_id','senderName','senderRole','content','sentAt'], ticketMessages);
writeCsv('ActivityEvents', ['id','ticket_id','type','actor_id','actorName','actorRole','description','metadata','occurredAt'], activityEvents);
writeCsv('WorkSessions', ['id','consultant_id','ticket_id','project_id','date','hours','description','sentToStraTIME','sentAt'], workSessions);
writeCsv('Notifications', ['id','user_id','type','title','message','read','createdAt'], notifications);
writeCsv('ReferenceData', ['id','type','code','label','active','orderIndex'], referenceData);
writeCsv('Allocations', ['id','user_id','project_id','allocationPercent','startDate','endDate'], allocations);
writeCsv('LeaveRequests', ['id','consultant_id','startDate','endDate','reason','status','manager_id','createdAt','reviewedAt'], leaveRequests);
writeCsv('ImputationPeriods', ['id','user_id','year','month','period','totalHours','status','sentAt','validatedBy_id','validatedAt','rejectionReason'], imputationPeriods);
writeCsv('Abaques', ['id','project_id','title','version','createdAt','createdBy_id','lastUpdatedAt','lastUpdatedBy_id','approvedByClient','approvedAt'], abaques);
writeCsv('AbaqueEntries', ['id','abaque_id','devType','complexite','priorite','standardDays','maxDays','notes'], abaqueEntries);

console.log(`\nDone! Generated ${23} CSV files in ${DATA_DIR}`);
