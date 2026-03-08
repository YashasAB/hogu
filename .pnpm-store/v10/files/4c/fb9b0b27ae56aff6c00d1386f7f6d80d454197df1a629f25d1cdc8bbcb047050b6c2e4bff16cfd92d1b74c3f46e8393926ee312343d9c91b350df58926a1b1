"use strict";
// File generated from our OpenAPI spec by Stainless. See CONTRIBUTING.md for details.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Watch = void 0;
const resource_1 = require("../resource.js");
class Watch extends resource_1.APIResource {
    /**
     * Predict the outcome of a verification based on Prelude’s anti-fraud system.
     */
    predict(body, options) {
        return this._client.post('/v2/watch/predict', { body, ...options });
    }
    /**
     * Send real-time event data from end-user interactions within your application.
     * Events will be analyzed for proactive fraud prevention and risk scoring.
     */
    sendEvents(body, options) {
        return this._client.post('/v2/watch/event', { body, ...options });
    }
    /**
     * Send feedback regarding your end-users verification funnel. Events will be
     * analyzed for proactive fraud prevention and risk scoring.
     */
    sendFeedbacks(body, options) {
        return this._client.post('/v2/watch/feedback', { body, ...options });
    }
}
exports.Watch = Watch;
//# sourceMappingURL=watch.js.map