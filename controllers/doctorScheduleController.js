const { supabase } = require('../config/supabase');

const doctorScheduleController = {
  // Get all schedules
  getAll: async (req, res, next) => {
    try {
      const { doctor_id, day_of_week, is_available } = req.query;

      let query = supabase
        .from('doctor_schedules')
        .select('*')
        .order('doctor_id', { ascending: true })
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (doctor_id) query = query.eq('doctor_id', doctor_id);
      if (day_of_week !== undefined) query = query.eq('day_of_week', parseInt(day_of_week));
      if (is_available !== undefined) query = query.eq('is_available', is_available === 'true');

      const { data, error } = await query;

      if (error) throw error;

      res.json({
        success: true,
        message: 'Doctor schedules retrieved successfully',
        count: data?.length || 0,
        data: data || []
      });
    } catch (error) {
      next(error);
    }
  },

  // Get schedule by ID
  getById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          error: 'Schedule not found',
          message: `No schedule found with ID: ${id}`
        });
      }

      res.json({
        success: true,
        message: 'Schedule retrieved successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Get schedules for a specific doctor
  getByDoctorId: async (req, res, next) => {
    try {
      const { doctorId } = req.params;
      const { is_available } = req.query;

      let query = supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctorId)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (is_available !== undefined) {
        query = query.eq('is_available', is_available === 'true');
      }

      const { data, error } = await query;

      if (error) throw error;

      res.json({
        success: true,
        message: 'Doctor schedules retrieved successfully',
        count: data?.length || 0,
        data: data || []
      });
    } catch (error) {
      next(error);
    }
  },

  // Create schedule
  create: async (req, res, next) => {
    try {
      const {
        doctor_id,
        day_of_week,
        start_time,
        end_time,
        is_available = true
      } = req.body;

      // Validation
      if (!doctor_id || day_of_week === undefined || !start_time || !end_time) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Required fields: doctor_id, day_of_week, start_time, end_time'
        });
      }

      // Validate day_of_week (0-6)
      const day = parseInt(day_of_week);
      if (day < 0 || day > 6) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'day_of_week must be between 0 (Sunday) and 6 (Saturday)'
        });
      }

      // Validate time range
      if (end_time <= start_time) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'end_time must be greater than start_time'
        });
      }

      // Check if doctor exists
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('id', doctor_id)
        .single();

      if (doctorError || !doctor) {
        return res.status(404).json({
          success: false,
          error: 'Doctor not found',
          message: `Doctor with ID ${doctor_id} not found`
        });
      }

      const { data, error } = await supabase
        .from('doctor_schedules')
        .insert({
          doctor_id,
          day_of_week: day,
          start_time,
          end_time,
          is_available
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Schedule created successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Update schedule
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        day_of_week,
        start_time,
        end_time,
        is_available
      } = req.body;

      // Check if schedule exists
      const { data: existingSchedule, error: fetchError } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existingSchedule) {
        return res.status(404).json({
          success: false,
          error: 'Schedule not found',
          message: `Schedule with ID ${id} not found`
        });
      }

      const updateData = {};

      if (day_of_week !== undefined) {
        const day = parseInt(day_of_week);
        if (day < 0 || day > 6) {
          return res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: 'day_of_week must be between 0 (Sunday) and 6 (Saturday)'
          });
        }
        updateData.day_of_week = day;
      }

      if (start_time !== undefined) updateData.start_time = start_time;
      if (end_time !== undefined) updateData.end_time = end_time;
      if (is_available !== undefined) updateData.is_available = is_available;

      // Validate time range if both times are being updated
      if (updateData.start_time && updateData.end_time) {
        if (updateData.end_time <= updateData.start_time) {
          return res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: 'end_time must be greater than start_time'
          });
        }
      } else if (updateData.start_time && existingSchedule.end_time) {
        if (existingSchedule.end_time <= updateData.start_time) {
          return res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: 'end_time must be greater than start_time'
          });
        }
      } else if (updateData.end_time && existingSchedule.start_time) {
        if (updateData.end_time <= existingSchedule.start_time) {
          return res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: 'end_time must be greater than start_time'
          });
        }
      }

      const { data, error } = await supabase
        .from('doctor_schedules')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        message: 'Schedule updated successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete schedule
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('doctor_schedules')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Schedule not found',
            message: `Schedule with ID ${id} not found`
          });
        }
        throw error;
      }

      res.json({
        success: true,
        message: 'Schedule deleted successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = doctorScheduleController;

