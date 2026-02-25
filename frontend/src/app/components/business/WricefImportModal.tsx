import React, { useCallback, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { AlertTriangle, Download, FileSpreadsheet, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import type { DevType, Objet, TicketComplexite, TicketPriorite } from '../../types/entities';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParsedRow {
  code: string;
  name: string;
  description: string;
  complexite?: TicketComplexite;
  module: string;
  devType?: DevType;
  priorite?: TicketPriorite;
  valid: boolean;
  warnings: string[];
}

interface WricefImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  existingObjetCount: number;
  currentUserId: string;
  onImport: (objets: Omit<Objet, 'id'>[]) => void;
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

const COMPLEXITE_MAP: Record<string, TicketComplexite> = {
  simple: 'Simple',
  facile: 'Simple',
  easy: 'Simple',
  low: 'Simple',
  s: 'Simple',
  moyen: 'Moyen',
  moyenne: 'Moyen',
  medium: 'Moyen',
  m: 'Moyen',
  complexe: 'Complexe',
  complex: 'Complexe',
  high: 'Complexe',
  c: 'Complexe',
  'très complexe': 'Très Complexe',
  'tres complexe': 'Très Complexe',
  'very complex': 'Très Complexe',
  'très élevé': 'Très Complexe',
  'tres eleve': 'Très Complexe',
  critical: 'Très Complexe',
  tc: 'Très Complexe',
};

const DEVTYPE_MAP: Record<string, DevType> = {
  formulaire: 'Formulaire',
  form: 'Formulaire',
  f: 'Formulaire',
  report: 'Report',
  rapport: 'Report',
  r: 'Report',
  enhancement: 'Enhancement',
  amelioration: 'Enhancement',
  amélioration: 'Enhancement',
  e: 'Enhancement',
  programme: 'Programme',
  program: 'Programme',
  prog: 'Programme',
  p: 'Programme',
};

const PRIORITE_MAP: Record<string, TicketPriorite> = {
  '0': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  critique: 0,
  critical: 0,
  haute: 1,
  high: 1,
  moyenne: 2,
  medium: 2,
  basse: 3,
  low: 3,
  p0: 0,
  p1: 1,
  p2: 2,
  p3: 3,
};

function normalizeHeader(h: unknown): string {
  return String(h ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const HEADER_ALIASES: Record<string, string> = {
  id: 'code',
  code: 'code',
  wricef: 'code',
  'code wricef': 'code',
  reference: 'code',
  ref: 'code',
  titre: 'name',
  title: 'name',
  nom: 'name',
  name: 'name',
  libelle: 'name',
  label: 'name',
  description: 'description',
  desc: 'description',
  detail: 'description',
  details: 'description',
  complexite: 'complexite',
  complexité: 'complexite',
  complexity: 'complexite',
  niveau: 'complexite',
  level: 'complexite',
  module: 'module',
  'module sap': 'module',
  'sap module': 'module',
  'type de dev': 'devType',
  'type dev': 'devType',
  'type de developpement': 'devType',
  'dev type': 'devType',
  devtype: 'devType',
  type: 'devType',
  priorite: 'priorite',
  priorité: 'priorite',
  priority: 'priorite',
  prio: 'priorite',
  urgence: 'priorite',
};

function resolveHeader(raw: string): string | null {
  const key = normalizeHeader(raw);
  // Try direct match
  if (HEADER_ALIASES[key]) return HEADER_ALIASES[key];
  // Try partial matching
  for (const [alias, mapped] of Object.entries(HEADER_ALIASES)) {
    if (key.includes(alias)) return mapped;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const WricefImportModal: React.FC<WricefImportModalProps> = ({
  open,
  onOpenChange,
  projectId,
  existingObjetCount,
  currentUserId,
  onImport,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parsed, setParsed] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const validRows = useMemo(() => rows.filter((r) => r.valid), [rows]);
  const invalidCount = rows.length - validRows.length;

  // -----------------------------------------------------------------------
  // Template download
  // -----------------------------------------------------------------------
  const downloadTemplate = useCallback(() => {
    const headers = ['ID', 'Titre', 'Description', 'Complexité', 'Module', 'Type de Dev', 'Priorité'];
    const example = ['MM-001', 'Gestion des données client', 'Migration et nettoyage...', 'Complexe', 'MM', 'Enhancement', '1'];
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    ws['!cols'] = headers.map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'WRICEF');
    XLSX.writeFile(wb, 'WRICEF_Template.xlsx');
  }, []);

  // -----------------------------------------------------------------------
  // File parsing
  // -----------------------------------------------------------------------
  const parseFile = useCallback(
    async (f: File) => {
      const buffer = await f.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      if (!firstSheet) {
        toast.error('Le fichier ne contient aucune feuille.');
        return;
      }

      const rawData: unknown[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      if (rawData.length < 2) {
        toast.error('Le fichier doit contenir au moins un en-tête et une ligne de données.');
        return;
      }

      // Map headers
      const headerRow = rawData[0] as string[];
      const colMap: Record<string, number> = {};
      headerRow.forEach((h, idx) => {
        const mapped = resolveHeader(String(h));
        if (mapped && !(mapped in colMap)) {
          colMap[mapped] = idx;
        }
      });

      if (!('code' in colMap) && !('name' in colMap)) {
        toast.error('Colonnes obligatoires manquantes: ID et Titre introuvables.');
        return;
      }

      const parsed: ParsedRow[] = [];
      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i] as unknown[];
        if (!row || row.every((cell) => cell == null || String(cell).trim() === '')) continue;

        const warnings: string[] = [];
        const code = String(row[colMap.code] ?? '').trim();
        const name = String(row[colMap.name] ?? '').trim();
        const desc = String(row[colMap.description] ?? '').trim();
        const moduleRaw = String(row[colMap.module] ?? '').trim().toUpperCase();
        const cxRaw = String(row[colMap.complexite] ?? '').trim().toLowerCase();
        const dtRaw = String(row[colMap.devType] ?? '').trim().toLowerCase();
        const prRaw = String(row[colMap.priorite] ?? '').trim();

        if (!code) warnings.push('ID manquant');
        if (!name) warnings.push('Titre manquant');

        const complexite = COMPLEXITE_MAP[cxRaw];
        if (cxRaw && !complexite) warnings.push(`Complexité inconnue: ${cxRaw}`);

        const devType = DEVTYPE_MAP[dtRaw];
        if (dtRaw && !devType) warnings.push(`Type de Dev inconnu: ${dtRaw}`);

        let priorite: TicketPriorite | undefined;
        if (prRaw !== '') {
          const prKey = prRaw.toLowerCase();
          if (prKey in PRIORITE_MAP) {
            priorite = PRIORITE_MAP[prKey];
          } else {
            const num = parseInt(prRaw, 10);
            if ([0, 1, 2, 3].includes(num)) {
              priorite = num as TicketPriorite;
            } else {
              warnings.push(`Priorité invalide: ${prRaw}`);
            }
          }
        }

        const valid = !!code && !!name;

        parsed.push({
          code,
          name,
          description: desc,
          complexite,
          module: moduleRaw,
          devType,
          priorite,
          valid,
          warnings,
        });
      }

      setRows(parsed);
      setParsed(true);

      if (parsed.length === 0) {
        toast.error('Aucune ligne de données trouvée dans le fichier.');
      }
    },
    [],
  );

  const handleFileSelect = useCallback(
    (f: File) => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (ext !== 'xlsx' && ext !== 'xls') {
        toast.error('Seuls les fichiers .xlsx et .xls sont acceptés.');
        return;
      }
      setFile(f);
      setParsed(false);
      setRows([]);
      void parseFile(f);
    },
    [parseFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFileSelect(f);
    },
    [handleFileSelect],
  );

  const confirmImport = useCallback(() => {
    const now = new Date().toISOString();
    const newObjets: Omit<Objet, 'id'>[] = validRows.map((r) => ({
      projectId,
      code: r.code,
      name: r.name,
      description: r.description || undefined,
      module: r.module || undefined,
      devType: r.devType,
      complexite: r.complexite,
      priorite: r.priorite,
      createdAt: now,
      createdBy: currentUserId,
    }));
    onImport(newObjets);
    toast.success(`${newObjets.length} objets importés avec succès depuis le WRICEF.`);
    // Reset
    setFile(null);
    setRows([]);
    setParsed(false);
    onOpenChange(false);
  }, [validRows, projectId, currentUserId, onImport, onOpenChange]);

  const reset = () => {
    setFile(null);
    setRows([]);
    setParsed(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importer WRICEF
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning if project already has objets */}
          {existingObjetCount > 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800 dark:text-amber-300">
                Ce projet contient déjà {existingObjetCount} objets. L'import ajoutera de nouveaux objets sans écraser les existants.
              </p>
            </div>
          )}

          {/* Helper text */}
          <p className="text-sm text-muted-foreground">
            Le fichier WRICEF doit contenir les colonnes : <strong>ID</strong>, <strong>Titre</strong>, Description, Complexité, Module, Type de Dev, Priorité.
          </p>

          {/* Template download */}
          <Button variant="link" className="h-auto p-0 text-primary" onClick={downloadTemplate}>
            <Download className="mr-1 h-4 w-4" />
            Télécharger un modèle
          </Button>

          {/* Dropzone */}
          {!parsed && (
            <div
              className={`relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 transition-colors ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center">
                Glissez-déposez un fichier .xlsx ou .xls ici
              </p>
              <span className="text-xs text-muted-foreground">ou</span>
              <Button variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  Parcourir
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileSelect(f);
                    }}
                  />
                </label>
              </Button>
              {file && (
                <p className="text-xs text-foreground font-medium mt-2">{file.name}</p>
              )}
            </div>
          )}

          {/* Preview table */}
          {parsed && rows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-xs">{validRows.length} objets valides</Badge>
                  {invalidCount > 0 && (
                    <Badge variant="destructive" className="text-xs">{invalidCount} lignes ignorées</Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={reset}>
                  Changer de fichier
                </Button>
              </div>

              <div className="rounded-lg border max-h-[340px] overflow-auto">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0">
                    <TableRow>
                      <TableHead className="px-3 w-8" />
                      <TableHead className="px-3">Code</TableHead>
                      <TableHead className="px-3">Titre</TableHead>
                      <TableHead className="px-3">Module</TableHead>
                      <TableHead className="px-3">Type</TableHead>
                      <TableHead className="px-3">Complexité</TableHead>
                      <TableHead className="px-3">Priorité</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, idx) => (
                      <TableRow key={idx} className={row.valid ? '' : 'bg-destructive/5'}>
                        <TableCell className="px-3">
                          {!row.valid && <AlertTriangle className="h-4 w-4 text-destructive" />}
                          {row.valid && row.warnings.length > 0 && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                        </TableCell>
                        <TableCell className="px-3 font-mono text-xs">{row.code || '—'}</TableCell>
                        <TableCell className="px-3 text-sm">{row.name || '—'}</TableCell>
                        <TableCell className="px-3 text-xs">{row.module || '—'}</TableCell>
                        <TableCell className="px-3 text-xs">{row.devType || '—'}</TableCell>
                        <TableCell className="px-3 text-xs">{row.complexite || '—'}</TableCell>
                        <TableCell className="px-3 text-xs">{row.priorite != null ? `P${row.priorite}` : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button onClick={confirmImport} disabled={validRows.length === 0}>
                  <Upload className="mr-1 h-4 w-4" />
                  Importer {validRows.length} objets
                </Button>
              </div>
            </div>
          )}

          {parsed && rows.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <p>Aucune donnée trouvée dans le fichier.</p>
              <Button variant="ghost" size="sm" onClick={reset} className="mt-2">
                Réessayer
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
