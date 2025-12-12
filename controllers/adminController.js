const { supabase } = require('../config/supabase');
const bcrypt = require('bcrypt');

const adminController = {
  // ============================================
  // DASHBOARD & STATISTICS
  // ============================================

  // Get dashboard statistics
  getDashboardStats: async (req, res, next) => {
    try {
      // Get total counts
      const [usersResult, doctorsResult, appointmentsResult, paymentsResult] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('doctors').select('*', { count: 'exact', head: true }),
        supabase.from('appointments').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('*', { count: 'exact', head: true })
      ]);

      // Get active users and doctors
      const [activeUsersResult, activeDoctorsResult, verifiedDoctorsResult] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('doctors').select('*', { count: 'exact', head: true }).eq('is_verified', true)
      ]);

      // Get recent appointments (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recentAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      // Get total revenue (completed payments)
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('payment_status', 'completed');

      const totalRevenue = payments?.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0) || 0;

      res.json({
        success: true,
        message: 'Dashboard statistics retrieved successfully',
        data: {
          totals: {
            users: usersResult.count || 0,
            doctors: doctorsResult.count || 0,
            appointments: appointmentsResult.count || 0,
            payments: paymentsResult.count || 0
          },
          active: {
            users: activeUsersResult.count || 0,
            doctors: activeDoctorsResult.count || 0,
            verifiedDoctors: verifiedDoctorsResult.count || 0
          },
          recent: {
            appointmentsLast7Days: recentAppointments || 0
          },
          revenue: {
            total: totalRevenue,
            currency: 'PHP'
          }
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // ============================================
  // USER MANAGEMENT
  // ============================================

  // Get all users (with filters)
  getAllUsers: async (req, res, next) => {
    try {
      const { 
        search, 
        role, 
        is_active, 
        page = 1, 
        limit = 50,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = req.query;

      let query = supabase
        .from('users')
        .select('*', { count: 'exact' });

      // Search filter
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email_address.ilike.%${search}%,contact_number.ilike.%${search}%`);
      }

      // Role filter
      if (role) {
        query = query.eq('role', role);
      }

      // Active status filter
      if (is_active !== undefined) {
        query = query.eq('is_active', is_active === 'true');
      }

      // Sorting
      query = query.order(sort_by, { ascending: sort_order === 'asc' });

      // Pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const from = (pageNum - 1) * limitNum;
      const to = from + limitNum - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Remove password_hash from response
      const users = (data || []).map(({ password_hash, ...user }) => user);

      res.json({
        success: true,
        message: 'Users retrieved successfully',
        count: users.length,
        total: count || 0,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil((count || 0) / limitNum),
        data: users
      });
    } catch (error) {
      next(error);
    }
  },

  // Get user by ID
  getUserById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          message: `No user found with ID: ${id}`
        });
      }

      const { password_hash, ...user } = data;

      res.json({
        success: true,
        message: 'User retrieved successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  // Create user (Admin)
  createUser: async (req, res, next) => {
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
        emergency_contact_person_number,
        password,
        role = 'user',
        is_active = true
      } = req.body;

      // Validation
      if (!full_name || !date_of_birth || !email_address) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Required fields: full_name, date_of_birth, email_address'
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
          success: false,
          error: 'Email already exists',
          message: 'A user with this email already exists'
        });
      }

      const insertData = {
        full_name,
        date_of_birth,
        age: age || null,
        gender: gender || null,
        civil_status: civil_status || null,
        address: address || null,
        contact_number: contact_number || null,
        email_address,
        emergency_contact_person_number: emergency_contact_person_number || null,
        role,
        is_active
      };

      // Hash password if provided
      if (password) {
        if (password.length < 8) {
          return res.status(400).json({
            success: false,
            error: 'Password too short',
            message: 'Password must be at least 8 characters'
          });
        }
        insertData.password_hash = await bcrypt.hash(password, 10);
      }

      const { data, error } = await supabase
        .from('users')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const { password_hash, ...userData } = data;

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: userData
      });
    } catch (error) {
      next(error);
    }
  },

  // Update user (Admin)
  updateUser: async (req, res, next) => {
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
        emergency_contact_person_number,
        password,
        role,
        is_active
      } = req.body;

      // Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existingUser) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          message: `User with ID ${id} not found`
        });
      }

      // Check email uniqueness if email is being changed
      if (email_address && email_address !== existingUser.email_address) {
        const { data: emailExists } = await supabase
          .from('users')
          .select('id')
          .eq('email_address', email_address)
          .single();

        if (emailExists) {
          return res.status(409).json({
            success: false,
            error: 'Email already exists',
            message: 'A user with this email already exists'
          });
        }
      }

      const updateData = {};

      if (full_name !== undefined) updateData.full_name = full_name;
      if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth;
      if (age !== undefined) updateData.age = age;
      if (gender !== undefined) updateData.gender = gender;
      if (civil_status !== undefined) updateData.civil_status = civil_status;
      if (address !== undefined) updateData.address = address;
      if (contact_number !== undefined) updateData.contact_number = contact_number;
      if (email_address !== undefined) updateData.email_address = email_address;
      if (emergency_contact_person_number !== undefined) updateData.emergency_contact_person_number = emergency_contact_person_number;
      if (role !== undefined) updateData.role = role;
      if (is_active !== undefined) updateData.is_active = is_active;

      // Update password if provided
      if (password) {
        if (password.length < 8) {
          return res.status(400).json({
            success: false,
            error: 'Password too short',
            message: 'Password must be at least 8 characters'
          });
        }
        updateData.password_hash = await bcrypt.hash(password, 10);
      }

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const { password_hash, ...userData } = data;

      res.json({
        success: true,
        message: 'User updated successfully',
        data: userData
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete user (Admin)
  deleteUser: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('users')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'User not found',
            message: `User with ID ${id} not found`
          });
        }
        throw error;
      }

      res.json({
        success: true,
        message: 'User deleted successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Activate/Deactivate user
  toggleUserStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      if (is_active === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'is_active field is required'
        });
      }

      const { data, error } = await supabase
        .from('users')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          message: `User with ID ${id} not found`
        });
      }

      const { password_hash, ...userData } = data;

      res.json({
        success: true,
        message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
        data: userData
      });
    } catch (error) {
      next(error);
    }
  },

  // Change user role
  changeUserRole: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'role field is required'
        });
      }

      const validRoles = ['user', 'admin', 'doctor'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role',
          message: `Role must be one of: ${validRoles.join(', ')}`
        });
      }

      const { data, error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          message: `User with ID ${id} not found`
        });
      }

      const { password_hash, ...userData } = data;

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: userData
      });
    } catch (error) {
      next(error);
    }
  },

  // ============================================
  // DOCTOR MANAGEMENT
  // ============================================

  // Get all doctors (with filters)
  getAllDoctors: async (req, res, next) => {
    try {
      const { 
        search, 
        specialization, 
        is_active, 
        is_verified,
        mental_health_specialty,
        page = 1, 
        limit = 50,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = req.query;

      let query = supabase
        .from('doctors')
        .select('*', { count: 'exact' });

      // Search filter
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email_address.ilike.%${search}%,specialization.ilike.%${search}%`);
      }

      // Specialization filter
      if (specialization) {
        query = query.ilike('specialization', `%${specialization}%`);
      }

      // Active status filter
      if (is_active !== undefined) {
        query = query.eq('is_active', is_active === 'true');
      }

      // Verification status filter
      if (is_verified !== undefined) {
        query = query.eq('is_verified', is_verified === 'true');
      }

      // Mental health specialty filter
      if (mental_health_specialty) {
        query = query.contains('mental_health_specialties', [mental_health_specialty]);
      }

      // Sorting
      query = query.order(sort_by, { ascending: sort_order === 'asc' });

      // Pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const from = (pageNum - 1) * limitNum;
      const to = from + limitNum - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Remove password_hash from response
      const doctors = (data || []).map(({ password_hash, ...doctor }) => doctor);

      res.json({
        success: true,
        message: 'Doctors retrieved successfully',
        count: doctors.length,
        total: count || 0,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil((count || 0) / limitNum),
        data: doctors
      });
    } catch (error) {
      next(error);
    }
  },

  // Get doctor by ID
  getDoctorById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          error: 'Doctor not found',
          message: `No doctor found with ID: ${id}`
        });
      }

      const { password_hash, ...doctor } = data;

      res.json({
        success: true,
        message: 'Doctor retrieved successfully',
        data: doctor
      });
    } catch (error) {
      next(error);
    }
  },

  // Create doctor (Admin)
  createDoctor: async (req, res, next) => {
    try {
      const {
        full_name,
        email_address,
        password,
        phone_number,
        specialization,
        license_number,
        qualifications,
        bio,
        years_of_experience,
        consultation_fee,
        profile_image_url,
        mental_health_specialties,
        is_active = true,
        is_verified = false
      } = req.body;

      // Validation
      if (!full_name || !email_address || !specialization || !license_number) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Required fields: full_name, email_address, specialization, license_number'
        });
      }

      // Check if email already exists
      const { data: existingDoctor } = await supabase
        .from('doctors')
        .select('email_address')
        .eq('email_address', email_address)
        .single();

      if (existingDoctor) {
        return res.status(409).json({
          success: false,
          error: 'Email already exists',
          message: 'A doctor with this email already exists'
        });
      }

      // Check if license number already exists
      const { data: existingLicense } = await supabase
        .from('doctors')
        .select('license_number')
        .eq('license_number', license_number)
        .single();

      if (existingLicense) {
        return res.status(409).json({
          success: false,
          error: 'License number already exists',
          message: 'A doctor with this license number already exists'
        });
      }

      const insertData = {
        full_name,
        email_address,
        phone_number: phone_number || null,
        specialization,
        license_number,
        qualifications: qualifications || null,
        bio: bio || null,
        years_of_experience: years_of_experience || null,
        consultation_fee: consultation_fee || null,
        profile_image_url: profile_image_url || null,
        is_active,
        is_verified
      };

      // Hash password if provided
      if (password) {
        if (password.length < 8) {
          return res.status(400).json({
            success: false,
            error: 'Password too short',
            message: 'Password must be at least 8 characters'
          });
        }
        insertData.password_hash = await bcrypt.hash(password, 10);
      }

      // Add mental health specialties if provided
      if (mental_health_specialties !== undefined) {
        if (!Array.isArray(mental_health_specialties)) {
          return res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: 'mental_health_specialties must be an array'
          });
        }
        insertData.mental_health_specialties = mental_health_specialties;
      }

      const { data, error } = await supabase
        .from('doctors')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      const { password_hash, ...doctorData } = data;

      res.status(201).json({
        success: true,
        message: 'Doctor created successfully',
        data: doctorData
      });
    } catch (error) {
      next(error);
    }
  },

  // Update doctor (Admin)
  updateDoctor: async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        full_name,
        email_address,
        phone_number,
        specialization,
        license_number,
        qualifications,
        bio,
        years_of_experience,
        consultation_fee,
        profile_image_url,
        mental_health_specialties,
        is_active,
        is_verified
      } = req.body;

      // Check if doctor exists
      const { data: existingDoctor, error: fetchError } = await supabase
        .from('doctors')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existingDoctor) {
        return res.status(404).json({
          success: false,
          error: 'Doctor not found',
          message: `Doctor with ID ${id} not found`
        });
      }

      // Check email uniqueness if email is being changed
      if (email_address && email_address !== existingDoctor.email_address) {
        const { data: emailExists } = await supabase
          .from('doctors')
          .select('id')
          .eq('email_address', email_address)
          .single();

        if (emailExists) {
          return res.status(409).json({
            success: false,
            error: 'Email already exists',
            message: 'A doctor with this email already exists'
          });
        }
      }

      // Check license uniqueness if license is being changed
      if (license_number && license_number !== existingDoctor.license_number) {
        const { data: licenseExists } = await supabase
          .from('doctors')
          .select('id')
          .eq('license_number', license_number)
          .single();

        if (licenseExists) {
          return res.status(409).json({
            success: false,
            error: 'License number already exists',
            message: 'A doctor with this license number already exists'
          });
        }
      }

      const updateData = {};

      if (full_name !== undefined) updateData.full_name = full_name;
      if (email_address !== undefined) updateData.email_address = email_address;
      if (phone_number !== undefined) updateData.phone_number = phone_number;
      if (specialization !== undefined) updateData.specialization = specialization;
      if (license_number !== undefined) updateData.license_number = license_number;
      if (qualifications !== undefined) updateData.qualifications = qualifications;
      if (bio !== undefined) updateData.bio = bio;
      if (years_of_experience !== undefined) updateData.years_of_experience = years_of_experience;
      if (consultation_fee !== undefined) updateData.consultation_fee = consultation_fee;
      if (profile_image_url !== undefined) updateData.profile_image_url = profile_image_url;
      if (is_active !== undefined) updateData.is_active = is_active;
      if (is_verified !== undefined) updateData.is_verified = is_verified;
      if (mental_health_specialties !== undefined) {
        if (!Array.isArray(mental_health_specialties)) {
          return res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: 'mental_health_specialties must be an array'
          });
        }
        updateData.mental_health_specialties = mental_health_specialties;
      }

      const { data, error } = await supabase
        .from('doctors')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const { password_hash, ...doctorData } = data;

      res.json({
        success: true,
        message: 'Doctor updated successfully',
        data: doctorData
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete doctor (Admin)
  deleteDoctor: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('doctors')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Doctor not found',
            message: `Doctor with ID ${id} not found`
          });
        }
        throw error;
      }

      res.json({
        success: true,
        message: 'Doctor deleted successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Verify/Unverify doctor
  toggleDoctorVerification: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { is_verified } = req.body;

      if (is_verified === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'is_verified field is required'
        });
      }

      const { data, error } = await supabase
        .from('doctors')
        .update({ is_verified })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          error: 'Doctor not found',
          message: `Doctor with ID ${id} not found`
        });
      }

      const { password_hash, ...doctorData } = data;

      res.json({
        success: true,
        message: `Doctor ${is_verified ? 'verified' : 'unverified'} successfully`,
        data: doctorData
      });
    } catch (error) {
      next(error);
    }
  },

  // Activate/Deactivate doctor
  toggleDoctorStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      if (is_active === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'is_active field is required'
        });
      }

      const { data, error } = await supabase
        .from('doctors')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          error: 'Doctor not found',
          message: `Doctor with ID ${id} not found`
        });
      }

      const { password_hash, ...doctorData } = data;

      res.json({
        success: true,
        message: `Doctor ${is_active ? 'activated' : 'deactivated'} successfully`,
        data: doctorData
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = adminController;

