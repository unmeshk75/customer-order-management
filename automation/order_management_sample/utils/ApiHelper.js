export class ApiHelper {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   */
  constructor(request) {
    this.request = request;
    this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  }

  async get(endpoint) {
    const res = await this.request.get(`${this.baseUrl}${endpoint}`);
    return await res.json().catch(() => ({}));
  }

  async post(endpoint, data) {
    const res = await this.request.post(`${this.baseUrl}${endpoint}`, { data });
    return await res.json().catch(() => ({}));
  }

  async delete(endpoint) {
    const res = await this.request.delete(`${this.baseUrl}${endpoint}`);
    return await res.json().catch(() => ({}));
  }
}
