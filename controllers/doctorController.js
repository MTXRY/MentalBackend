const { supabase } = require('../config/supabase');
const bcrypt = require('bcrypt');
const { generateToken } = require('../middleware/auth');

const doctorController = {
  // Get all doctors
  getAll: async (req, res, next) => {
    try {
      const { specialization, is_active, is_verified } = req.query;

      let query = supabase
        .from('doctors')
        .select('*')
        .order('created_at', { ascending: false });

      if (specialization) query = query.ilike('specialization', `%${specialization}%`);
      if (is_active !== undefined) query = query.eq('is_active', is_active === 'true');
      if (is_verified !== undefined) query = query.eq('is_verified', is_verified === 'true');

      const { data, error } = await query;

      if (error) throw error;

      const doctors = (data || []).map(({ password_hash, ...doctor }) => doctor);

      res.json({ message: 'Doctors retrieved successfully', count: doctors.length, data: doctors });
    } catch (error) {
      next(error);
    }
  },

  // Get available doctors
  getAvailable: async (req, res, next) => {
    try {
      const { specialization } = req.query;

      let query = supabase
        .from('doctors')
        .select('*')
        .eq('is_active', true)
        .eq('is_verified', true)
        .order('full_name', { ascending: true });

      if (specialization) query = query.ilike('specialization', `%${specialization}%`);

      const { data, error } = await query;

      if (error) throw error;

      const doctors = (data || []).map(({ password_hash, ...doctor }) => doctor);

      res.json({ message: 'Available doctors retrieved successfully', count: doctors.length, data: doctors });
    } catch (error) {
      next(error);
    }
  },

  // Get doctor by ID
  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase.from('doctors').select('*').eq('id', id).single();

      if (error) return res.status(404).json({ error: 'Doctor not found', message: `No doctor found with ID: ${id}` });

      const { password_hash, ...doctor } = data;
      res.json({ message: 'Doctor retrieved successfully', data: doctor });
    } catch (error) {
      next(error);
    }
  },

  // Register doctor
  register: async (req, res, next) => {
    try {
      const {
        full_name, email_address, password, phone_number,
        specialization, license_number, qualifications,
        bio, years_of_experience, consultation_fee, profile_image_url
      } = req.body;

      if (!full_name || !email_address || !password || !specialization || !license_number) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Required: full_name, email_address, password, specialization, license_number'
        });
      }

      if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

      const { data: existingDoctor } = await supabase.from('doctors').select('email_address').eq('email_address', email_address).single();
      if (existingDoctor) return res.status(409).json({ error: 'A doctor with this email already exists' });

      const { data: existingLicense } = await supabase.from('doctors').select('license_number').eq('license_number', license_number).single();
      if (existingLicense) return res.status(409).json({ error: 'A doctor with this license number already exists' });

      const password_hash = await bcrypt.hash(password, 10);

      const { data, error } = await supabase.from('doctors').insert({
        full_name, email_address, password_hash, phone_number,
        specialization, license_number, qualifications, bio,
        years_of_experience, consultation_fee, profile_image_url,
        is_active: true, is_verified: false
      }).select().single();

      if (error) throw error;

      const { password_hash: _, ...doctorData } = data;
      res.status(201).json({ success: true, message: 'Doctor registered successfully', data: doctorData });
    } catch (error) {
      next(error);
    }
  },

  // Doctor login
  login: async (req, res, next) => {
    try {
      const { email_address, password } = req.body;
      if (!email_address || !password) return res.status(400).json({ error: 'Email and password required' });

      const { data: doctor, error } = await supabase.from('doctors').select('*').eq('email_address', email_address).single();
      if (error || !doctor) return res.status(401).json({ error: 'Invalid email or password' });

      const isPasswordValid = await bcrypt.compare(password, doctor.password_hash || '');
      if (!isPasswordValid) return res.status(401).json({ error: 'Invalid email or password' });
      if (!doctor.is_active) return res.status(403).json({ error: 'Account inactive' });

      const { password_hash: _, ...doctorData } = doctor;
      const token = generateToken(doctor);
      res.json({ success: true, message: 'Login successful', token, data: doctorData });
    } catch (error) {
      next(error);
    }
  },

  // Update doctor
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };

      if (Object.keys(updateData).length === 0) return res.status(400).json({ error: 'No fields to update' });

      const { data, error } = await supabase.from('doctors').update(updateData).eq('id', id).select().single();
      if (error) return res.status(404).json({ error: 'Doctor not found' });

      const { password_hash, ...doctor } = data;
      res.json({ message: 'Doctor updated successfully', data: doctor });
    } catch (error) {
      next(error);
    }
  },

  // Delete doctor
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase.from('doctors').delete().eq('id', id).select().single();
      if (error) return res.status(500).json({ error: 'Failed to delete doctor' });
      res.json({ message: 'Doctor deleted successfully', data });
    } catch (error) {
      next(error);
    }
  },

  // Book appointment
  bookAppointment: async (req, res) => {
    try {
      const { userId, doctorName, consultationType, date, time } = req.body;
      if (!userId || !doctorName || !consultationType || !date || !time) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const { data: doctor, error: doctorError } = await supabase.from('doctors').select('id, full_name').eq('full_name', doctorName).single();
      if (doctorError || !doctor) return res.status(404).json({ message: "Doctor not found" });

      const { data, error } = await supabase.rpc("book_appointment", {
        p_user_id: userId,
        p_doctor_name: doctor.full_name,
        p_consultation_type: consultationType,
        p_appointment_date: date,
        p_appointment_time: time,
      });

      if (error) return res.status(500).json({ message: "Failed to book appointment", error });

      res.status(201).json({ message: "Appointment booked successfully", appointment: data });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

module.exports = doctorController;
