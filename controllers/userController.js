const { supabase } = require('../config/supabase');

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  
  // Validate date
  if (isNaN(birthDate.getTime())) {
    return null;
  }
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

const userController = {
  // Get all users
  getAll: async (req, res, next) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        error.status = 500;
        throw error;
      }

      res.json({
        message: 'Users retrieved successfully',
        count: data?.length || 0,
        data: data || []
      });
    } catch (error) {
      next(error);
    }
  },

  // Get user by ID
  getById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'User not found',
            message: `No user found with ID: ${id}`
          });
        }
        error.status = 500;
        throw error;
      }

      res.json({
        message: 'User retrieved successfully',
        data: data
      });
    } catch (error) {
      next(error);
    }
  },

  // Register new user
  register: async (req, res, next) => {
    try {
      const {
        full_name,
        date_of_birth,
        age,
        gender,
        civil_status,
        address,
        contact_number,
        email_address,
        emergency_contact_person_number
      } = req.body;

      // Validate required fields
      if (!full_name || !date_of_birth || !email_address) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'full_name, date_of_birth, and email_address are required',
          required_fields: ['full_name', 'date_of_birth', 'email_address']
        });
      }

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email_address')
        .eq('email_address', email_address)
        .single();

      if (existingUser) {
        return res.status(409).json({
          error: 'Registration Failed',
          message: 'A user with this email address already exists'
        });
      }

      // Calculate age from date of birth (override if age was provided)
      const calculatedAge = calculateAge(date_of_birth);

      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert({
          full_name,
          date_of_birth,
          age: calculatedAge, // Use calculated age
          gender,
          civil_status,
          address,
          contact_number,
          email_address,
          emergency_contact_person_number
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return res.status(409).json({
            error: 'Registration Failed',
            message: 'A user with this email address already exists'
          });
        }
        error.status = 500;
        throw error;
      }

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: data
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new user
  create: async (req, res, next) => {
    try {
      const {
        full_name,
        date_of_birth,
        age,
        gender,
        civil_status,
        address,
        contact_number,
        email_address,
        emergency_contact_person_number
      } = req.body;

      // Validate required fields
      if (!full_name || !date_of_birth || !email_address) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'full_name, date_of_birth, and email_address are required'
        });
      }

      // Calculate age from date of birth (override if age was provided)
      const calculatedAge = calculateAge(date_of_birth);

      const { data, error } = await supabase
        .from('users')
        .insert({
          full_name,
          date_of_birth,
          age: calculatedAge, // Use calculated age
          gender,
          civil_status,
          address,
          contact_number,
          email_address,
          emergency_contact_person_number
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return res.status(409).json({
            error: 'Duplicate Entry',
            message: 'A user with this email address already exists'
          });
        }
        error.status = 500;
        throw error;
      }

      res.status(201).json({
        message: 'User created successfully',
        data: data
      });
    } catch (error) {
      next(error);
    }
  },

  // Update user
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        full_name,
        date_of_birth,
        age,
        gender,
        civil_status,
        address,
        contact_number,
        email_address,
        emergency_contact_person_number
      } = req.body;

      const updateData = {};
      if (full_name !== undefined) updateData.full_name = full_name;
      if (date_of_birth !== undefined) {
        updateData.date_of_birth = date_of_birth;
        // Recalculate age when date_of_birth is updated
        updateData.age = calculateAge(date_of_birth);
      }
      // Note: age is now auto-calculated from date_of_birth, so we ignore manually provided age
      if (gender !== undefined) updateData.gender = gender;
      if (civil_status !== undefined) updateData.civil_status = civil_status;
      if (address !== undefined) updateData.address = address;
      if (contact_number !== undefined) updateData.contact_number = contact_number;
      if (email_address !== undefined) updateData.email_address = email_address;
      if (emergency_contact_person_number !== undefined) updateData.emergency_contact_person_number = emergency_contact_person_number;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'No fields to update'
        });
      }

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'User not found',
            message: `No user found with ID: ${id}`
          });
        }
        if (error.code === '23505') {
          return res.status(409).json({
            error: 'Duplicate Entry',
            message: 'A user with this email address already exists'
          });
        }
        error.status = 500;
        throw error;
      }

      res.json({
        message: 'User updated successfully',
        data: data
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete user
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        error.status = 500;
        throw error;
      }

      if (!data) {
        return res.status(404).json({
          error: 'User not found',
          message: `No user found with ID: ${id}`
        });
      }

      res.json({
        message: 'User deleted successfully',
        data: data
      });
    } catch (error) {
      next(error);
    }
  },

  // Get user by email
  getByEmail: async (req, res, next) => {
    try {
      const { email } = req.params;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email_address', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            error: 'User not found',
            message: `No user found with email: ${email}`
          });
        }
        error.status = 500;
        throw error;
      }

      res.json({
        message: 'User retrieved successfully',
        data: data
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;

