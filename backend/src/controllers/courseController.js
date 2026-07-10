const courseService = require('../services/courseService');

const getAllCourses = async (req, res, next) => {
  try {
    const courses = await courseService.getAllCourses();
    res.status(200).json({
      success: true,
      message: 'Courses fetched successfully',
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

const getCourseById = async (req, res, next) => {
  try {
    const course = await courseService.getCourseById(req.params.id);
    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }
    res.status(200).json({
      success: true,
      message: 'Course details fetched successfully',
      data: course
    });
  } catch (error) {
    next(error);
  }
};

const createCourse = async (req, res, next) => {
  try {
    const { grade, title, description, features, price } = req.body;
    if (!grade || !title || !description || !features || !price) {
      res.status(400);
      throw new Error('All course fields (grade, title, description, features, price) are required');
    }

    const newId = await courseService.createCourse(req.body);
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { id: newId, ...req.body }
    });
  } catch (error) {
    next(error);
  }
};

const updateCourse = async (req, res, next) => {
  try {
    const id = req.params.id;
    const course = await courseService.getCourseById(id);
    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }

    const success = await courseService.updateCourse(id, req.body);
    if (!success) {
      res.status(500);
      throw new Error('Failed to update course in the database');
    }

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: { id, ...req.body }
    });
  } catch (error) {
    next(error);
  }
};

const deleteCourse = async (req, res, next) => {
  try {
    const id = req.params.id;
    const course = await courseService.getCourseById(id);
    if (!course) {
      res.status(404);
      throw new Error('Course not found');
    }

    const success = await courseService.deleteCourse(id);
    if (!success) {
      res.status(500);
      throw new Error('Failed to delete course');
    }

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
      data: { id }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse
};
