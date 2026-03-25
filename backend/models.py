from typing import Annotated, Literal, Union
from pydantic import BaseModel, Field, model_validator


# ---------------------------------------------------------------------------
# Shared / sub-models
# ---------------------------------------------------------------------------

class PatientContext(BaseModel):
    age: Annotated[int, Field(ge=0, le=130, description="Patient age in years")]
    conditions: list[str] = Field(
        default_factory=list,
        description="Active diagnoses or chronic conditions (e.g. 'Type 2 Diabetes')",
    )
    recent_labs: dict[str, str | float] = Field(
        default_factory=dict,
        description="Recent lab results as key-value pairs (e.g. {'HbA1c': 7.2, 'eGFR': 58})",
    )


class MedicationSource(BaseModel):
    system: Annotated[str, Field(description="Name of the source healthcare system (e.g. 'EHR-A', 'Pharmacy-B')")]
    medication: Annotated[str, Field(description="Medication name, dose, and frequency as recorded by this source")]
    last_updated: str | None = Field(default=None, description="ISO-8601 date/time the record was last updated")
    last_filled: str | None = Field(default=None, description="ISO-8601 date/time the prescription was last filled (pharmacy sources)")
    source_reliability: Annotated[
        Union[Literal["low", "medium", "high"], float],
        Field(description="Reliability of this source: 'low', 'medium', 'high', or a float from 0.0 (unreliable) to 1.0 (authoritative)"),
    ]

    @model_validator(mode="after")
    def require_some_date(self) -> "MedicationSource":
        if self.last_updated is None and self.last_filled is None:
            raise ValueError("Either 'last_updated' or 'last_filled' must be provided")
        return self


class ClinicalSafetyCheck(BaseModel):
    safe: Annotated[bool, Field(description="True if no critical safety concerns were detected")]
    warnings: list[str] = Field(
        default_factory=list,
        description="List of clinical safety warnings (e.g. drug interactions, contraindications)",
    )


# ---------------------------------------------------------------------------
# Medication Reconciliation — request / response
# ---------------------------------------------------------------------------

class MedicationReconciliationRequest(BaseModel):
    patient_context: PatientContext
    sources: Annotated[
        list[MedicationSource],
        Field(min_length=2, description="Two or more conflicting medication records to reconcile"),
    ]


class MedicationReconciliationResponse(BaseModel):
    reconciled_medication: Annotated[
        str,
        Field(description="The most clinically plausible medication entry derived from all sources"),
    ]
    confidence_score: Annotated[
        float,
        Field(ge=0.0, le=1.0, description="Model confidence in the reconciled result, from 0.0 to 1.0"),
    ]
    reasoning: Annotated[str, Field(description="Step-by-step clinical rationale for the reconciled decision")]
    recommended_actions: list[str] = Field(
        description="Suggested follow-up actions for the care team (e.g. 'Verify dose with prescriber')"
    )
    clinical_safety_check: ClinicalSafetyCheck


# ---------------------------------------------------------------------------
# Data Quality Validation — request / response
# ---------------------------------------------------------------------------

class DemographicsRecord(BaseModel):
    name: str | None = None
    date_of_birth: str | None = Field(default=None, description="ISO-8601 date string (YYYY-MM-DD)")
    gender: str | None = None
    address: str | None = None
    phone: str | None = None
    insurance_id: str | None = None


class MedicationRecord(BaseModel):
    name: Annotated[str, Field(description="Medication name")]
    dose: str | None = None
    frequency: str | None = None
    prescriber: str | None = None
    start_date: str | None = Field(default=None, description="ISO-8601 date the medication was started")


class AllergyRecord(BaseModel):
    allergen: Annotated[str, Field(description="Substance the patient is allergic to")]
    reaction: str | None = None
    severity: str | None = Field(default=None, description="e.g. 'mild', 'moderate', 'severe', 'life-threatening'")


class ConditionRecord(BaseModel):
    name: Annotated[str, Field(description="Diagnosis name or ICD code description")]
    onset_date: str | None = Field(default=None, description="ISO-8601 date of diagnosis")
    status: str | None = Field(default=None, description="e.g. 'active', 'resolved', 'chronic'")


class VitalSigns(BaseModel):
    blood_pressure: str | None = Field(default=None, description="e.g. '120/80 mmHg'")
    heart_rate: int | float | None = Field(default=None, description="Beats per minute")
    temperature: int | float | None = Field(default=None, description="Body temperature in Celsius")
    respiratory_rate: int | float | None = Field(default=None, description="Breaths per minute")
    oxygen_saturation: int | float | None = Field(default=None, description="SpO2 percentage (0–100)")
    weight_kg: int | float | None = Field(default=None, description="Body weight in kilograms")
    height_cm: int | float | None = Field(default=None, description="Height in centimetres")


class DataQualityRequest(BaseModel):
    demographics: DemographicsRecord
    medications: list[MedicationRecord] = Field(default_factory=list)
    allergies: list[AllergyRecord] = Field(default_factory=list)
    conditions: list[ConditionRecord] = Field(default_factory=list)
    vital_signs: VitalSigns
    last_updated: Annotated[str, Field(description="ISO-8601 date/time the overall record was last updated")]


class QualityDimensionBreakdown(BaseModel):
    completeness: Annotated[
        float,
        Field(ge=0.0, le=100.0, description="Percentage of expected fields that are populated"),
    ]
    accuracy: Annotated[
        float,
        Field(ge=0.0, le=100.0, description="Score reflecting internal consistency and format validity"),
    ]
    timeliness: Annotated[
        float,
        Field(ge=0.0, le=100.0, description="Score reflecting how recently the record was updated"),
    ]
    clinical_plausibility: Annotated[
        float,
        Field(ge=0.0, le=100.0, description="Score reflecting whether values fall within clinically expected ranges"),
    ]


class DetectedIssue(BaseModel):
    field: Annotated[str, Field(description="The record field where the issue was detected")]
    issue: Annotated[str, Field(description="Human-readable description of the data quality problem")]
    severity: Annotated[
        str,
        Field(description="Issue severity: 'low', 'medium', or 'high'"),
    ]


class DataQualityResponse(BaseModel):
    overall_score: Annotated[
        float,
        Field(ge=0.0, le=100.0, description="Weighted composite data quality score from 0 (unusable) to 100 (perfect)"),
    ]
    breakdown: QualityDimensionBreakdown
    issues_detected: list[DetectedIssue] = Field(
        default_factory=list,
        description="Specific data quality problems found during validation",
    )
