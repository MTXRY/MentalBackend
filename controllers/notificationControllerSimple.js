const { supabase } = require('../config/supabase');

const notificationController = {
  // Get all notifications (admin)
  getAll: async (req, res, next) => {
    try {
      const { user_id, status, page = 1, limit = 50 } = req.query;

      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (user_id) query = query.eq('user_id', user_id);
      if (status) query = query.eq('status', status);

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
        message: 'Notifications retrieved successfully',
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

  // Get notifications for a user
  getByUserId: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { status } = req.query;

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (status) query = query.eq('status', status);

      const { data, error } = await query;

      if (error) throw error;

      res.json({
        success: true,
        message: 'Notifications retrieved successfully',
        count: data?.length || 0,
        data: data || []
      });
    } catch (error) {
      next(error);
    }
  },

  // Get notification by ID
  getById: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          error: 'Notification not found',
          message: `No notification found with ID: ${id}`
        });
      }

      res.json({
        success: true,
        message: 'Notification retrieved successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Create notification
  create: async (req, res, next) => {
    try {
      const {
        user_id,
        message,
        status = 'unread'
      } = req.body;

      // Validation
      if (!user_id || !message) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Required fields: user_id, message'
        });
      }

      // Validate status
      const validStatuses = ['read', 'unread'];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
      }

      // Check if user exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user_id)
        .single();

      if (userError || !user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          message: `User with ID ${user_id} not found`
        });
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id,
          message,
          status
        })
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        success: true,
        message: 'Notification created successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Update notification
  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const {
        message,
        status
      } = req.body;

      // Check if notification exists
      const { data: existingNotification, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existingNotification) {
        return res.status(404).json({
          success: false,
          error: 'Notification not found',
          message: `Notification with ID ${id} not found`
        });
      }

      const updateData = {};

      if (message !== undefined) updateData.message = message;
      if (status !== undefined) {
        const validStatuses = ['read', 'unread'];
        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: `Status must be one of: ${validStatuses.join(', ')}`
          });
        }
        updateData.status = status;
      }

      const { data, error } = await supabase
        .from('notifications')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        success: true,
        message: 'Notification updated successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete notification
  delete: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Notification not found',
            message: `Notification with ID ${id} not found`
          });
        }
        throw error;
      }

      res.json({
        success: true,
        message: 'Notification deleted successfully',
        data
      });
    } catch (error) {
      next(error);
    }
  },

  // Mark notification as read
  markAsRead: async (req, res, next) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('notifications')
        .update({ status: 'read' })
        .eq('id', id)
        .select()
        .single();

      if (error || !data) {
        return res.status(404).json({
          success: false,
          error: 'Notification not found',
          message: `Notification with ID ${id} not found`
        });
      }

      res.json({
        success: true,
        message: 'Notification marked as read',
        data
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = notificationController;

