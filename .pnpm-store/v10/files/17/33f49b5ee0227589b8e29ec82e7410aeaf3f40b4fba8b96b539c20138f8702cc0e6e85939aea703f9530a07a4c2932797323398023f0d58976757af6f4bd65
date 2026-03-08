"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lookup = void 0;
const resource_1 = require("../resource.js");
const core_1 = require("../core.js");
class Lookup extends resource_1.APIResource {
    lookup(phoneNumber, query = {}, options) {
        if ((0, core_1.isRequestOptions)(query)) {
            return this.lookup(phoneNumber, {}, query);
        }
        return this._client.get(`/v2/lookup/${phoneNumber}`, { query, ...options });
    }
}
exports.Lookup = Lookup;
//# sourceMappingURL=lookup.js.map