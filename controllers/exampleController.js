// Example controller - demonstrates controller pattern
const exampleController = {
  // Get all examples
  getAll: async (req, res, next) => {
    try {
      // TODO: Add database logic here
      res.json({
        message: 'Get all examples',
        data: []
      });
    } catch (error) {
      next(error);
    }
  },

  // Get example by ID
  getById: async (req, res, next) => {
    try {
      const { id } = req.params;
      // TODO: Add database logic here
      res.json({
        message: `Get example by ID: ${id}`,
        data: { id }
      });
    } catch (error) {
      next(error);
    }
  },

  // Create example
  create: async (req, res, next) => {
    try {
      const { body } = req;
      // TODO: Add database logic here
      res.status(201).json({
        message: 'Example created',
        data: body
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = exampleController;

