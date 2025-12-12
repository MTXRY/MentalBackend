-- ============================================
-- Create Consultation Fees Table
-- ============================================
-- This table manages consultation fees for doctors
-- Supports different fees for different appointment types
-- Tracks fee history and changes over time

CREATE TABLE IF NOT EXISTS consultation_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_type VARCHAR(50) NOT NULL DEFAULT 'Video Call', -- 'Video Call', 'In-Person', 'Phone Call'
  fee_amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'PHP',
  duration_minutes INTEGER DEFAULT 60, -- Consultation duration in minutes
  is_active BOOLEAN DEFAULT true, -- Whether this fee is currently active
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE, -- When this fee becomes effective
  effective_until DATE, -- When this fee expires (NULL means no expiration)
  description TEXT, -- Optional description of the fee/service
  notes TEXT, -- Additional notes about the fee
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id), -- Who created/updated this fee (admin)
  
  -- Ensure positive fee amount
  CONSTRAINT positive_fee_amount CHECK (fee_amount > 0),
  
  -- Ensure valid date range
  CONSTRAINT valid_effective_dates CHECK (
    effective_until IS NULL OR effective_until >= effective_from
  ),
  
  -- Note: Unique constraint for active fees is enforced via trigger
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_consultation_fees_doctor_id ON consultation_fees(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultation_fees_appointment_type ON consultation_fees(appointment_type);
CREATE INDEX IF NOT EXISTS idx_consultation_fees_is_active ON consultation_fees(is_active);
CREATE INDEX IF NOT EXISTS idx_consultation_fees_effective_dates ON consultation_fees(effective_from, effective_until);
CREATE INDEX IF NOT EXISTS idx_consultation_fees_doctor_type_active ON consultation_fees(doctor_id, appointment_type, is_active);

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_consultation_fees_updated_at ON consultation_fees;
CREATE TRIGGER update_consultation_fees_updated_at BEFORE UPDATE ON consultation_fees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE consultation_fees IS 'Consultation fees for doctors by appointment type with history tracking';
COMMENT ON COLUMN consultation_fees.doctor_id IS 'Reference to the doctor';
COMMENT ON COLUMN consultation_fees.appointment_type IS 'Type of appointment: Video Call, In-Person, Phone Call';
COMMENT ON COLUMN consultation_fees.fee_amount IS 'Fee amount in the specified currency';
COMMENT ON COLUMN consultation_fees.currency IS 'Currency code (default: PHP)';
COMMENT ON COLUMN consultation_fees.duration_minutes IS 'Consultation duration in minutes';
COMMENT ON COLUMN consultation_fees.is_active IS 'Whether this fee is currently active';
COMMENT ON COLUMN consultation_fees.effective_from IS 'Date when this fee becomes effective';
COMMENT ON COLUMN consultation_fees.effective_until IS 'Date when this fee expires (NULL = no expiration)';
COMMENT ON COLUMN consultation_fees.description IS 'Description of the consultation service';
COMMENT ON COLUMN consultation_fees.created_by IS 'User (admin) who created or updated this fee';

-- ============================================
-- Create function to get current active fee for a doctor and appointment type
-- ============================================
CREATE OR REPLACE FUNCTION get_current_consultation_fee(
  p_doctor_id UUID,
  p_appointment_type VARCHAR(50) DEFAULT 'Video Call'
)
RETURNS TABLE (
  id UUID,
  doctor_id UUID,
  appointment_type VARCHAR(50),
  fee_amount DECIMAL(10, 2),
  currency VARCHAR(3),
  duration_minutes INTEGER,
  effective_from DATE,
  effective_until DATE,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cf.id,
    cf.doctor_id,
    cf.appointment_type,
    cf.fee_amount,
    cf.currency,
    cf.duration_minutes,
    cf.effective_from,
    cf.effective_until,
    cf.description
  FROM consultation_fees cf
  WHERE cf.doctor_id = p_doctor_id
    AND cf.appointment_type = p_appointment_type
    AND cf.is_active = true
    AND cf.effective_from <= CURRENT_DATE
    AND (cf.effective_until IS NULL OR cf.effective_until >= CURRENT_DATE)
  ORDER BY cf.effective_from DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Add comment to function
COMMENT ON FUNCTION get_current_consultation_fee IS 'Get the current active consultation fee for a doctor and appointment type';

-- ============================================
-- Create function to deactivate old fees when a new one is created
-- ============================================
CREATE OR REPLACE FUNCTION deactivate_old_consultation_fees()
RETURNS TRIGGER AS $$
BEGIN
  -- If the new fee is active, deactivate other active fees for the same doctor and appointment type
  IF NEW.is_active = true THEN
    UPDATE consultation_fees
    SET is_active = false,
        effective_until = NEW.effective_from - INTERVAL '1 day'
    WHERE doctor_id = NEW.doctor_id
      AND appointment_type = NEW.appointment_type
      AND is_active = true
      AND id != NEW.id
      AND (effective_until IS NULL OR effective_until >= NEW.effective_from);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically deactivate old fees
DROP TRIGGER IF EXISTS trigger_deactivate_old_fees ON consultation_fees;
CREATE TRIGGER trigger_deactivate_old_fees
  AFTER INSERT OR UPDATE OF is_active, effective_from ON consultation_fees
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION deactivate_old_consultation_fees();

-- ============================================
-- Create view for current active fees
-- ============================================
CREATE OR REPLACE VIEW current_consultation_fees AS
SELECT 
  cf.id,
  cf.doctor_id,
  d.full_name AS doctor_name,
  d.specialization,
  cf.appointment_type,
  cf.fee_amount,
  cf.currency,
  cf.duration_minutes,
  cf.description,
  cf.effective_from,
  cf.effective_until,
  cf.created_at,
  cf.updated_at
FROM consultation_fees cf
INNER JOIN doctors d ON cf.doctor_id = d.id
WHERE cf.is_active = true
  AND cf.effective_from <= CURRENT_DATE
  AND (cf.effective_until IS NULL OR cf.effective_until >= CURRENT_DATE);

COMMENT ON VIEW current_consultation_fees IS 'View showing all currently active consultation fees with doctor information';

