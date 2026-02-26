import XLSX from 'xlsx';

const headers = ['ID', 'Titre', 'Description', 'Complexité', 'Module', 'Type de Dev', 'Priorité'];

const rows = [
  ['HR-001', 'Fiche Salarié Étendue',           'Formulaire de gestion des données salarié avec champs custom SuccessFactors',         'Complexe',       'HR', 'Formulaire',  1],
  ['HR-002', 'Rapport Masse Salariale',          'Rapport mensuel de masse salariale par département avec drill-down',                  'Moyen',          'HR', 'Report',      2],
  ['HR-003', 'Interface Paie SF→S4',             'Programme d\'intégration des données de paie SuccessFactors vers S/4HANA FI',         'Très Complexe',  'FI', 'Programme',   0],
  ['HR-004', 'Validation Congés Workflow',       'Enhancement du workflow standard de validation des congés avec règles custom',         'Complexe',       'HR', 'Enhancement', 1],
  ['HR-005', 'Formulaire Évaluation Annuelle',   'Formulaire Fiori d\'évaluation annuelle avec grille de compétences configurable',     'Complexe',       'HR', 'Formulaire',  1],
  ['HR-006', 'Rapport Turnover & Absentéisme',   'Dashboard de suivi du turnover et de l\'absentéisme par entité juridique',            'Moyen',          'HR', 'Report',      2],
  ['HR-007', 'Batch Création Salariés',          'Programme batch de création en masse des fiches salarié depuis fichier Excel',         'Moyen',          'HR', 'Programme',   2],
  ['HR-008', 'Exit Check-list Enhancement',      'Enhancement de la transaction de sortie salarié avec check-list configurable',         'Simple',         'HR', 'Enhancement', 3],
  ['PA-001', 'Attestation Travail Auto',         'Programme de génération automatique des attestations de travail en PDF',               'Moyen',          'PA', 'Programme',   2],
  ['PA-002', 'Formulaire Demande Formation',     'Formulaire Fiori de demande de formation avec workflow d\'approbation budgétaire',     'Complexe',       'PA', 'Formulaire',  1],
  ['FI-001', 'Rapport Provisions CP/RTT',        'Rapport de calcul des provisions comptables pour congés payés et RTT',                'Complexe',       'FI', 'Report',      1],
  ['FI-002', 'Interface Comptable Paie',         'Enhancement de l\'interface comptable pour ventiler les écritures de paie par centre', 'Très Complexe',  'FI', 'Enhancement', 0],
];

const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
ws['!cols'] = [
  { wch: 10 },  // ID
  { wch: 35 },  // Titre
  { wch: 80 },  // Description
  { wch: 16 },  // Complexité
  { wch: 8 },   // Module
  { wch: 14 },  // Type de Dev
  { wch: 10 },  // Priorité
];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'WRICEF');
XLSX.writeFile(wb, 'WRICEF_HRMS_Project.xlsx');

console.log('✅ WRICEF_HRMS_Project.xlsx generated');