"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClient = void 0;
const social_1 = require("./resources/social");
const database_1 = require("./resources/database");
class ApiClient {
    constructor(config) {
        this.config = config;
        this.social = new social_1.SocialResource(this);
        this.database = new database_1.DatabaseResource(this);
    }
    setAuthToken(token) {
        this.config.authToken = token;
    }
    async fetch(path, options = {}) {
        const url = `${this.config.baseUrl}${path}`;
        const headers = Object.assign(Object.assign({ 'Content-Type': 'application/json' }, (this.config.authToken ? { Authorization: `Bearer ${this.config.authToken}` } : {})), options.headers);
        const response = await fetch(url, Object.assign(Object.assign({}, options), { headers }));
        if (!response.ok) {
            // Try to parse error message
            let errorMessage = `API Error: ${response.status} ${response.statusText}`;
            try {
                const errorJson = await response.json();
                if (errorJson.message)
                    errorMessage = errorJson.message;
            }
            catch (_a) { }
            throw new Error(errorMessage);
        }
        if (response.status === 204) {
            return {};
        }
        return response.json();
    }
}
exports.ApiClient = ApiClient;
//# sourceMappingURL=client.js.map