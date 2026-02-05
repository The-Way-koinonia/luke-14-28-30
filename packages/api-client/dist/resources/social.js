"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialResource = void 0;
class SocialResource {
    constructor(client) {
        this.client = client;
    }
    async getPosts(page = 1, limit = 20) {
        return this.client.fetch(`/social/posts?page=${page}&limit=${limit}`);
    }
    async createPost(content) {
        return this.client.fetch('/social/posts', {
            method: 'POST',
            body: JSON.stringify({ content }),
        });
    }
    async likePost(postId) {
        return this.client.fetch(`/social/likes`, {
            method: 'POST',
            body: JSON.stringify({ postId }),
        });
    }
}
exports.SocialResource = SocialResource;
//# sourceMappingURL=social.js.map