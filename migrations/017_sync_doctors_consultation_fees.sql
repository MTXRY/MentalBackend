-- ============================================
-- Sync existing doctors.consultation_fee to consultation_fees table
-- ============================================
-- This migration syncs existing consultation_fee values from doctors table
-- to the new consultation_fees table

-- Insert default consultation fees for all doctors that have a consultation_fee set
INSERT INTO consultation_fees (
  doctor_id,
  appointment_type,
  fee_amount,
  currency,
  duration_minutes,
  is_active,
  effective_from,
  description
)
SELECT 
  id AS doctor_id,
  'Video Call' AS appointment_type,
  consultation_fee AS fee_amount,
  'PHP' AS currency,
  60 AS duration_minutes,
  true AS is_active,
  CURRENT_DATE AS effective_from,
  'Default consultation fee' AS description
FROM doctors
WHERE consultation_fee IS NOT NULL
  AND consultation_fee > 0
  AND NOT EXISTS (
    SELECT 1 
    FROM consultation_fees cf 
    WHERE cf.doctor_id = doctors.id 
      AND cf.appointment_type = 'Video Call'
      AND cf.is_active = true
  );

-- Add comment
COMMENT ON COLUMN doctors.consultation_fee IS 'Legacy field - use consultation_fees table for current fees. This field is kept for backward compatibility.';

