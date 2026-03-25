// ─── Reconciliation ───────────────────────────────────────────────────────────

export interface PatientContext {
  age: number;
  conditions: string[];
  recent_labs: Record<string, string | number>;
}

export interface MedicationSource {
  system: string;
  medication: string;
  last_updated?: string;
  last_filled?: string;
  source_reliability: 'low' | 'medium' | 'high' | number;
}

export interface ReconcileRequest {
  patient_context: PatientContext;
  sources: MedicationSource[];
}

export interface ClinicalSafetyCheck {
  safe: boolean;
  warnings: string[];
}

export interface ReconcileResponse {
  reconciled_medication: string;
  confidence_score: number; // 0.0–1.0
  reasoning: string;
  recommended_actions: string[];
  clinical_safety_check: ClinicalSafetyCheck;
}

// ─── Data Quality ─────────────────────────────────────────────────────────────

export interface ValidateRequest {
  demographics: {
    name?: string;
    date_of_birth?: string;
    gender?: string;
    address?: string;
    phone?: string;
    insurance_id?: string;
  };
  medications: Array<{
    name: string;
    dose?: string;
    frequency?: string;
    prescriber?: string;
    start_date?: string;
  }>;
  allergies: Array<{
    allergen: string;
    reaction?: string;
    severity?: string;
  }>;
  conditions: Array<{
    name: string;
    onset_date?: string;
    status?: string;
  }>;
  vital_signs: {
    blood_pressure?: string;
    heart_rate?: number;
    temperature?: number;
    respiratory_rate?: number;
    oxygen_saturation?: number;
    weight_kg?: number;
    height_cm?: number;
  };
  last_updated: string;
}

export interface QualityBreakdown {
  completeness: number;
  accuracy: number;
  timeliness: number;
  clinical_plausibility: number;
}

export interface DetectedIssue {
  field: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ValidateResponse {
  overall_score: number; // 0–100
  breakdown: QualityBreakdown;
  issues_detected: DetectedIssue[];
}

// ─── Shared ───────────────────────────────────────────────────────────────────

export type ConnectionStatus = 'idle' | 'ok' | 'error';
export type Tab = 'reconcile' | 'validate';
