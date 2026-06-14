"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scanRoutes = scanRoutes;
const scan_service_1 = require("../application/scan.service");
const scan_types_1 = require("../domain/scan.types");
const auth_1 = require("@shared/middleware/auth");
const errors_1 = require("@shared/errors");
async function scanRoutes(app) {
    app.addHook('preHandler', auth_1.authenticate);
    app.post('/', {
        preHandler: [(0, auth_1.authorize)('SCAN_CREATE')],
    }, async (request, reply) => {
        const parsed = scan_types_1.createScanSchema.safeParse(request.body);
        if (!parsed.success)
            throw new errors_1.ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
        const result = await scan_service_1.scanService.create(parsed.data, request.user.userId);
        return reply.code(201).send({ success: true, data: result });
    });
    app.get('/', {
        preHandler: [(0, auth_1.authorize)('SCAN_READ')],
    }, async (request) => {
        const parsed = scan_types_1.scanQuerySchema.safeParse(request.query);
        if (!parsed.success)
            throw new errors_1.ValidationError(parsed.error.errors.map((e) => e.message).join(', '));
        const result = await scan_service_1.scanService.findAll(parsed.data);
        return { success: true, ...result };
    });
    app.get('/:id', {
        preHandler: [(0, auth_1.authorize)('SCAN_READ')],
    }, async (request) => {
        const { id } = request.params;
        const result = await scan_service_1.scanService.findById(id);
        return { success: true, data: result };
    });
    app.post('/:id/cancel', {
        preHandler: [(0, auth_1.authorize)('SCAN_CANCEL')],
    }, async (request) => {
        const { id } = request.params;
        await scan_service_1.scanService.cancelScan(id, request.user.userId);
        return { success: true, message: 'Scan cancelled' };
    });
    app.get('/:id/sbom', {
        preHandler: [(0, auth_1.authorize)('SBOM_READ')],
    }, async (request) => {
        const { id } = request.params;
        const result = await scan_service_1.scanService.getSbom(id);
        return { success: true, data: result };
    });
    app.get('/:id/sbom/download', {
        preHandler: [(0, auth_1.authorize)('SBOM_READ')],
    }, async (request, reply) => {
        const { id } = request.params;
        const { format } = request.query;
        const result = await scan_service_1.scanService.downloadSbom(id, format || 'CYCLONEDX');
        reply.header('Content-Type', result.contentType);
        reply.header('Content-Disposition', `attachment; filename="${result.filename}"`);
        return reply.send(result.content);
    });
    app.get('/:id/packages', {
        preHandler: [(0, auth_1.authorize)('VULNERABILITY_READ')],
    }, async (request) => {
        const { id } = request.params;
        const result = await scan_service_1.scanService.getPackages(id);
        return { success: true, data: result };
    });
}
//# sourceMappingURL=scan.routes.js.map