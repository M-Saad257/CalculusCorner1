const contentService = require('../services/contentService');
const VideoModel = require('../models/VideoModel');
const AnnouncementModel = require('../models/AnnouncementModel');

const getAllContent = async (req, res, next) => {
  try {
    const content = await contentService.getAllContent();
    res.status(200).json({
      success: true,
      message: 'Site content configuration loaded successfully',
      data: content
    });
  } catch (error) {
    next(error);
  }
};

const getPublicVideos = async (req, res, next) => {
  try {
    const videos = await VideoModel.getAll();
    res.status(200).json({
      success: true,
      data: videos
    });
  } catch (error) {
    next(error);
  }
};

const getActiveAnnouncements = async (req, res, next) => {
  try {
    const activeAnnouncements = await AnnouncementModel.getActive();
    res.status(200).json({
      success: true,
      data: activeAnnouncements
    });
  } catch (error) {
    next(error);
  }
};

const updateSectionContent = async (req, res, next) => {
  try {
    const sectionName = req.params.section;
    const contentData = req.body;

    if (!contentData || Object.keys(contentData).length === 0) {
      res.status(400);
      throw new Error('Payload cannot be empty');
    }

    const success = await contentService.updateSectionContent(sectionName, contentData);
    if (!success) {
      res.status(500);
      throw new Error('Failed to save layout content');
    }

    const { broadcastToAll } = require('../socket');
    broadcastToAll('site:content-update', { sectionName, contentData });

    res.status(200).json({
      success: true,
      message: `${sectionName} content updated and published successfully`,
      data: contentData
    });
  } catch (error) {
    next(error);
  }
};

const uploadLogoContent = async (req, res, next) => {
  try {
    if (!req.file) {
      res.status(400);
      throw new Error('Please upload a logo file');
    }

    const { broadcastToAll } = require('../socket');

    const logoUrl = `/uploads/logo/${req.file.filename}`;
    const logoData = { logo_url: logoUrl };

    const success = await contentService.updateSectionContent('logo', logoData);
    if (!success) {
      res.status(500);
      throw new Error('Failed to save logo path in database');
    }

    broadcastToAll('site:logo-update', logoData);

    res.status(200).json({
      success: true,
      message: 'Logo uploaded and updated globally!',
      data: logoData
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  getAllContent,
  getPublicVideos,
  getActiveAnnouncements,
  updateSectionContent,
  uploadLogoContent
};
