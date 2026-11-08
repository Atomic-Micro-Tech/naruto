let csrf = "";
export function setSession(session) {
  csrf = session?.csrfToken ?? "";
}
export async function api(
  path,
  { method = "GET", body, idempotent = false } = {},
) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET" && csrf) headers["X-CSRF-Token"] = csrf;
  if (idempotent) headers["Idempotency-Key"] = crypto.randomUUID();
  const response = await fetch("/v1" + path, {
    method,
    headers,
    credentials: "include",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response
    .json()
    .catch(() => ({ message: "Server tidak memberikan JSON." }));
  if (!response.ok) {
    const error = new Error(result.message ?? "Layanan belum tersedia.");
    error.status = response.status;
    error.code = result.code;
    throw error;
  }
  return result.data ?? result;
}

export class Connection extends EventTarget {
  constructor() {
    super();
    this.pending = new Map();
    this.closed = false;
    this.retry = 0;
  }
  emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }
  async connect() {
    if (this.closed) return;
    try {
      const ticket = await api("/ws-ticket", { method: "POST" });
      if (this.closed) return;
      const url = new URL(ticket.path, location.href);
      url.protocol = location.protocol === "https:" ? "wss:" : "ws:";
      url.searchParams.set("ticket", ticket.ticket);
      const socket = (this.socket = new WebSocket(url, ticket.protocol));
      socket.onmessage = (event) => {
        if (this.closed) return;
        const message = JSON.parse(event.data),
          payload = message.payload;
        if (message.type === "connection.ready") {
          this.retry = 0;
          this.emit("status", "connected");
        }
        if (
          message.type === "command.ack" ||
          message.type === "command.rejected"
        ) {
          const pending = this.pending.get(payload.requestId);
          if (pending) {
            clearTimeout(pending.timer);
            this.pending.delete(payload.requestId);
            if (message.type === "command.ack") pending.resolve(payload);
            else
              pending.reject(
                Object.assign(new Error(payload.message ?? payload.code), {
                  code: payload.code,
                }),
              );
          }
        }
        this.emit(message.type, payload);
      };
      socket.onclose = (event) => {
        for (const p of this.pending.values()) {
          clearTimeout(p.timer);
          p.reject(
            new Error("Koneksi terputus. State akan disinkronkan kembali."),
          );
        }
        this.pending.clear();
        if (this.closed) return;
        this.emit("status", "disconnected");
        if (event.code === 1008) {
          this.closed = true;
          this.emit(
            "expired",
            "Sesi diganti atau berakhir. Masuk kembali untuk melanjutkan.",
          );
          return;
        }
        if (!this.closed)
          this.timer = setTimeout(
            () => this.connect(),
            Math.min(10000, 500 * 2 ** this.retry++),
          );
      };
      socket.onerror = () => socket.close();
    } catch (error) {
      if (this.closed) return;
      if (error.status === 401) {
        this.emit("expired", "Sesi berakhir. Silakan masuk kembali.");
        return;
      }
      this.emit("status", "disconnected");
      this.timer = setTimeout(
        () => this.connect(),
        Math.min(10000, 500 * 2 ** this.retry++),
      );
    }
  }
  send(type, payload) {
    if (this.socket?.readyState !== WebSocket.OPEN)
      return Promise.reject(new Error("Menunggu koneksi ke server."));
    const requestId = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(requestId);
        reject(
          new Error(
            "Respons terlambat. Sinkronkan state sebelum mencoba lagi.",
          ),
        );
      }, 12000);
      this.pending.set(requestId, { resolve, reject, timer });
      this.socket.send(
        JSON.stringify({ protocolVersion: 1, requestId, type, payload }),
      );
    });
  }
  close() {
    this.closed = true;
    clearTimeout(this.timer);
    this.socket?.close();
  }
}
