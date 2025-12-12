const { supabase } = require('../config/supabase');

const profileController = {
  // Get all profiles
  getAll: async (req, res, next) => {
    try {
      const { search, is_archived, page = 1, limit = 50 } = req.query;

      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Search filter
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      // Archive filter
      if (is_archived !== undefined) {
        query = query.eq('is_archived', is_archived === 'true');
      } else {
        // By default, show only non-archived
        query = query.eq('is_archived', false);
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
        message: 'Profiles retrieved successfully',
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

  // Get profile by ID
  getById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found',
          message: `No profile found with ID: ${id}`
        });
      }

      res.json({
        success: true,
        message: 'Profile retrieved successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Create profile
  create: async (req, res, next) => {
    try {
      const {
        first_name,
        last_name,
        email,
        contact,
        address1,
        address2
      } = req.body;

      // Validation
      if (!first_name || !last_name || !email || !contact || !address1 || !address2) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Required fields: first_name, last_name, email, contact, address1, address2'
        });
      }

      // Check if email already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single();

      if (existingProfile) {
        return res.status(409).json({
          success: false,
          error: 'Email already exists',
          message: 'A profile with this email already exists'
        });
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          first_name,
          last_name,
          email,
          contact,
          address1,
          address2,
          is_archived: false
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Profile created successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Update profile
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        first_name,
        last_name,
        email,
        contact,
        address1,
        address2
      } = req.body;

      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existingProfile) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found',
          message: `Profile with ID ${id} not found`
        });
      }

      // Check email uniqueness if email is being changed
      if (email && email !== existingProfile.email) {
        const { data: emailExists } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .single();

        if (emailExists) {
          return res.status(409).json({
            success: false,
            error: 'Email already exists',
            message: 'A profile with this email already exists'
          });
        }
      }

      const updateData = {};

      if (first_name !== undefined) updateData.first_name = first_name;
      if (last_name !== undefined) updateData.last_name = last_name;
      if (email !== undefined) updateData.email = email;
      if (contact !== undefined) updateData.contact = contact;
      if (address1 !== undefined) updateData.address1 = address1;
      if (address2 !== undefined) updateData.address2 = address2;

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete profile (soft delete - archive)
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('profiles')
        .update({
          is_archived: true,
          archived_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found',
          message: `Profile with ID ${id} not found`
        });
      }

      res.json({
        success: true,
        message: 'Profile archived successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Restore archived profile
  restore: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('profiles')
        .update({
          is_archived: false,
          archived_at: null
        })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          error: 'Profile not found',
          message: `Profile with ID ${id} not found`
        });
      }

      res.json({
        success: true,
        message: 'Profile restored successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = profileController;

