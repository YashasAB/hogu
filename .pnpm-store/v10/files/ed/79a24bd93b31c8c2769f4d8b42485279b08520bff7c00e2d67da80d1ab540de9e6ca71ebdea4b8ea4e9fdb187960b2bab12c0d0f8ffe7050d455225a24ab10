// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
import { APIResource } from "../resource.mjs";
import { isRequestOptions } from "../core.mjs";
export class Lookup extends APIResource {
    lookup(phoneNumber, query = {}, options) {
        if (isRequestOptions(query)) {
            return this.lookup(phoneNumber, {}, query);
        }
        return this._client.get(`/v2/lookup/${phoneNumber}`, { query, ...options });
    }
}
//# sourceMappingURL=lookup.mjs.map