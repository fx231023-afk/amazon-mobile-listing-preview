var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs/promises';
import path from 'node:path';
var SHARE_TTL_MS = 24 * 60 * 60 * 1000;
var SHARE_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
function createServerShareId(length) {
    if (length === void 0) { length = 8; }
    var id = '';
    for (var index = 0; index < length; index += 1) {
        id += SHARE_ID_ALPHABET[Math.floor(Math.random() * SHARE_ID_ALPHABET.length)];
    }
    return id;
}
function sendJson(response, statusCode, data) {
    response.statusCode = statusCode;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(data));
}
function readRequestBody(request) {
    return new Promise(function (resolve, reject) {
        var body = '';
        request.setEncoding('utf8');
        request.on('data', function (chunk) {
            body += chunk;
        });
        request.on('end', function () { return resolve(body); });
        request.on('error', reject);
    });
}
function getImageExtension(dataUrl) {
    if (dataUrl.startsWith('data:image/jpeg;base64,')) {
        return 'jpg';
    }
    if (dataUrl.startsWith('data:image/webp;base64,')) {
        return 'webp';
    }
    return 'png';
}
function cleanupExpiredShares(sharesDir) {
    return __awaiter(this, void 0, void 0, function () {
        var entries, _a;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 5]);
                    return [4 /*yield*/, fs.readdir(sharesDir, { withFileTypes: true })];
                case 1:
                    entries = _b.sent();
                    return [4 /*yield*/, Promise.all(entries
                            .filter(function (entry) { return entry.isDirectory(); })
                            .map(function (entry) { return __awaiter(_this, void 0, void 0, function () {
                            var recordPath, record, _a, _b, _c;
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        recordPath = path.join(sharesDir, entry.name, 'share.json');
                                        _d.label = 1;
                                    case 1:
                                        _d.trys.push([1, 5, , 7]);
                                        _b = (_a = JSON).parse;
                                        return [4 /*yield*/, fs.readFile(recordPath, 'utf8')];
                                    case 2:
                                        record = _b.apply(_a, [_d.sent()]);
                                        if (!(record.expiresAt && new Date(record.expiresAt).getTime() <= Date.now())) return [3 /*break*/, 4];
                                        return [4 /*yield*/, fs.rm(path.join(sharesDir, entry.name), { recursive: true, force: true })];
                                    case 3:
                                        _d.sent();
                                        _d.label = 4;
                                    case 4: return [3 /*break*/, 7];
                                    case 5:
                                        _c = _d.sent();
                                        return [4 /*yield*/, fs.rm(path.join(sharesDir, entry.name), { recursive: true, force: true })];
                                    case 6:
                                        _d.sent();
                                        return [3 /*break*/, 7];
                                    case 7: return [2 /*return*/];
                                }
                            });
                        }); }))];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 5];
                case 3:
                    _a = _b.sent();
                    return [4 /*yield*/, fs.mkdir(sharesDir, { recursive: true })];
                case 4:
                    _b.sent();
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function saveShareImages(shareDir, shareId, kind, images) {
    return __awaiter(this, void 0, void 0, function () {
        var assetDir;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    assetDir = path.join(shareDir, 'assets');
                    return [4 /*yield*/, fs.mkdir(assetDir, { recursive: true })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, Promise.all(images.map(function (image, index) { return __awaiter(_this, void 0, void 0, function () {
                            var extension, fileName, outputPath, base64;
                            var _a;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        if (!((_a = image.dataUrl) === null || _a === void 0 ? void 0 : _a.startsWith('data:image/'))) {
                                            throw new Error('Invalid image data');
                                        }
                                        extension = getImageExtension(image.dataUrl);
                                        fileName = "".concat(kind, "-").concat(String(index + 1).padStart(2, '0'), ".").concat(extension);
                                        outputPath = path.join(assetDir, fileName);
                                        base64 = image.dataUrl.split(',')[1];
                                        return [4 /*yield*/, fs.writeFile(outputPath, Buffer.from(base64, 'base64'))];
                                    case 1:
                                        _b.sent();
                                        return [2 /*return*/, {
                                                id: image.id,
                                                name: image.name,
                                                width: image.width,
                                                height: image.height,
                                                size: image.size,
                                                url: "/share-assets/".concat(shareId, "/").concat(fileName)
                                            }];
                                }
                            });
                        }); }))];
            }
        });
    });
}
function localScreenshotSaver() {
    return {
        name: 'local-preview-services',
        configureServer: function (server) {
            var _this = this;
            var sharesDir = path.resolve(process.cwd(), 'temp-shares');
            server.middlewares.use('/api/shares', function (request, response, next) { return __awaiter(_this, void 0, void 0, function () {
                var requestUrl, shareIdMatch, payload, _a, _b, id, createdAt, expiresAt, shareDir, galleryImages, aplusImages, record, error_1, id, recordPath, record, _c, _d, _e;
                var _f, _g;
                return __generator(this, function (_h) {
                    switch (_h.label) {
                        case 0:
                            requestUrl = request.url || '';
                            shareIdMatch = requestUrl.match(/^\/([^/?#]+)/);
                            if (!(request.method === 'POST' && (requestUrl === '/' || requestUrl === ''))) return [3 /*break*/, 10];
                            _h.label = 1;
                        case 1:
                            _h.trys.push([1, 8, , 9]);
                            return [4 /*yield*/, cleanupExpiredShares(sharesDir)];
                        case 2:
                            _h.sent();
                            _b = (_a = JSON).parse;
                            return [4 /*yield*/, readRequestBody(request)];
                        case 3:
                            payload = _b.apply(_a, [_h.sent()]);
                            id = createServerShareId();
                            createdAt = new Date();
                            expiresAt = new Date(createdAt.getTime() + SHARE_TTL_MS);
                            shareDir = path.join(sharesDir, id);
                            return [4 /*yield*/, fs.mkdir(shareDir, { recursive: true })];
                        case 4:
                            _h.sent();
                            return [4 /*yield*/, saveShareImages(shareDir, id, 'gallery', (_f = payload.galleryImages) !== null && _f !== void 0 ? _f : [])];
                        case 5:
                            galleryImages = _h.sent();
                            return [4 /*yield*/, saveShareImages(shareDir, id, 'aplus', (_g = payload.aplusImages) !== null && _g !== void 0 ? _g : [])];
                        case 6:
                            aplusImages = _h.sent();
                            record = {
                                id: id,
                                createdAt: createdAt.toISOString(),
                                expiresAt: expiresAt.toISOString(),
                                listing: payload.listing,
                                settings: payload.settings,
                                galleryImages: galleryImages,
                                aplusImages: aplusImages
                            };
                            return [4 /*yield*/, fs.writeFile(path.join(shareDir, 'share.json'), JSON.stringify(record, null, 2), 'utf8')];
                        case 7:
                            _h.sent();
                            sendJson(response, 200, { ok: true, id: id, url: "/p/".concat(id), expiresAt: record.expiresAt });
                            return [3 /*break*/, 9];
                        case 8:
                            error_1 = _h.sent();
                            sendJson(response, 500, {
                                ok: false,
                                error: error_1 instanceof Error ? error_1.message : 'Create share failed'
                            });
                            return [3 /*break*/, 9];
                        case 9: return [2 /*return*/];
                        case 10:
                            if (!(request.method === 'GET' && (shareIdMatch === null || shareIdMatch === void 0 ? void 0 : shareIdMatch[1]))) return [3 /*break*/, 18];
                            _h.label = 11;
                        case 11:
                            _h.trys.push([11, 16, , 17]);
                            return [4 /*yield*/, cleanupExpiredShares(sharesDir)];
                        case 12:
                            _h.sent();
                            id = path.basename(shareIdMatch[1]);
                            recordPath = path.join(sharesDir, id, 'share.json');
                            _d = (_c = JSON).parse;
                            return [4 /*yield*/, fs.readFile(recordPath, 'utf8')];
                        case 13:
                            record = _d.apply(_c, [_h.sent()]);
                            if (!(record.expiresAt && new Date(record.expiresAt).getTime() <= Date.now())) return [3 /*break*/, 15];
                            return [4 /*yield*/, fs.rm(path.join(sharesDir, id), { recursive: true, force: true })];
                        case 14:
                            _h.sent();
                            sendJson(response, 410, { ok: false, error: 'Share expired' });
                            return [2 /*return*/];
                        case 15:
                            sendJson(response, 200, { ok: true, share: record });
                            return [3 /*break*/, 17];
                        case 16:
                            _e = _h.sent();
                            sendJson(response, 404, { ok: false, error: 'Share not found' });
                            return [3 /*break*/, 17];
                        case 17: return [2 /*return*/];
                        case 18:
                            next();
                            return [2 /*return*/];
                    }
                });
            }); });
            server.middlewares.use('/share-assets', function (request, response, next) { return __awaiter(_this, void 0, void 0, function () {
                var parts, shareId, fileName, safeShareId, safeFileName, filePath, file, extension, contentType, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (request.method !== 'GET') {
                                next();
                                return [2 /*return*/];
                            }
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 4, , 5]);
                            return [4 /*yield*/, cleanupExpiredShares(sharesDir)];
                        case 2:
                            _b.sent();
                            parts = (request.url || '').split('/').filter(Boolean);
                            shareId = parts[0], fileName = parts[1];
                            if (!shareId || !fileName) {
                                next();
                                return [2 /*return*/];
                            }
                            safeShareId = path.basename(shareId);
                            safeFileName = path.basename(fileName);
                            filePath = path.join(sharesDir, safeShareId, 'assets', safeFileName);
                            return [4 /*yield*/, fs.readFile(filePath)];
                        case 3:
                            file = _b.sent();
                            extension = path.extname(safeFileName).toLowerCase();
                            contentType = extension === '.jpg' || extension === '.jpeg'
                                ? 'image/jpeg'
                                : extension === '.webp'
                                    ? 'image/webp'
                                    : 'image/png';
                            response.setHeader('Content-Type', contentType);
                            response.end(file);
                            return [3 /*break*/, 5];
                        case 4:
                            _a = _b.sent();
                            response.statusCode = 404;
                            response.end('Not found');
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            }); });
            server.middlewares.use('/api/save-screenshot', function (request, response, next) {
                if (request.method !== 'POST') {
                    next();
                    return;
                }
                var body = '';
                request.setEncoding('utf8');
                request.on('data', function (chunk) {
                    body += chunk;
                });
                request.on('end', function () { return __awaiter(_this, void 0, void 0, function () {
                    var payload, safeFileName, outputDir, outputPath, base64, error_2;
                    var _a;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                _b.trys.push([0, 3, , 4]);
                                payload = JSON.parse(body);
                                if (!((_a = payload.dataUrl) === null || _a === void 0 ? void 0 : _a.startsWith('data:image/png;base64,'))) {
                                    response.statusCode = 400;
                                    response.end(JSON.stringify({ ok: false, error: 'Invalid PNG data' }));
                                    return [2 /*return*/];
                                }
                                safeFileName = path
                                    .basename(payload.fileName || "amazon-mobile-preview-".concat(Date.now(), ".png"))
                                    .replace(/[^a-zA-Z0-9._-]/g, '_');
                                outputDir = path.resolve(process.cwd(), 'exports');
                                outputPath = path.join(outputDir, safeFileName);
                                base64 = payload.dataUrl.split(',')[1];
                                return [4 /*yield*/, fs.mkdir(outputDir, { recursive: true })];
                            case 1:
                                _b.sent();
                                return [4 /*yield*/, fs.writeFile(outputPath, Buffer.from(base64, 'base64'))];
                            case 2:
                                _b.sent();
                                response.setHeader('Content-Type', 'application/json');
                                response.end(JSON.stringify({ ok: true, path: outputPath.replace(/\\/g, '/') }));
                                return [3 /*break*/, 4];
                            case 3:
                                error_2 = _b.sent();
                                response.statusCode = 500;
                                response.end(JSON.stringify({
                                    ok: false,
                                    error: error_2 instanceof Error ? error_2.message : 'Save failed'
                                }));
                                return [3 /*break*/, 4];
                            case 4: return [2 /*return*/];
                        }
                    });
                }); });
            });
        }
    };
}
export default defineConfig({
    plugins: [react(), localScreenshotSaver()]
});
