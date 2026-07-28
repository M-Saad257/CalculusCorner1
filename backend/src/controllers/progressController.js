const ProgressModel = require('../models/ProgressModel');
const VideoModel = require('../models/VideoModel');
const CourseModel = require('../models/CourseModel');

const progressController = {
  // Update Video Progress
  async updateVideoProgress(req, res) {
    try {
      console.log("🔥 PROGRESS HIT", {
        user: req.user,
        params: req.params,
        body: req.body
      });

      const { videoId } = req.params;
      const { progressPercent, lastPosition, duration } = req.body;
      const userId = req.user.id;

      if (!videoId || progressPercent === undefined) {
        return res.status(400).json({ success: false, message: 'Video ID and progress percentage are required.' });
      }

      const parsedLastPosition = parseInt(lastPosition) || 0;

      await ProgressModel.upsertVideoProgress(userId, videoId, progressPercent, parsedLastPosition);

      if (duration) {
        const db = require('../config/db');
        await db.query('UPDATE videos SET duration = ? WHERE id = ?', [duration, videoId]);
      }

      // Clear student dashboard cache so that the recently watched list is refreshed
      const studentController = require('./studentController');
      studentController.clearDashboardCache(userId);

      // Broadcast analytics update to admins real-time
      try {
        const { broadcastToAdmins } = require('../socket');
        broadcastToAdmins('admin:analytics:update', { type: 'video_progress', videoId });
      } catch (socketErr) { }

      // Check and award video milestone badges if video completed
      let newlyAwarded = [];
      if (progressPercent >= 90.0) {
        const BadgeModel = require('../models/BadgeModel');
        newlyAwarded = await BadgeModel.checkAndAwardVideoBadges(userId);
      }

      res.json({
        success: true,
        message: 'Video progress updated successfully.',
        newlyAwarded
      });
    } catch (error) {
      console.error('Error updating video progress:', error);
      res.status(500).json({ success: false, message: 'Server error updating progress.' });
    }
  },

  // Get Recently Watched Videos
  async getRecentlyWatched(req, res) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 5;

      const recentVideos = await ProgressModel.getRecentlyWatchedVideos(userId, limit);

      res.json({ success: true, data: recentVideos });
    } catch (error) {
      console.error('Error fetching recently watched videos:', error);
      res.status(500).json({ success: false, message: 'Server error fetching recent videos.' });
    }
  },

  // Get Course Progress (Optional - if we want to explicitly calculate it per course)
  async getCourseProgress(req, res) {
    try {
      const userId = req.user.id;
      const { courseId } = req.params;

      const progress = await ProgressModel.getCourseProgress(userId, courseId);
      res.json({ success: true, data: progress });
    } catch (error) {
      console.error('Error fetching course progress:', error);
      res.status(500).json({ success: false, message: 'Server error fetching course progress.' });
    }
  },

  // Get All User Progress Summary
  async getProgressSummary(req, res) {
    try {
      const userId = req.user.id;
      const courseProgress = await ProgressModel.getAllCourseProgress(userId);
      const recentVideos = await ProgressModel.getRecentlyWatchedVideos(userId, 6);

      res.json({
        success: true,
        data: {
          courses: courseProgress,
          recentVideos: recentVideos
        }
      });
    } catch (error) {
      console.error('Error fetching progress summary:', error);
      res.status(500).json({ success: false, message: 'Server error fetching progress summary.' });
    }
  }
};

module.exports = progressController;
