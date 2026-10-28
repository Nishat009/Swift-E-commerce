'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { CreditCard, Smartphone, Banknote, Lock, PlugZap, Save, AlertTriangle } from 'lucide-react';
import { SectionLoading, useSectionLoad } from './AdminSection';
import { errMsg } from './adminUtils';

type Gateway = 'cod' | 'bkash' | 'card';
interface CredentialInfo { set: boolean; source: '' | 'admin' | 'env'; hint: string; envName: string }
interface Settings {
  cod: { enabled: boolean };
  bkash: { enabled: boolean; mode: '' | 'sandbox' | 'live'; effectiveMode: string; credentials: Record<string, CredentialInfo> };
  card: { enabled: boolean; testMode: boolean; credentials: Record<string, CredentialInfo> };
  bdtPerUsd: number;
  bdtPerUsdSource: 'admin' | 'env';
  available: Record<Gateway, boolean>;
  mock: boolean;
  canEdit: boolean;
  canStoreCredentials: boolean;
  updatedAt: string | null;
  updatedByName: string;
}

const CREDENTIAL_FIELDS: Record<'bkash' | 'card', { field: string; label: string; placeholder: string }[]> = {
  bkash: [
    { field: 'appKey', label: 'App key', placeholder: 'bKash app key' },
    { field: 'appSecret', label: 'App secret', placeholder: 'bKash app secret' },
    { field: 'username', label: 'Username', placeholder: 'Merchant username' },
    { field: 'password', label: 'Password', placeholder: 'Merchant password' },
  ],
  card: [
    { field: 'secretKey', label: 'Secret key', placeholder: 'sk_test_... or sk_live_...' },
    { field: 'webhookSecret', label: 'Webhook signing secret (optional)', placeholder: 'whsec_...' },
  ],
};

const GATEWAYS: { id: Gateway; name: string; text: string; icon: typeof CreditCard }[] = [
  { id: 'cod', name: 'Cash on delivery', text: 'The customer pays the courier. Delivery charge depends on the zone.', icon: Banknote },
  { id: 'bkash', name: 'bKash', text: 'Tokenized checkout. Prices are converted from USD to Taka.', icon: Smartphone },
  { id: 'card', name: 'Card (Stripe Checkout)', text: 'Visa, Mastercard and more through Stripe-hosted checkout.', icon: CreditCard },
];

/** Payment gateways: switch each on or off, save API keys (write-only) and test the connection. */
export default function PaymentSettingsAdmin() {
  const toast = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [enabled, setEnabled] = useState<Record<Gateway, boolean>>({ cod: true, bkash: true, card: true });
  const [bkashMode, setBkashMode] = useState<'' | 'sandbox' | 'live'>('');
  const [rate, setRate] = useState('');
  // New credential values typed by the admin; null = clear the saved one
  const [drafts, setDrafts] = useState<Record<string, string | null>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<Gateway | null>(null);

  const apply = (data: Settings) => {
    setSettings(data);
    setEnabled({ cod: data.cod.enabled, bkash: data.bkash.enabled, card: data.card.enabled });
    setBkashMode(data.bkash.mode);
    setRate(data.bdtPerUsdSource === 'admin' ? String(data.bdtPerUsd) : '');
    setDrafts({});
  };

  const loading = useSectionLoad(async () => {
    const res = await apiClient.get('/admin/payment-settings');
    if (res.data?.success) apply(res.data.data);
  });

  if (loading || !settings) return <SectionLoading />;
  const canEdit = settings.canEdit;

  const save = async () => {
    const body: any = {
      cod: { enabled: enabled.cod },
      bkash: { enabled: enabled.bkash, mode: bkashMode, credentials: {} },
      card: { enabled: enabled.card, credentials: {} },
      bdtPerUsd: rate.trim() ? Number(rate) : null,
    };
    Object.entries(drafts).forEach(([key, value]) => {
      const [gateway, field] = key.split('.');
      if (value === null || (typeof value === 'string' && value.trim())) body[gateway].credentials[field] = value;
    });
    setSaving(true);
    try {
      const res = await apiClient.put('/admin/payment-settings', body);
      apply(res.data.data);
      toast.success('Payment settings saved.');
    } catch (err) {
      toast.error(errMsg(err, 'Could not save the payment settings.'));
    } finally {
      setSaving(false);
    }
  };

  const test = async (gateway: Gateway) => {
    setTesting(gateway);
    try {
      const res = await apiClient.post(`/admin/payment-settings/test/${gateway}`);
      toast.success(res.data?.message || 'Connected.');
    } catch (err) {
      toast.error(errMsg(err, 'Connection failed.'));
    } finally {
      setTesting(null);
    }
  };

  const dirty =
    Object.keys(drafts).length > 0 ||
    enabled.cod !== settings.cod.enabled || enabled.bkash !== settings.bkash.enabled || enabled.card !== settings.card.enabled ||
    bkashMode !== settings.bkash.mode ||
    rate !== (settings.bdtPerUsdSource === 'admin' ? String(settings.bdtPerUsd) : '');

  return (
    <div className="space-y-6">
      <div className="border-b pb-3.5 dark:border-gray-800">
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Payment Settings</h2>
        <p className="text-xs text-gray-500 mt-1">
          Choose which payment methods checkout offers and connect the gateways. Saved keys are encrypted and never shown again;
          a key left empty uses the server environment value.
        </p>
      </div>

      {!canEdit && (
        <p className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/40 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-300">
          <Lock className="w-4 h-4 flex-shrink-0" /> View only: a super admin can change payment settings (the shared demo admin cannot).
        </p>
      )}
      {canEdit && !settings.canStoreCredentials && (
        <p className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/40 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-300">
          <Lock className="w-4 h-4 flex-shrink-0" /> Saving gateway keys needs PAYMENT_SETTINGS_KEY on the server. Switches and the Taka rate work without it, and keys from the server environment are still used.
        </p>
      )}
      {settings.mock && (
        <p className="flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900/40 px-4 py-2.5 text-xs text-blue-900 dark:text-blue-300">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> Mock payments are on (development): bKash and card use a fake gateway.
        </p>
      )}

      {GATEWAYS.map(({ id, name, text, icon: Icon }) => {
        const live = settings.available[id];
        const fields = id === 'cod' ? [] : CREDENTIAL_FIELDS[id];
        const creds = id === 'cod' ? {} : settings[id].credentials;
        return (
          <section key={id} className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="w-10 h-10 rounded-xl bg-[#8b6f47]/10 text-[#8b6f47] dark:text-[#c9a96b] flex items-center justify-center"><Icon className="w-5 h-5" /></span>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {name}
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${live ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {live ? 'Live at checkout' : enabled[id] && id !== 'cod' ? 'Needs keys' : 'Off'}
                    </span>
                    {id === 'card' && settings.card.testMode && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700">Test mode</span>}
                    {id === 'bkash' && settings.bkash.credentials.appKey?.set && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-700 capitalize">{settings.bkash.effectiveMode}</span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">{text}</p>
                </div>
              </div>
              <label className={`flex items-center gap-2 text-xs font-bold ${canEdit ? 'cursor-pointer' : 'opacity-60'}`}>
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={enabled[id]}
                  disabled={!canEdit}
                  onChange={(e) => setEnabled({ ...enabled, [id]: e.target.checked })}
                />
                <span className="relative w-10 h-6 rounded-full bg-gray-300 dark:bg-gray-700 peer-checked:bg-[#8b6f47] transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-[#8b6f47]/50" />
                {enabled[id] ? 'Enabled' : 'Disabled'}
              </label>
            </div>

            {id === 'bkash' && (
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block text-xs">
                  <span className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Environment</span>
                  <select
                    value={bkashMode}
                    disabled={!canEdit}
                    onChange={(e) => setBkashMode(e.target.value as typeof bkashMode)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                  >
                    <option value="">From server setting ({settings.bkash.effectiveMode})</option>
                    <option value="sandbox">Sandbox (testing)</option>
                    <option value="live">Live (real money)</option>
                  </select>
                </label>
                <label className="block text-xs">
                  <span className="block font-medium text-gray-700 dark:text-gray-300 mb-1">Taka per US dollar</span>
                  <input
                    type="number"
                    min={1}
                    step="0.01"
                    value={rate}
                    disabled={!canEdit}
                    placeholder={`${settings.bdtPerUsd} (server setting)`}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                  />
                </label>
              </div>
            )}

            {fields.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-4">
                {fields.map(({ field, label, placeholder }) => {
                  const key = `${id}.${field}`;
                  const info = creds[field];
                  const cleared = drafts[key] === null;
                  return (
                    <div key={field} className="text-xs">
                      <Input
                        label={label}
                        type="password"
                        autoComplete="new-password"
                        disabled={!canEdit}
                        value={typeof drafts[key] === 'string' ? (drafts[key] as string) : ''}
                        placeholder={info?.set && !cleared ? `Saved ${info.hint} (type to replace)` : placeholder}
                        onChange={(e) => setDrafts({ ...drafts, [key]: e.target.value })}
                        className="text-sm"
                      />
                      <div className="mt-1 flex items-center justify-between text-[10px] text-gray-400">
                        <span>
                          {cleared ? 'Will be cleared on save' :
                            info?.source === 'admin' ? 'Saved in admin panel' :
                            info?.source === 'env' ? `From server (${info.envName})` : 'Not set'}
                        </span>
                        {canEdit && info?.source === 'admin' && !cleared && (
                          <button type="button" onClick={() => setDrafts({ ...drafts, [key]: null })} className="font-bold text-red-500 hover:underline">Clear</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {id !== 'cod' && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => test(id)}
                  disabled={testing !== null || !creds[fields[0].field]?.set}
                  className="text-xs font-bold flex items-center gap-1.5"
                  title={dirty ? 'Tests the saved settings; save your changes first' : undefined}
                >
                  <PlugZap className="w-3.5 h-3.5" /> {testing === id ? 'Testing...' : 'Test connection'}
                </Button>
              </div>
            )}
          </section>
        );
      })}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[11px] text-gray-400">
          {settings.updatedAt ? `Last changed ${new Date(settings.updatedAt).toLocaleString()}${settings.updatedByName ? ` by ${settings.updatedByName}` : ''}` : 'Using server defaults'}
        </span>
        {canEdit && (
          <Button onClick={save} disabled={saving || !dirty} className="text-xs font-bold flex items-center gap-1.5">
            <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save changes'}
          </Button>
        )}
      </div>
    </div>
  );
}
