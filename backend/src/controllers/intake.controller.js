import { AppError, ok } from '../middleware/envelope.js';
import { processLinkIntake, processPhotoIntake } from '../services/intake.service.js';

export function createIntakeHandlers(options = {}) {
  return {
    postLink: async (req, res) => {
      const data = await processLinkIntake({
        ...req.body,
        fetchOptions: options.fetchOptions || {},
      });
      return ok(res, data);
    },
    postPhoto: async (req, res) => {
      if (!req.file?.buffer) {
        throw new AppError(400, 'PHOTO_REQUIRED', 'Attach an image file in field "photo"');
      }
      try {
        const data = await processPhotoIntake({
          userId: req.user._id,
          imageBase64: req.file.buffer.toString('base64'),
          mimeType: req.file.mimetype,
          aiRouter: options.aiRouter,
        });
        return ok(res, data);
      } finally {
        req.file.buffer = Buffer.alloc(0);
      }
    },
  };
}
