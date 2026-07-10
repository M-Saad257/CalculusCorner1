const testimonialService = require('../services/testimonialService');

const getAllTestimonials = async (req, res, next) => {
  try {
    const { status } = req.query;
    const testimonials = await testimonialService.getAllTestimonials(status);
    res.status(200).json({
      success: true,
      message: 'Testimonials fetched successfully',
      data: testimonials
    });
  } catch (error) {
    next(error);
  }
};

const createTestimonial = async (req, res, next) => {
  try {
    const { name, role, text } = req.body;
    if (!name || !role || !text) {
      res.status(400);
      throw new Error('Name, role, and text fields are required');
    }

    const newId = await testimonialService.createTestimonial(req.body);

    const { broadcastToAll } = require('../socket');
    broadcastToAll('site:testimonial-update', { id: newId });

    res.status(201).json({
      success: true,
      message: 'Testimonial added successfully',
      data: { id: newId, ...req.body }
    });
  } catch (error) {
    next(error);
  }
};

const deleteTestimonial = async (req, res, next) => {
  try {
    const id = req.params.id;
    const success = await testimonialService.deleteTestimonial(id);
    if (!success) {
      res.status(404);
      throw new Error('Testimonial not found or already deleted');
    }

    const { broadcastToAll } = require('../socket');
    broadcastToAll('site:testimonial-update', { id });

    res.status(200).json({
      success: true,
      message: 'Testimonial deleted successfully',
      data: { id }
    });
  } catch (error) {
    next(error);
  }
};

const updateTestimonialStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status) {
      res.status(400);
      throw new Error('Status is required');
    }

    const success = await testimonialService.updateTestimonialStatus(id, status);
    if (!success) {
      res.status(404);
      throw new Error('Testimonial not found');
    }

    const { broadcastToAll } = require('../socket');
    broadcastToAll('site:testimonial-update', { id });

    res.status(200).json({
      success: true,
      message: `Testimonial status updated to ${status}`
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTestimonials,
  createTestimonial,
  deleteTestimonial,
  updateTestimonialStatus
};
