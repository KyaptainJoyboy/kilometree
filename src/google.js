// Google Integrations module
// Handles auth and API calls for Calendar, Sheets, Forms (prefill via URL), Looker launch, YouTube upload.

export class GoogleIntegration {
  constructor({ onAuthChange } = {}) {
    this.onAuthChange = onAuthChange;
    this.config = this.loadConfig();
    this.tokenClient = null;
    this.accessToken = null;
    this.oauthScope = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/youtube.upload'
    ].join(' ');
  }

  loadConfig() {
    try {
      return JSON.parse(localStorage.getItem('googleConfig') || '{}');
    } catch {
      return {};
    }
  }

  saveConfig(config) {
    this.config = { ...this.config, ...config };
    localStorage.setItem('googleConfig', JSON.stringify(this.config));
  }

  initialize() {
    // no-op placeholder; gapi v3 deprecated; use token client for OAuth access token when needed
    // We lazily request tokens on first API action.
    if (this.onAuthChange) this.onAuthChange(!!this.accessToken);
  }

  async ensureToken() {
    if (this.accessToken && this.tokenExpiresAt && Date.now() < this.tokenExpiresAt - 60_000) return this.accessToken;
    if (!this.config.clientId) throw new Error('Missing OAuth Client ID');

    // Load Google Identity Services script dynamically
    await this.loadScript('https://accounts.google.com/gsi/client');

    return new Promise((resolve, reject) => {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.config.clientId,
        scope: this.oauthScope,
        callback: (response) => {
          if (response.error) {
            reject(response);
            return;
          }
          this.accessToken = response.access_token;
          // Access tokens last ~3600s; set a soft expiry
          this.tokenExpiresAt = Date.now() + 58 * 60 * 1000;
          this.onAuthChange?.(true);
          resolve(this.accessToken);
        }
      });
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }

  signIn() {
    this.accessToken = null; // force prompt
    return this.ensureToken();
  }

  signOut() {
    this.accessToken = null;
    this.onAuthChange?.(false);
  }

  getNextSaturday() {
    const d = new Date();
    const day = d.getDay();
    const diff = (6 - day + 7) % 7 || 7; // next Saturday (6)
    d.setDate(d.getDate() + diff);
    d.setHours(9, 0, 0, 0);
    return d;
  }

  async createCalendarEvent({ title, description, start, durationHours = 2 }) {
    const token = await this.ensureToken();
    const end = new Date(start.getTime() + durationHours * 3600000);
    const calendarId = this.config.calendarId || 'primary';
    const body = {
      summary: title,
      description,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() }
    };

    await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    }).then(this.assertOk);
  }

  async appendToSheet(row) {
    const token = await this.ensureToken();
    if (!this.config.sheetId) throw new Error('Missing Sheet ID');
    const values = [[row.date, row.totalSteps, row.totalSaplings, row.co2Kg, row.weeklyKm]];
    const range = 'Progress!A:E';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values })
    }).then(this.assertOk);
  }

  async submitFormResponse({ user, totalSaplings, weeklyKm }) {
    // Easiest path for client-side: open/POST to prefill URL if provided; else Apps Script webhook
    if (this.config.formPrefillUrl) {
      const url = new URL(this.config.formPrefillUrl);
      // Common param names; adjust to your form's entry IDs
      // Example: entry.123456 for name, entry.234567 for saplings, entry.345678 for weeklyKm
      // We append plain q params so user can map them in Apps Script if needed
      url.searchParams.set('user', user);
      url.searchParams.set('saplings', String(totalSaplings));
      url.searchParams.set('weeklyKm', String(weeklyKm));
      window.open(url.toString(), '_blank', 'noopener,noreferrer');
      return;
    }
    if (this.config.appsScriptWebAppUrl) {
      await fetch(this.config.appsScriptWebAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'form', user, totalSaplings, weeklyKm })
      }).then(this.assertOk);
      return;
    }
    throw new Error('Provide Form Prefill URL or Apps Script Web App URL in settings');
  }

  openLookerDashboard() {
    if (!this.config.lookerUrl) throw new Error('Missing Looker Studio URL');
    window.open(this.config.lookerUrl, '_blank', 'noopener,noreferrer');
  }

  async uploadYouTubeVideo({ file, title, description }) {
    const token = await this.ensureToken();
    const metadata = {
      snippet: { title, description },
      status: { privacyStatus: 'unlisted' }
    };

    const boundary = 'xxxxxxxxxx' + Math.random().toString(16).slice(2);
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelim = `\r\n--${boundary}--`;

    const body = new Blob([
      delimiter,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      JSON.stringify(metadata),
      '\r\n',
      delimiter,
      'Content-Type: video/*\r\n\r\n',
      file,
      closeDelim
    ], { type: `multipart/related; boundary=${boundary}` });

    const resp = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body
    });
    await this.assertOk(resp);
  }

  async autoSyncOnSave(payload) {
    if (!this.config.autoSync) return;
    try {
      await this.appendToSheet({
        date: new Date().toISOString().split('T')[0],
        totalSteps: payload.totalSteps,
        totalSaplings: payload.totalSaplings,
        co2Kg: payload.co2Kg,
        weeklyKm: payload.weeklyKm
      });
    } catch (e) {
      console.warn('Auto sync failed', e);
    }
    // Optional: trigger Apps Script reminders
    if (this.config.appsScriptWebAppUrl) {
      try {
        await fetch(this.config.appsScriptWebAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'reminder', payload })
        }).then(this.assertOk);
      } catch (e) {
        console.warn('Reminder hook failed', e);
      }
    }
  }

  async loadScript(src) {
    if (document.querySelector(`script[src="${src}"]`)) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async assertOk(response) {
    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Google API error ${response.status}: ${text}`);
    }
    return response;
  }
}


