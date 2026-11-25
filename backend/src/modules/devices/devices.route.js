import { Router } from 'express';
import { z } from 'zod';
import { isValidExpoToken } from '../../integrations/expoPush.js';
import { ok } from '../../middleware/envelope.js';
import { validate } from '../../middleware/validate.js';
import { Device } from '../../models/index.js';

const registerDeviceSchema = z.object({
  expoPushToken: z.string().trim().refine(isValidExpoToken, 'Invalid Expo push token format'),
  platform: z.enum(['android', 'ios']),
});

export function createDevicesRouter(requireAuth) {
  const router = Router();
  router.use(requireAuth);

  router.post('/', validate({ body: registerDeviceSchema }), async (req, res) => {
    const { expoPushToken, platform } = req.body;
    const device = await Device.findOneAndUpdate(
      { expoPushToken },
      {
        $set: {
          userId: req.user._id,
          platform,
          lastSeenAt: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
    );

    return ok(
      res,
      {
        device: {
          id: String(device._id),
          expoPushToken: device.expoPushToken,
          platform: device.platform,
        },
      },
      201,
    );
  });

  router.delete('/:token', async (req, res) => {
    await Device.deleteOne({
      userId: req.user._id,
      expoPushToken: decodeURIComponent(req.params.token),
    });
    return ok(res, { deleted: true });
  });

  return router;
}
