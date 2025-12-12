const { supabase } = require('../config/supabase');
const bcrypt = require('bcrypt');

const teamMemberController = {
  // Get all team members
  getAll: async (req, res, next) => {
    try {
      const { search, role, page = 1, limit = 50 } = req.query;

      let query = supabase
        .from('team_members')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Search filter
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      // Role filter
      if (role) {
        query = query.eq('role', role);
      }

      // Pagination
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const from = (pageNum - 1) * limitNum;
      const to = from + limitNum - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      res.json({
        success: true,
        message: 'Team members retrieved successfully',
        count: data?.length || 0,
        total: count || 0,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil((count || 0) / limitNum),
        data: data || []
      });
    } catch (error) {
      next(error);
    }
  },

  // Get team member by ID
  getById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          error: 'Team member not found',
          message: `No team member found with ID: ${id}`
        });
      }

      res.json({
        success: true,
        message: 'Team member retrieved successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Create team member
  create: async (req, res, next) => {
    try {
      const {
        first_name,
        last_name,
        email,
        age,
        phone,
        role = 'user'
      } = req.body;

      // Validation
      if (!first_name || !last_name || !email || !age || !phone) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Required fields: first_name, last_name, email, age, phone'
        });
      }

      // Validate role
      const validRoles = ['admin', 'user', 'doctor'];
      if (role && !validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: `Role must be one of: ${validRoles.join(', ')}`
        });
      }

      // Validate age
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 0) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Age must be a positive number'
        });
      }

      // Check if email already exists
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('email')
        .eq('email', email)
        .single();

      if (existingMember) {
        return res.status(409).json({
          success: false,
          error: 'Email already exists',
          message: 'A team member with this email already exists'
        });
      }

      const { data, error } = await supabase
        .from('team_members')
        .insert({
          first_name,
          last_name,
          email,
          age: ageNum,
          phone,
          role
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Team member created successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Update team member
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        first_name,
        last_name,
        email,
        age,
        phone,
        role
      } = req.body;

      // Check if team member exists
      const { data: existingMember, error: fetchError } = await supabase
        .from('team_members')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existingMember) {
        return res.status(404).json({
          success: false,
          error: 'Team member not found',
          message: `Team member with ID ${id} not found`
        });
      }

      // Check email uniqueness if email is being changed
      if (email && email !== existingMember.email) {
        const { data: emailExists } = await supabase
          .from('team_members')
          .select('id')
          .eq('email', email)
          .single();

        if (emailExists) {
          return res.status(409).json({
            success: false,
            error: 'Email already exists',
            message: 'A team member with this email already exists'
          });
        }
      }

      const updateData = {};

      if (first_name !== undefined) updateData.first_name = first_name;
      if (last_name !== undefined) updateData.last_name = last_name;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (role !== undefined) {
        const validRoles = ['admin', 'user', 'doctor'];
        if (!validRoles.includes(role)) {
          return res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: `Role must be one of: ${validRoles.join(', ')}`
          });
        }
        updateData.role = role;
      }
      if (age !== undefined) {
        const ageNum = parseInt(age);
        if (isNaN(ageNum) || ageNum < 0) {
          return res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: 'Age must be a positive number'
          });
        }
        updateData.age = ageNum;
      }

      const { data, error } = await supabase
        .from('team_members')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        message: 'Team member updated successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete team member
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Team member not found',
            message: `Team member with ID ${id} not found`
          });
        }
        throw error;
      }

      res.json({
        success: true,
        message: 'Team member deleted successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = teamMemberController;

