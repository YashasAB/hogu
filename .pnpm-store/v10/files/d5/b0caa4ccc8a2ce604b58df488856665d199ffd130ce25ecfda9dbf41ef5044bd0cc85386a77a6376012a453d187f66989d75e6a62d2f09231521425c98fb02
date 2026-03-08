"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Verification = void 0;
const resource_1 = require("../resource.js");
class Verification extends resource_1.APIResource {
    /**
     * Create a new verification for a specific phone number. If another non-expired
     * verification exists (the request is performed within the verification window),
     * this endpoint will perform a retry instead.
     */
    create(body, options) {
        return this._client.post('/v2/verification', { body, ...options });
    }
    /**
     * Check the validity of a verification code.
     */
    check(body, options) {
        return this._client.post('/v2/verification/check', { body, ...options });
    }
}
exports.Verification = Verification;
//# sourceMappingURL=verification.js.map