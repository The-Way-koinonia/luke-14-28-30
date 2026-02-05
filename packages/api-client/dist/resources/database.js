"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseResource = void 0;
class DatabaseResource {
    constructor(client) {
        this.client = client;
    }
    async checkForUpdates(currentVersion) {
        return this.client.fetch(`/database/updates?current_version=${currentVersion}`);
    }
}
exports.DatabaseResource = DatabaseResource;
//# sourceMappingURL=database.js.map