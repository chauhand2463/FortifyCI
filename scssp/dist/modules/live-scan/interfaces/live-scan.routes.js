"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.liveScanRoutes = liveScanRoutes;
const live_scan_service_1 = require("../application/live-scan.service");
const auth_1 = require("@shared/middleware/auth");
const errors_1 = require("@shared/errors");
async function liveScanRoutes(app) {
    app.post('/', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('LIVE_SCAN_CREATE')] }, async (request, reply) => {
        const body = request.body;
        if (!body.imageRef)
            throw new errors_1.ValidationError('imageRef required');
        const result = await live_scan_service_1.liveScanService.create(body, request.user.userId);
        return reply.code(202).send({ success: true, data: result });
    });
    app.get('/:id', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('LIVE_SCAN_CREATE')] }, async (request, reply) => {
        const result = await live_scan_service_1.liveScanService.findById(request.params.id);
        return { success: true, data: result };
    });
    app.get('/:id/events', { preHandler: [auth_1.authenticate, (0, auth_1.authorize)('LIVE_SCAN_CREATE')] }, async (request, reply) => {
        const scan = await live_scan_service_1.liveScanService.findById(request.params.id);
        if (!scan)
            throw new errors_1.ValidationError('Live scan not found');
        reply.raw.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });
        const interval = setInterval(async () => {
            try {
                const current = await live_scan_service_1.liveScanService.findById(request.params.id);
                reply.raw.write(`data: ${JSON.stringify({ status: current.status, progress: current.progress })}\n\n`);
                if (current.status === 'PASSED' || current.status === 'BLOCKED' || current.status === 'FAILED') {
                    clearInterval(interval);
                    reply.raw.end();
                }
            }
            catch {
                clearInterval(interval);
                reply.raw.end();
            }
        }, 2000);
        request.raw.on('close', () => {
            clearInterval(interval);
        });
    });
}
//# sourceMappingURL=live-scan.routes.js.map