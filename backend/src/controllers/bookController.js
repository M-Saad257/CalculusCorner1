const BookModel = require('../models/BookModel');
const { broadcastToAll } = require('../socket');

const bookController = {
  // Public & Admin
  async getBooks(req, res, next) {
    try {
      const page = parseInt(req.query.page);
      const limit = parseInt(req.query.limit);
      let category = req.query.category;
      const subcategory = req.query.subcategory;
      const search = req.query.search;
      const sortBy = req.query.sortBy || req.query.sort || 'default';

      // Optional check for logged-in user to personalize results
      let studentClass = null;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
          const token = req.headers.authorization.split(' ')[1];
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
          if (decoded && decoded.id) {
            const db = require('../config/db');
            const [profileRows] = await db.query('SELECT class FROM students_profile WHERE user_id = ?', [decoded.id]);
            studentClass = profileRows[0]?.class || null;
          }
        } catch (e) {
          // Token invalid or expired, ignore
        }
      }

      if (studentClass && studentClass !== 'All') {
        category = studentClass;
      }

      if (page && limit) {
        const { data, totalItems, totalPages } = await BookModel.getPaginated(page, limit, category, subcategory, search, sortBy);
        return res.status(200).json({
          success: true,
          data,
          page,
          limit,
          totalPages,
          totalItems
        });
      }

      let books = await BookModel.getAll();
      if (studentClass && studentClass !== 'All') {
        books = books.filter(b => (b.category || '').toLowerCase() === studentClass.toLowerCase());
      }
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
      const show_on_homepage = (req.body.show_on_homepage === 'true' || req.body.show_on_homepage === '1' || req.body.show_on_homepage === true || req.body.show_on_homepage === 1 || req.body.show_on_home === 'true' || req.body.show_on_home === true) ? 1 : 0;

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

      const metadata = { show_on_home: show_on_homepage === 1 };

      const insertId = await BookModel.create(
        title,
        file_url,
        original_filename,
        metadata,
        category || 'General',
        subcategory || null,
        thumbnail_url,
        show_on_homepage
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
      const show_on_homepage = req.body.show_on_homepage !== undefined
        ? (req.body.show_on_homepage === 'true' || req.body.show_on_homepage === '1' || req.body.show_on_homepage === true || req.body.show_on_homepage === 1 ? 1 : 0)
        : (req.body.show_on_home !== undefined ? (req.body.show_on_home === 'true' || req.body.show_on_home === true ? 1 : 0) : undefined);

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
      const newMetadata = { ...currentMeta, show_on_home: show_on_homepage !== undefined ? show_on_homepage === 1 : currentMeta.show_on_home };

      await BookModel.update(
        bookId,
        title || existing.title,
        file_url,
        original_filename,
        newMetadata,
        category !== undefined ? category : existing.category,
        subcategory !== undefined ? subcategory : existing.subcategory,
        thumbnail_url,
        show_on_homepage !== undefined ? show_on_homepage : existing.show_on_homepage
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
  },

  async viewBook(req, res, next) {
    try {
      const { id } = req.params;
      const book = await BookModel.getById(id);

      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }

      const path = require('path');
      const fs = require('fs');

      const filePath = path.join(__dirname, '../..', book.file_url);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'File not found' });
      }

      // Increment views count in database
      const db = require('../config/db');
      await db.query('UPDATE books SET views = views + 1 WHERE id = ?', [id]).catch(e => console.error('Failed to increment book views:', e));
      try {
        const { broadcastToAdmins } = require('../socket');
        broadcastToAdmins('admin:analytics:update', { type: 'book_view', id });
      } catch (socketErr) {}

      res.removeHeader('X-Frame-Options');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${book.original_filename || path.basename(book.file_url)}"`
      );

      res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  },

  async downloadBook(req, res, next) {
    try {
      const { id } = req.params;
      const book = await BookModel.getById(id);

      if (!book) {
        res.status(404);
        throw new Error('Book not found');
      }

      const path = require('path');
      const filePath = path.join(__dirname, '../..', book.file_url);
      const fs = require('fs');

      if (!fs.existsSync(filePath)) {
        res.status(404);
        throw new Error('Book file does not exist on server');
      }

      // Increment downloads count in database
      const db = require('../config/db');
      await db.query('UPDATE books SET downloads = downloads + 1 WHERE id = ?', [id]).catch(e => console.error('Failed to increment book downloads:', e));
      try {
        const { broadcastToAdmins } = require('../socket');
        broadcastToAdmins('admin:analytics:update', { type: 'book_download', id });
      } catch (socketErr) {}

      const originalFilename = book.original_filename || path.basename(book.file_url);
      res.download(filePath, originalFilename);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = bookController;
