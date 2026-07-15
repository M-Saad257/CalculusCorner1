const ProgressModel = require('../models/ProgressModel');
const VideoModel = require('../models/VideoModel');
const CourseModel = require('../models/CourseModel');

const progressController = {
  // Update Video Progress
  async updateVideoProgress(req, res) {
    try {
      const { videoId } = req.params;
      const { progressPercent } = req.body;
      const userId = req.user.id;

      if (!videoId || progressPercent === undefined) {
        return res.status(400).json({ success: false, message: 'Video ID and progress percentage are required.' });
      }

      await ProgressModel.upsertVideoProgress(userId, videoId, progressPercent);

      res.json({ success: true, message: 'Video progress updated successfully.' });
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
      const recentVideos = await ProgressModel.getRecentlyWatchedVideos(userId, 5);
      
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
