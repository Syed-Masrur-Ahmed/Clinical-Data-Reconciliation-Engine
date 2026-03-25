import { ReconcileRequest, ValidateRequest } from './types';

export const RECONCILE_SAMPLE: ReconcileRequest = {
  patient_context: {
    age: 68,
    conditions: ['Type 2 Diabetes', 'Hypertension', 'CKD Stage 3'],
    recent_labs: { HbA1c: 7.2, eGFR: 58, Creatinine: 1.4 },
  },
  sources: [
    {
      system: 'EHR-A',
      medication: 'Metformin 1000mg twice daily',
      last_updated: '2026-03-20T10:30:00Z',
      source_reliability: 0.9,
    },
    {
      system: 'Pharmacy-B',
      medication: 'Metformin 500mg once daily',
      last_updated: '2026-03-15T14:00:00Z',
      source_reliability: 0.75,
    },
    {
      system: 'Patient-Reported',
      medication: 'Metformin 500mg twice daily',
      last_updated: '2026-03-22T09:00:00Z',
      source_reliability: 0.5,
    },
  ],
};

export const VALIDATE_SAMPLE: ValidateRequest = {
  demographics: {
    name: 'John Smith',
    date_of_birth: '1658-04-12',
    gender: 'male',
    address: '123 Main St, Springfield, IL 62701',
    phone: '555-867-5309',
    insurance_id: 'INS-987654321',
  },
  medications: [
    { name: 'Metformin', dose: '', frequency: 'twice daily', prescriber: 'Dr. Jane Doe', start_date: '2022-01-15' },
    { name: 'Lisinopril', dose: '10mg', frequency: 'once daily', prescriber: 'Dr. Jane Doe', start_date: '2020-06-01' },
  ],
  allergies: [{ allergen: 'Penicillin', reaction: 'Rash', severity: 'moderate' }],
  conditions: [
    { name: 'Type 2 Diabetes Mellitus', onset_date: '2022-01-10', status: 'active' },
    { name: 'Essential Hypertension', onset_date: '2020-05-20', status: 'chronic' },
  ],
  vital_signs: {
    blood_pressure: '138/88 mmHg',
    heart_rate: 72,
    temperature: 36.8,
    respiratory_rate: 16,
    oxygen_saturation: 98,
    weight_kg: 85.5,
    height_cm: 175,
  },
  last_updated: '2026-03-20T08:00:00Z',
};
