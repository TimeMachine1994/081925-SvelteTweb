import "clsx";
class CasesStore {
  cases = [];
  currentCase = null;
  loading = false;
  error = null;
  async fetchCases() {
    this.loading = true;
    this.error = null;
    try {
      const response = await fetch("/api/cases");
      if (!response.ok) throw new Error("Failed to fetch cases");
      const data = await response.json();
      this.cases = data.cases || [];
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Unknown error";
    } finally {
      this.loading = false;
    }
  }
  async fetchCase(id) {
    this.loading = true;
    this.error = null;
    try {
      const response = await fetch(`/api/cases?id=${id}`);
      if (!response.ok) throw new Error("Failed to fetch case");
      const data = await response.json();
      this.currentCase = data.case;
      return data.case;
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Unknown error";
      return null;
    } finally {
      this.loading = false;
    }
  }
  async createCase(caseData) {
    this.loading = true;
    this.error = null;
    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(caseData)
      });
      if (!response.ok) throw new Error("Failed to create case");
      const data = await response.json();
      await this.fetchCases();
      return { success: true, case: data.case };
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Failed to create case";
      return { success: false, error: this.error };
    } finally {
      this.loading = false;
    }
  }
  async updateCase(id, updates) {
    this.loading = true;
    this.error = null;
    try {
      const response = await fetch(`/api/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error("Failed to update case");
      await this.fetchCases();
      if (this.currentCase?.case.id === id) {
        await this.fetchCase(id);
      }
      return { success: true };
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Failed to update case";
      return { success: false, error: this.error };
    } finally {
      this.loading = false;
    }
  }
  async deleteCase(id) {
    this.loading = true;
    this.error = null;
    try {
      const response = await fetch(`/api/cases/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete case");
      await this.fetchCases();
      if (this.currentCase?.case.id === id) {
        this.currentCase = null;
      }
      return { success: true };
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Failed to delete case";
      return { success: false, error: this.error };
    } finally {
      this.loading = false;
    }
  }
}
const casesStore = new CasesStore();
class ApiError extends Error {
  constructor(status, message, data) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers
      }
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        errorData
      );
    }
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(0, error instanceof Error ? error.message : "Network error");
  }
}
const api = {
  get: (url, options) => apiRequest(url, { ...options, method: "GET" }),
  post: (url, data, options) => apiRequest(url, {
    ...options,
    method: "POST",
    body: data ? JSON.stringify(data) : void 0
  }),
  patch: (url, data, options) => apiRequest(url, {
    ...options,
    method: "PATCH",
    body: data ? JSON.stringify(data) : void 0
  }),
  delete: (url, options) => apiRequest(url, { ...options, method: "DELETE" })
};
class MessagesStore {
  messages = [];
  loading = false;
  error = null;
  unreadCounts = { total: 0, byCaseId: {}, uncategorized: 0 };
  pollingInterval = null;
  lastPollTime = null;
  async fetchMessages(caseId, uncategorized = false) {
    this.loading = true;
    this.error = null;
    try {
      const params = new URLSearchParams();
      if (caseId) params.set("caseId", caseId);
      if (uncategorized) params.set("uncategorized", "true");
      const result = await api.get(`/api/messages?${params.toString()}`);
      this.messages = result.messages;
      this.lastPollTime = /* @__PURE__ */ new Date();
    } catch (err) {
      this.error = err.message || "Failed to fetch messages";
      console.error("Fetch messages error:", err);
    } finally {
      this.loading = false;
    }
  }
  async sendMessage(caseId, content, recipientId) {
    try {
      await api.post("/api/messages/send", { caseId, recipientId, content });
      if (caseId) {
        await this.fetchMessages(caseId);
      } else {
        await this.fetchMessages(void 0, true);
      }
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.message || "Failed to send message"
      };
    }
  }
  async sendMessageWithAttachment(caseId, content, file, recipientId) {
    try {
      const formData = new FormData();
      if (caseId) formData.append("caseId", caseId);
      if (recipientId) formData.append("recipientId", recipientId);
      formData.append("content", content);
      formData.append("file", file);
      const response = await fetch("/api/messages/send", { method: "POST", body: formData });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to send message with attachment");
      }
      if (caseId) {
        await this.fetchMessages(caseId);
      } else {
        await this.fetchMessages(void 0, true);
      }
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.message || "Failed to send message with attachment"
      };
    }
  }
  async markAsRead(messageIds) {
    try {
      await api.post("/api/messages/mark-read", { messageIds });
      this.messages = this.messages.map((item) => {
        if (messageIds.includes(item.message.id)) {
          return {
            ...item,
            message: { ...item.message, readAt: /* @__PURE__ */ new Date() }
          };
        }
        return item;
      });
      await this.fetchUnreadCounts();
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  }
  async fetchUnreadCounts() {
    try {
      const result = await api.get("/api/messages/unread");
      this.unreadCounts = result;
    } catch (err) {
      console.error("Fetch unread counts error:", err);
    }
  }
  startPolling(caseId, interval = 5e3) {
    this.stopPolling();
    this.pollingInterval = window.setInterval(
      async () => {
        if (!this.lastPollTime) return;
        try {
          const params = new URLSearchParams({ since: this.lastPollTime.toISOString() });
          if (caseId) params.set("caseId", caseId);
          const result = await api.get(`/api/messages/poll?${params.toString()}`);
          if (result.count > 0) {
            this.messages = [...this.messages, ...result.messages];
            this.lastPollTime = /* @__PURE__ */ new Date();
            await this.fetchUnreadCounts();
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      },
      interval
    );
  }
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
  getUnreadCount(caseId) {
    if (!caseId) return this.unreadCounts.uncategorized;
    return this.unreadCounts.byCaseId[caseId] || 0;
  }
}
const messagesStore = new MessagesStore();
export {
  casesStore as c,
  messagesStore as m
};
