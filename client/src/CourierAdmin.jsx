import { useEffect, useState } from "react";
import { Check, KeyRound, Truck } from "lucide-react";
import { getCouriers, saveCourier } from "./api";

const credentialFields = [
  ["apiKey", "API key or access token", "password"],
  ["clientId", "Client ID", "text"],
  ["clientSecret", "Client secret", "password"],
  ["username", "Username", "text"],
  ["password", "Password", "password"],
  ["baseUrl", "API base URL (optional)", "url"]
];

export default function CourierAdmin() {
  const [providers, setProviders] = useState([]);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const activeProvider = providers.find(provider => provider.id === selected);

  async function refresh() {
    try {
      const result = await getCouriers();
      setProviders(result);
      setSelected(current => result.some(provider => provider.id === current) ? current : result[0]?.id || "");
      setError("");
    } catch (requestError) { setError(requestError.message); }
  }

  useEffect(() => { refresh(); }, []);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const values = Object.fromEntries(credentialFields.map(([key]) => [key, String(form.get(key) || "").trim()]));
    try {
      await saveCourier(selected, { ...values, enabled: form.get("enabled") === "on" });
      setNotice(`${activeProvider?.name} settings saved. Credentials are encrypted and cannot be viewed here.`);
      formElement.reset();
      await refresh();
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }

  return <div className="courier-admin"><div className="courier-admin-heading"><div><span className="eyebrow">DELIVERY OPERATIONS</span><h2>Courier integrations</h2><p>Add provider credentials for your store. Select an enabled courier on each order.</p></div><span className="courier-secure-label"><KeyRound size={14}/> Encrypted at rest</span></div>{error && <p className="notice">{error}</p>}{notice && <p className="register-success">{notice}</p>}<div className="courier-admin-layout"><nav className="courier-provider-list">{providers.map(provider => <button type="button" key={provider.id} className={selected === provider.id ? "active" : ""} onClick={() => setSelected(provider.id)}><span className="courier-provider-icon"><Truck size={16}/></span><span><b>{provider.name}</b><small>{provider.configured ? "Credentials saved" : "Not configured"}</small></span><i className={provider.enabled ? "enabled" : ""}/></button>)}</nav>{activeProvider && <form className="courier-config-form" onSubmit={submit}><div className="courier-config-title"><div><span className="eyebrow">PROVIDER CONFIGURATION</span><h3>{activeProvider.name}</h3><p>Enter credentials issued for your {activeProvider.name} merchant account.</p></div><span className={`courier-config-status ${activeProvider.enabled ? "enabled" : ""}`}>{activeProvider.enabled ? "Enabled" : "Disabled"}</span></div><div className="courier-credential-grid">{credentialFields.map(([name, label, type]) => <label key={name}>{label}<input name={name} type={type} autoComplete="off" placeholder={name === "apiKey" && activeProvider.configured ? "Saved securely; leave blank to keep" : "Enter value"}/></label>)}</div><label className="courier-enable"><input type="checkbox" name="enabled" defaultChecked={activeProvider.enabled}/> Enable this courier for order assignment</label><p className="courier-secret-help">Credentials are encrypted in the store record. They are never sent back to the browser. Leave credential fields blank to retain saved values.</p><button className="admin-primary" disabled={saving}>{saving ? "Saving…" : "Save courier settings"}<Check size={14}/></button></form>}</div></div>;
}
