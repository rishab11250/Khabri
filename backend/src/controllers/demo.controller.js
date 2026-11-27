import { ok } from '../middleware/envelope.js';
import { getDemoNotices, mutateDemoBoard, renderDemoBoardHtml } from '../services/demo.service.js';

export function createDemoHandlers(options = {}) {
  const isDemoEnabled = () =>
    options.demoMode !== undefined ? Boolean(options.demoMode) : process.env.DEMO_MODE === 'true';

  return {
    getBoard: (req, res) => {
      if (req.query.format === 'json') {
        return ok(res, { notices: getDemoNotices() });
      }
      res.set('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(renderDemoBoardHtml());
    },
    postBoard: (req, res) => {
      const { status, payload } = mutateDemoBoard(req.body, isDemoEnabled());
      return ok(res, payload, status);
    },
  };
}
