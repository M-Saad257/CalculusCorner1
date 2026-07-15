const BookModel = require('../models/BookModel');
const { broadcastToAll } = require('../socket');

const bookController = {
  // Public & Admin
  async getBooks(req, res, next) {
    try {
      const books = await BookModel.getAll();
      res.status(200).json({
        success: true,
        data: books
      });
    } catch (error) {
      next(error);
    }
  },

  // Admin Only
  async createBook(req, res, next) {
    try {
      const { title, category, subcategory } = req.body;
      const show_on_home = req.body.show_on_home === 'true' || req.body.show_on_home === true;

      if (!title) {
        res.status(400);
        throw new Error('Book title is required');
      }

      const fileObj = req.files && req.files['file'] ? req.files['file'][0] : null;
      const thumbObj = req.files && req.files['thumbnail'] ? req.files['thumbnail'][0] : null;

      if (!fileObj) {
        res.status(400);
        throw new Error('Please upload a file');
      }

      const file_url = '/uploads/resources/' + fileObj.filename;
      const original_filename = fileObj.originalname || fileObj.filename;
      
      let thumbnail_url = null;
      if (thumbObj) {
        thumbnail_url = '/uploads/resources/' + thumbObj.filename;
      }

      const metadata = { show_on_home };

      const insertId = await BookModel.create(
        title,
        file_url,
        original_filename,
        metadata,
        category || 'General',
        subcategory || null,
        thumbnail_url
      );

      const newBook = await BookModel.getById(insertId);
      broadcastToAll('book:create', newBook);

      res.status(201).json({
        success: true,
        message: 'Book created successfully',
        data: newBook
      });
    } catch (error) {
      next(error);
    }
  },

  async updateBook(req, res, next) {
    try {
      const bookId = req.params.id;
      const { title, category, subcategory } = req.body;
      const show_on_home = req.body.show_on_home === 'true' || req.body.show_on_home === true;

      const existing = await BookModel.getById(bookId);
      if (!existing) {
        res.status(404);
        throw new Error('Book not found');
      }

      const fileObj = req.files && req.files['file'] ? req.files['file'][0] : null;
      const thumbObj = req.files && req.files['thumbnail'] ? req.files['thumbnail'][0] : null;

      let file_url = existing.file_url;
      let original_filename = existing.original_filename;
      if (fileObj) {
        file_url = '/uploads/resources/' + fileObj.filename;
        original_filename = fileObj.originalname || fileObj.filename;
      }

      let thumbnail_url = existing.thumbnail_url;
      if (thumbObj) {
        thumbnail_url = '/uploads/resources/' + thumbObj.filename;
      }
      
      // Merge metadata
      const currentMeta = existing.metadata || {};
      const newMetadata = { ...currentMeta, show_on_home };

      await BookModel.update(
        bookId,
        title || existing.title,
        file_url,
        original_filename,
        newMetadata,
        category !== undefined ? category : existing.category,
        subcategory !== undefined ? subcategory : existing.subcategory,
        thumbnail_url
      );

      const updatedBook = await BookModel.getById(bookId);
      broadcastToAll('book:update', updatedBook);

      res.status(200).json({
        success: true,
        message: 'Book updated successfully',
        data: updatedBook
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteBook(req, res, next) {
    try {
      const bookId = req.params.id;
      const existing = await BookModel.getById(bookId);
      if (!existing) {
        res.status(404);
        throw new Error('Book not found');
      }

      await BookModel.delete(bookId);
      broadcastToAll('book:delete', bookId);

      res.status(200).json({
        success: true,
        message: 'Book deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = bookController;
