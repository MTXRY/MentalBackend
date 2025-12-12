const { supabase } = require('../config/supabase');

const consultationFeeController = {
  // Get all consultation fees for a doctor
  getDoctorFees: async (req, res, next) => {
    try {
      const { doctorId } = req.params;
      const { appointment_type, include_inactive } = req.query;

      let query = supabase
        .from('consultation_fees')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('effective_from', { ascending: false });

      if (appointment_type) {
        query = query.eq('appointment_type', appointment_type);
      }

      if (include_inactive !== 'true') {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      res.json({
        success: true,
        message: 'Consultation fees retrieved successfully',
        count: data?.length || 0,
        data: data || []
      });
    } catch (error) {
      next(error);
    }
  },

  // Get current active fee for a doctor and appointment type
  getCurrentFee: async (req, res, next) => {
    try {
      const { doctorId } = req.params;
      const { appointment_type = 'Video Call' } = req.query;

      const { data, error } = await supabase
        .rpc('get_current_consultation_fee', {
          p_doctor_id: doctorId,
          p_appointment_type: appointment_type
        });

      if (error) throw error;

      if (!data || data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No active fee found',
          message: `No active consultation fee found for doctor ${doctorId} and appointment type ${appointment_type}`
        });
      }

      res.json({
        success: true,
        message: 'Current consultation fee retrieved successfully',
        data: data[0]
      });
    } catch (error) {
      next(error);
    }
  },

  // Create a new consultation fee
  createFee: async (req, res, next) => {
    try {
      const { doctorId } = req.params;
      const {
        appointment_type = 'Video Call',
        fee_amount,
        currency = 'PHP',
        duration_minutes = 60,
        effective_from,
        effective_until,
        description,
        notes
      } = req.body;

      // Validation
      if (!fee_amount || fee_amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'fee_amount is required and must be greater than 0'
        });
      }

      // Check if doctor exists
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('id', doctorId)
        .single();

      if (doctorError || !doctor) {
        return res.status(404).json({
          success: false,
          error: 'Doctor not found',
          message: `Doctor with ID ${doctorId} not found`
        });
      }

      const insertData = {
        doctor_id: doctorId,
        appointment_type,
        fee_amount: parseFloat(fee_amount),
        currency,
        duration_minutes: parseInt(duration_minutes) || 60,
        is_active: true,
        effective_from: effective_from || new Date().toISOString().split('T')[0],
        effective_until: effective_until || null,
        description: description || null,
        notes: notes || null
      };

      const { data, error } = await supabase
        .from('consultation_fees')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Consultation fee created successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Update a consultation fee
  updateFee: async (req, res, next) => {
    try {
      const { feeId } = req.params;
      const {
        fee_amount,
        currency,
        duration_minutes,
        is_active,
        effective_from,
        effective_until,
        description,
        notes
      } = req.body;

      const updateData = {};

      if (fee_amount !== undefined) {
        if (fee_amount <= 0) {
          return res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: 'fee_amount must be greater than 0'
          });
        }
        updateData.fee_amount = parseFloat(fee_amount);
      }

      if (currency !== undefined) updateData.currency = currency;
      if (duration_minutes !== undefined) updateData.duration_minutes = parseInt(duration_minutes);
      if (is_active !== undefined) updateData.is_active = is_active;
      if (effective_from !== undefined) updateData.effective_from = effective_from;
      if (effective_until !== undefined) updateData.effective_until = effective_until;
      if (description !== undefined) updateData.description = description;
      if (notes !== undefined) updateData.notes = notes;

      const { data, error } = await supabase
        .from('consultation_fees')
        .update(updateData)
        .eq('id', feeId)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Fee not found',
          message: `Consultation fee with ID ${feeId} not found`
        });
      }

      res.json({
        success: true,
        message: 'Consultation fee updated successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete a consultation fee (soft delete by setting is_active to false)
  deleteFee: async (req, res, next) => {
    try {
      const { feeId } = req.params;

      const { data, error } = await supabase
        .from('consultation_fees')
        .update({ is_active: false })
        .eq('id', feeId)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({
          success: false,
          error: 'Fee not found',
          message: `Consultation fee with ID ${feeId} not found`
        });
      }

      res.json({
        success: true,
        message: 'Consultation fee deactivated successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all current active fees (using the view)
  getAllCurrentFees: async (req, res, next) => {
    try {
      const { doctor_id, appointment_type } = req.query;

      let query = supabase
        .from('current_consultation_fees')
        .select('*')
        .order('doctor_name', { ascending: true });

      if (doctor_id) {
        query = query.eq('doctor_id', doctor_id);
      }

      if (appointment_type) {
        query = query.eq('appointment_type', appointment_type);
      }

      const { data, error } = await query;

      if (error) throw error;

      res.json({
        success: true,
        message: 'Current consultation fees retrieved successfully',
        count: data?.length || 0,
        data: data || []
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = consultationFeeController;

