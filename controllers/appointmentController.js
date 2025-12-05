const { supabase } = require('../config/supabase');

const appointmentController = {
  // Get all appointments for a user
  getByUserId: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { status, upcoming } = req.query;

      let query = supabase
        .from('appointments')
        .select(`
          *,
          doctor:doctors(id, full_name, specialization, profile_image_url, is_verified),
          user:users(id, full_name, email_address)
        `)
        .eq('user_id', userId)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      // Apply status filter
      if (status) {
        query = query.eq('status', status);
      }

      // Filter for upcoming appointments
      if (upcoming === 'true') {
        const today = new Date().toISOString().split('T')[0];
        query = query.gte('appointment_date', today);
      }

      const { data, error } = await query;

      if (error) {
        error.status = 500;
        throw error;
      }

      res.json({
        message: 'Appointments retrieved successfully',
        count: data?.length || 0,
        data: data || []
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all appointments for a doctor
  getByDoctorId: async (req, res, next) => {
    try {
      const { doctorId } = req.params;
      const { status, upcoming } = req.query;

      let query = supabase
        .from('appointments')
        .select(`
          *,
          doctor:doctors(id, full_name, specialization, profile_image_url, is_verified),
          user:users(id, full_name, email_address)
        `)
        .eq('doctor_id', doctorId)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      // Apply status filter
      if (status) {
        query = query.eq('status', status);
      }

      // Filter for upcoming appointments
      if (upcoming === 'true') {
        const today = new Date().toISOString().split('T')[0];
        query = query.gte('appointment_date', today);
      }

      const { data, error } = await query;

      if (error) {
        error.status = 500;
        throw error;
      }

      res.json({
        message: 'Appointments retrieved successfully',
        count: data?.length || 0,
        data: data || []
      });
    } catch (error) {
      next(error);
    }
  },

  // Get appointment by ID
  getById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctor:doctors(id, full_name, specialization, bio, profile_image_url, is_verified, consultation_fee),
          user:users(id, full_name, email_address, contact_number)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Appointment not found',
            message: `No appointment found with ID: ${id}`
          });
        }
        error.status = 500;
        throw error;
      }

      res.json({
        message: 'Appointment retrieved successfully',
        data: data
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new appointment
  create: async (req, res, next) => {
    try {
      const {
        user_id,
        doctor_id,
        appointment_date,
        appointment_time,
        duration_minutes,
        appointment_type,
        status,
        notes,
        meeting_room_id
      } = req.body;

      // Validate required fields
      if (!user_id || !doctor_id || !appointment_date || !appointment_time) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'user_id, doctor_id, appointment_date, and appointment_time are required',
          required_fields: ['user_id', 'doctor_id', 'appointment_date', 'appointment_time']
        });
      }

      // Generate meeting room ID if not provided (for video calls)
      const roomId = meeting_room_id || `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create new appointment
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          user_id,
          doctor_id,
          appointment_date,
          appointment_time,
          duration_minutes: duration_minutes || 60,
          appointment_type: appointment_type || 'Video Call',
          status: status || 'scheduled',
          notes,
          meeting_room_id: roomId,
          session_link: appointment_type === 'Video Call' ? `/appointments/video-call?id=${roomId}` : null
        })
        .select(`
          *,
          doctor:doctors(id, full_name, specialization, profile_image_url),
          user:users(id, full_name, email_address)
        `)
        .single();

      if (error) {
        if (error.code === '23505') {
          return res.status(409).json({
            error: 'Appointment Conflict',
            message: 'This time slot is already booked for this doctor'
          });
        }
        error.status = 500;
        throw error;
      }

      res.status(201).json({
        success: true,
        message: 'Appointment created successfully',
        data: data
      });
    } catch (error) {
      next(error);
    }
  },

  // Update appointment
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        appointment_date,
        appointment_time,
        duration_minutes,
        appointment_type,
        status,
        notes,
        session_link,
        meeting_room_id
      } = req.body;

      const updateData = {};
      if (appointment_date !== undefined) updateData.appointment_date = appointment_date;
      if (appointment_time !== undefined) updateData.appointment_time = appointment_time;
      if (duration_minutes !== undefined) updateData.duration_minutes = duration_minutes;
      if (appointment_type !== undefined) updateData.appointment_type = appointment_type;
      if (status !== undefined) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;
      if (session_link !== undefined) updateData.session_link = session_link;
      if (meeting_room_id !== undefined) updateData.meeting_room_id = meeting_room_id;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'No fields to update'
        });
      }

      const { data, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          doctor:doctors(id, full_name, specialization, profile_image_url),
          user:users(id, full_name, email_address)
        `)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'Appointment not found',
            message: `No appointment found with ID: ${id}`
          });
        }
        error.status = 500;
        throw error;
      }

      res.json({
        message: 'Appointment updated successfully',
        data: data
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete/Cancel appointment
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      // Instead of deleting, update status to cancelled
      const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        error.status = 500;
        throw error;
      }

      if (!data) {
        return res.status(404).json({
          error: 'Appointment not found',
          message: `No appointment found with ID: ${id}`
        });
      }

      res.json({
        message: 'Appointment cancelled successfully',
        data: data
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = appointmentController;

