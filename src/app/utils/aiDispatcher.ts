/**
 * AI Dispatcher – Deterministic client-side recommendation engine.
 *
 * For every unassigned ticket, scores each available consultant and picks
 * the best match.  Returns a confidence score (0–100) and a human-readable
 * French reasoning string built dynamically from the actual computed values.
 *
 * Scoring weights:
 *   devType experience  30 %
 *   Skill match          25 %
 *   Availability         20 %
 *   Current workload     15 %
 *   Evaluation scores    10 %
 */

import type {
  DevType,
  Evaluation,
  Objet,
  Priority,
  Project,
  Ticket,
  User,
  WorkSession,
} from '../types/entities';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface ConsultantScore {
  userId: string;
  userName: string;
  confidenceScore: number; // 0–100
  reasoning: string;       // dynamic French explanation
  /** Individual criterion scores (0–1 each) */
  detail: {
    devTypeExp: number;
    skillMatch: number;
    availability: number;
    workload: number;
    evaluation: number;
  };
}

export interface TicketRecommendation {
  ticket: Ticket;
  projectName: string;
  objetName?: string;
  bestMatch: ConsultantScore;
  alternatives: ConsultantScore[]; // next-best consultant(s)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalise strings for fuzzy keyword matching (lower-case, trimmed). */
const norm = (s: string) => s.toLowerCase().trim();

/** French label for a DevType */
const devTypeLabel: Record<DevType, string> = {
  Formulaire: 'Formulaire',
  Report: 'Report',
  Enhancement: 'Enhancement',
  Programme: 'Programme',
};

const priorityIsHighOrCritical = (p: Priority) => p === 'HIGH' || p === 'CRITICAL';

// ---------------------------------------------------------------------------
// Core scoring
// ---------------------------------------------------------------------------

function scoreConsultantForTicket(
  consultant: User,
  ticket: Ticket,
  allSessions: WorkSession[],
  allEvaluations: Evaluation[],
  techKeywords: string[],
): ConsultantScore {
  // --- 1. DevType experience (30 %) ---
  const consultantSessions = allSessions.filter(
    (ws) => ws.consultantId === consultant.id,
  );
  let devTypeExp = 0;
  if (ticket.devType && consultantSessions.length > 0) {
    // We need to correlate sessions to tickets to check devType.
    // Since sessions don't store devType directly, count sessions whose
    // ticketId corresponds to a ticket with the same devType.
    // We receive all sessions – we'll match them based on the ticket map
    // already built outside (via allSessions).
    // For simplicity: we pass only sessions that belong to this consultant.
    // devType matching is approximated by looking at session hours per devType
    // (see outer function that pre-computes ticketDevTypeMap).
    // The outer caller patches devTypeExp after calling this function.
    devTypeExp = 0; // placeholder – patched below
  }

  // --- 2. Skill match (25 %) ---
  let skillMatch = 0;
  if (techKeywords.length > 0) {
    const consultantSkillsNorm = consultant.skills.map(norm);
    const matched = techKeywords.filter((kw) =>
      consultantSkillsNorm.some(
        (sk) => sk.includes(norm(kw)) || norm(kw).includes(sk),
      ),
    );
    skillMatch = matched.length / techKeywords.length;
  }

  // --- 3. Availability (20 %) ---
  const availability = (consultant.availabilityPercent ?? 0) / 100;

  // --- 4. Current workload (15 %) – inverse of hours this month ---
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const hoursThisMonth = consultantSessions
    .filter((ws) => ws.date.startsWith(monthKey))
    .reduce((sum, ws) => sum + ws.hours, 0);
  // More hours → lower score.  Cap at 160 h (full-time month).
  const workload = Math.max(0, 1 - hoursThisMonth / 160);

  // --- 5. Evaluation scores (10 %) ---
  const evals = allEvaluations.filter((ev) => ev.userId === consultant.id);
  let evaluationScore = 0.5; // default when no evaluations
  if (evals.length > 0) {
    // Pick most recent evaluation
    const latest = evals.reduce((a, b) =>
      a.createdAt > b.createdAt ? a : b,
    );
    if (priorityIsHighOrCritical(ticket.priority)) {
      evaluationScore = (latest.qualitativeGrid.autonomy ?? 3) / 5;
    } else if (ticket.priority === 'LOW') {
      evaluationScore = (latest.qualitativeGrid.collaboration ?? 3) / 5;
    } else {
      evaluationScore = (latest.qualitativeGrid.productivity ?? 3) / 5;
    }
  }

  const detail = {
    devTypeExp,
    skillMatch,
    availability,
    workload,
    evaluation: evaluationScore,
  };

  const confidenceScore = computeWeightedScore(detail);

  const reasoning = buildReasoning(
    consultant,
    ticket,
    detail,
    hoursThisMonth,
    techKeywords,
    consultantSessions.length,
  );

  return {
    userId: consultant.id,
    userName: consultant.name,
    confidenceScore,
    reasoning,
    detail,
  };
}

function computeWeightedScore(d: ConsultantScore['detail']): number {
  const raw =
    d.devTypeExp * 0.30 +
    d.skillMatch * 0.25 +
    d.availability * 0.20 +
    d.workload * 0.15 +
    d.evaluation * 0.10;
  return Math.round(raw * 100);
}

// ---------------------------------------------------------------------------
// Reasoning builder (French)
// ---------------------------------------------------------------------------

function buildReasoning(
  consultant: User,
  ticket: Ticket,
  detail: ConsultantScore['detail'],
  hoursThisMonth: number,
  techKeywords: string[],
  sessionCount: number,
): string {
  const parts: string[] = [];

  // DevType
  if (ticket.devType) {
    const pct = Math.round(detail.devTypeExp * 100);
    if (pct > 0) {
      parts.push(
        `Expérience en ${devTypeLabel[ticket.devType]} (${pct}% de ses sessions).`,
      );
    } else if (sessionCount === 0) {
      parts.push(`Aucune session enregistrée – expérience ${devTypeLabel[ticket.devType]} inconnue.`);
    } else {
      parts.push(`Pas d'expérience directe en ${devTypeLabel[ticket.devType]}.`);
    }
  }

  // Skills
  if (techKeywords.length > 0) {
    const consultantSkillsNorm = consultant.skills.map(norm);
    const matched = techKeywords.filter((kw) =>
      consultantSkillsNorm.some(
        (sk) => sk.includes(norm(kw)) || norm(kw).includes(sk),
      ),
    );
    if (matched.length > 0) {
      parts.push(
        `Compétences ${matched.join(', ')} correspondantes.`,
      );
    } else {
      parts.push('Aucune compétence technique directement correspondante.');
    }
  }

  // Workload
  parts.push(`Charge actuelle : ${hoursThisMonth.toFixed(0)}h ce mois.`);

  // Availability
  parts.push(`Disponibilité à ${consultant.availabilityPercent}%.`);

  // Evaluation
  if (detail.evaluation > 0.7) {
    const axis = priorityIsHighOrCritical(ticket.priority)
      ? 'Autonomie'
      : ticket.priority === 'LOW'
        ? 'Collaboration'
        : 'Productivité';
    parts.push(`Bon score d'évaluation en ${axis}.`);
  }

  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export interface DispatcherInput {
  tickets: Ticket[];
  users: User[];
  projects: Project[];
  objets: Objet[];
  workSessions: WorkSession[];
  evaluations: Evaluation[];
}

/**
 * Compute recommendations for all unassigned (no `assignedTo`) and non-closed
 * tickets.  Returns an array sorted by ticket priority (CRITICAL first).
 */
export function computeRecommendations(
  input: DispatcherInput,
): TicketRecommendation[] {
  const { tickets, users, projects, objets, workSessions, evaluations } = input;

  // Only consider active consultants
  const consultants = users.filter(
    (u) =>
      (u.role === 'CONSULTANT_TECHNIQUE' || u.role === 'CONSULTANT_FONCTIONNEL') &&
      u.active,
  );

  // Unassigned, non-closed/resolved tickets
  const unassigned = tickets.filter(
    (t) => !t.assignedTo && t.status !== 'CLOSED' && t.status !== 'RESOLVED',
  );

  if (unassigned.length === 0 || consultants.length === 0) return [];

  // Pre-compute ticket devType map (ticketId → devType)
  const ticketDevTypeMap = new Map<string, DevType>();
  tickets.forEach((t) => {
    if (t.devType) ticketDevTypeMap.set(t.id, t.devType);
  });

  // Pre-compute per-consultant devType session distribution
  const consultantDevTypeDist = new Map<
    string,
    { total: number; perType: Record<string, number> }
  >();
  consultants.forEach((c) => {
    const cSessions = workSessions.filter((ws) => ws.consultantId === c.id);
    const perType: Record<string, number> = {};
    let total = 0;
    cSessions.forEach((ws) => {
      const dt = ticketDevTypeMap.get(ws.ticketId);
      if (dt) {
        perType[dt] = (perType[dt] ?? 0) + 1;
        total++;
      }
    });
    // Also count sessions from tickets assigned to this consultant
    tickets
      .filter((t) => t.assignedTo === c.id && t.devType)
      .forEach((t) => {
        // Ensure we count the ticket's type at least once even without sessions
        if (!perType[t.devType!]) {
          perType[t.devType!] = (perType[t.devType!] ?? 0) + 1;
          total++;
        }
      });
    consultantDevTypeDist.set(c.id, { total, perType });
  });

  const priorityOrder: Record<Priority, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  const results: TicketRecommendation[] = [];

  for (const ticket of unassigned) {
    const project = projects.find((p) => p.id === ticket.projectId);
    const objet = ticket.objetId
      ? objets.find((o) => o.id === ticket.objetId)
      : undefined;

    // Gather tech keywords from the project (+ objet name words as bonus)
    const techKeywords: string[] = [...(project?.techKeywords ?? [])];
    if (objet) {
      // Add objet name words as extra keywords
      objet.name.split(/\s+/).forEach((w) => {
        if (w.length > 2) techKeywords.push(w);
      });
    }

    const scores: ConsultantScore[] = consultants.map((c) => {
      const score = scoreConsultantForTicket(
        c,
        ticket,
        workSessions,
        evaluations,
        techKeywords,
      );

      // Patch devTypeExp using pre-computed distribution
      const dist = consultantDevTypeDist.get(c.id);
      if (dist && ticket.devType && dist.total > 0) {
        score.detail.devTypeExp =
          (dist.perType[ticket.devType] ?? 0) / dist.total;
      } else {
        score.detail.devTypeExp = 0;
      }

      // Recompute confidence with patched devTypeExp
      score.confidenceScore = computeWeightedScore(score.detail);

      // Rebuild reasoning with correct devTypeExp
      const consultantSessions = workSessions.filter(
        (ws) => ws.consultantId === c.id,
      );
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const hoursThisMonth = consultantSessions
        .filter((ws) => ws.date.startsWith(monthKey))
        .reduce((sum, ws) => sum + ws.hours, 0);
      score.reasoning = buildReasoning(
        c,
        ticket,
        score.detail,
        hoursThisMonth,
        techKeywords,
        consultantSessions.length,
      );

      return score;
    });

    // Sort by confidence descending
    scores.sort((a, b) => b.confidenceScore - a.confidenceScore);

    const [best, ...rest] = scores;
    if (!best) continue;

    results.push({
      ticket,
      projectName: project?.name ?? ticket.projectId,
      objetName: objet?.name,
      bestMatch: best,
      alternatives: rest.slice(0, 2), // top 2 alternatives
    });
  }

  // Sort recommendations by ticket priority
  results.sort(
    (a, b) =>
      priorityOrder[a.ticket.priority] - priorityOrder[b.ticket.priority],
  );

  return results;
}
