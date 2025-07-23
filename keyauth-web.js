export default class KeyAuth {
  constructor(app) {
    this.name = app.name;
    this.ownerid = app.ownerid;
    this.version = app.version;
    this.url = "https://keyauth.win/api/1.3/";
    this.sessionid = "";
    this.initialized = false;
    this.user_data = {};
    this.app_data = {};
  }

  async init() {
    if (this.initialized) return;

    const res = await this.#request({
      type: "init",
      name: this.name,
      ownerid: this.ownerid,
      version: this.version
    });

    if (!res.success) throw new Error(res.message);
    this.sessionid = res.sessionid;
    this.initialized = true;
  }

  login = (u, p, code) =>
    this.#auth("login", { username: u, pass: p, code });

  register = (u, p, key) =>
    this.#auth("register", { username: u, pass: p, key });

  license = key => this.#auth("license", { key });

  upgrade = (u, key) => this.#auth("upgrade", { username: u, key });

  async fetchStats() {
    this.#assertInit();
    const res = await this.#request({
      type: "fetchStats",
      name: this.name,
      ownerid: this.ownerid,
      sessionid: this.sessionid
    });

    if (res.success) this.#setAppData(res.appinfo);
  }

  async #auth(type, extra) {
    this.#assertInit();
    const res = await this.#request({
      type,
      name: this.name,
      ownerid: this.ownerid,
      sessionid: this.sessionid,
      hwid: await this.#hwid(),
      ...extra
    });

    if (!res.success) throw new Error(res.message);
    this.#setUserData(res.info);
    return res;
  }

  async #request(body) {
    const r = await fetch(this.url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(body).toString()
    });

    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }

  #assertInit() {
    if (!this.initialized || !this.sessionid)
      throw new Error("KeyAuth not initialised");
  }

  async #hwid() {
    const msg = `${navigator.userAgent}|${navigator.platform}`;
    const enc = new TextEncoder().encode(msg);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return [...new Uint8Array(buf)]
      .map(x => x.toString(16).padStart(2, "0"))
      .join("");
  }

  #setUserData(d) {
    this.user_data = {
      username: d.username,
      ip: d.ip,
      hwid: d.hwid ?? "N/A",
      createdate: d.createdate,
      lastlogin: d.lastlogin,
      expires: d.subscriptions?.[0]?.expiry ?? 0,
      subscriptions: d.subscriptions ?? []
    };
  }

  #setAppData(d) {
    this.app_data = {
      numUsers: d.numUsers,
      numKeys: d.numKeys,
      app_ver: d.version,
      customer_panel: d.customerPanelLink,
      onlineUsers: d.numOnlineUsers
    };
  }
}
