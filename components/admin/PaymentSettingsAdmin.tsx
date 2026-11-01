'use client';

import React, { useState } from 'react';
import apiClient from '@/lib/apiClient';
import { useToast } from '@/context/ToastContext';
import { CreditCard, Smartphone, Banknote, Lock, PlugZap, Save, AlertTriangle, ChevronDown } from 'lucide-react';
import { SectionLoading, useSectionLoad } from './AdminSection';
import { errMsg } from './adminUtils';
import { AdminButton, Pill } from './AdminUI';

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

const labelCls = 'mb-1.5 block text-xs font-medium text-stone-600 dark:text-stone-300';
const fieldCls =
  'h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#8b6f47]/60 focus:outline-none focus:ring-2 focus:ring-[#8b6f47]/20 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-500 dark:text-stone-100 dark:[color-scheme:dark] dark:disabled:bg-white/[0.03]';

function Notice({ tone, icon: Icon, children }: { tone: 'warning' | 'info'; icon: typeof Lock; children: React.ReactNode }) {
  const toneCls = tone === 'warning'
    ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/[0.07] dark:text-amber-200'
    : 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-400/20 dark:bg-sky-400/[0.07] dark:text-sky-200';
  return (
    <p className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-xs leading-relaxed ${toneCls}`}>
      <Icon className="mt-px size-4 shrink-0" /> <span>{children}</span>
    </p>
  );
}

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
    <div className="space-y-5">
      <p className="max-w-3xl text-sm text-stone-500 dark:text-stone-400">
        Choose which payment methods checkout offers and connect the gateways. Saved keys are encrypted and never shown again;
        a key left empty uses the server environment value.
      </p>

      {(!canEdit || !settings.canStoreCredentials || settings.mock) && (
        <div className="space-y-2">
          {!canEdit && (
            <Notice tone="warning" icon={Lock}>View only: a super admin can change payment settings (the shared demo admin cannot).</Notice>
          )}
          {canEdit && !settings.canStoreCredentials && (
            <Notice tone="warning" icon={Lock}>
              Saving gateway keys needs PAYMENT_SETTINGS_KEY on the server. Switches and the Taka rate work without it, and keys from the server environment are still used.
            </Notice>
          )}
          {settings.mock && (
            <Notice tone="info" icon={AlertTriangle}>Mock payments are on (development): bKash and card use a fake gateway.</Notice>
          )}
        </div>
      )}

      {GATEWAYS.map(({ id, name, text, icon: Icon }) => {
        const live = settings.available[id];
        const fields = id === 'cod' ? [] : CREDENTIAL_FIELDS[id];
        const creds = id === 'cod' ? {} : settings[id].credentials;
        const switchId = `gateway-${id}`;
        return (
          <section key={id} className="rounded-lg border border-line">
            <div className="flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-[#8b6f47] dark:bg-white/[0.06] dark:text-[#c9a96b]">
                  <Icon className="size-[18px]" />
                </span>
                <div className="min-w-0">
                  <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {name}
                    <Pill tone={live ? 'success' : enabled[id] && id !== 'cod' ? 'warning' : 'neutral'} dot>
                      {live ? 'Live at checkout' : enabled[id] && id !== 'cod' ? 'Needs keys' : 'Off'}
                    </Pill>
                    {id === 'card' && settings.card.testMode && <Pill tone="info">Test mode</Pill>}
                    {id === 'bkash' && settings.bkash.credentials.appKey?.set && (
                      <Pill tone="info" className="capitalize">{settings.bkash.effectiveMode}</Pill>
                    )}
                  </h3>
                  <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{text}</p>
                </div>
              </div>
              <label htmlFor={switchId} className={`flex items-center gap-2.5 text-xs font-medium text-stone-600 dark:text-stone-300 ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                {enabled[id] ? 'Enabled' : 'Disabled'}
                <input
                  id={switchId}
                  type="checkbox"
                  className="peer sr-only"
                  checked={enabled[id]}
                  disabled={!canEdit}
                  onChange={(e) => setEnabled({ ...enabled, [id]: e.target.checked })}
                />
                <span className="relative h-5 w-9 rounded-full bg-stone-300 transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-white after:shadow-xs after:transition-transform after:content-[''] peer-checked:bg-[#8b6f47] peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-[#8b6f47]/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface dark:bg-white/15 dark:peer-checked:bg-[#c9a96b]" />
              </label>
            </div>

            {(id === 'bkash' || fields.length > 0) && (
              <div className="space-y-4 border-t border-line p-4 sm:p-5">
                {id === 'bkash' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className={labelCls}>Environment</span>
                      <span className="relative block">
                        <select
                          value={bkashMode}
                          disabled={!canEdit}
                          onChange={(e) => setBkashMode(e.target.value as typeof bkashMode)}
                          className={`${fieldCls} cursor-pointer appearance-none pr-8`}
                        >
                          <option value="">From server setting ({settings.bkash.effectiveMode})</option>
                          <option value="sandbox">Sandbox (testing)</option>
                          <option value="live">Live (real money)</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                      </span>
                    </label>
                    <label className="block">
                      <span className={labelCls}>Taka per US dollar</span>
                      <input
                        type="number"
                        min={1}
                        step="0.01"
                        value={rate}
                        disabled={!canEdit}
                        placeholder={`${settings.bdtPerUsd} (server setting)`}
                        onChange={(e) => setRate(e.target.value)}
                        className={`${fieldCls} tabular-nums`}
                      />
                    </label>
                  </div>
                )}

                {fields.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {fields.map(({ field, label, placeholder }) => {
                      const key = `${id}.${field}`;
                      const info = creds[field];
                      const cleared = drafts[key] === null;
                      return (
                        <div key={field}>
                          <label htmlFor={`cred-${key}`} className={labelCls}>{label}</label>
                          <input
                            id={`cred-${key}`}
                            type="password"
                            autoComplete="new-password"
                            disabled={!canEdit}
                            value={typeof drafts[key] === 'string' ? (drafts[key] as string) : ''}
                            placeholder={info?.set && !cleared ? `Saved ${info.hint} (type to replace)` : placeholder}
                            onChange={(e) => setDrafts({ ...drafts, [key]: e.target.value })}
                            className={fieldCls}
                          />
                          <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-stone-400">
                            <span className={cleared ? 'text-red-600 dark:text-red-400' : undefined}>
                              {cleared ? 'Will be cleared on save' :
                                info?.source === 'admin' ? 'Saved in admin panel' :
                                info?.source === 'env' ? `From server (${info.envName})` : 'Not set'}
                            </span>
                            {canEdit && info?.source === 'admin' && !cleared && (
                              <button type="button" onClick={() => setDrafts({ ...drafts, [key]: null })} className="cursor-pointer font-medium text-red-600 hover:underline dark:text-red-400">Clear</button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {id !== 'cod' && (
                  <div className="flex justify-end">
                    <AdminButton
                      size="sm"
                      onClick={() => test(id)}
                      disabled={testing !== null || !creds[fields[0].field]?.set}
                      title={dirty ? 'Tests the saved settings; save your changes first' : undefined}
                    >
                      <PlugZap className="size-3.5" /> {testing === id ? 'Testing...' : 'Test connection'}
                    </AdminButton>
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <span className="text-xs text-stone-500 dark:text-stone-400">
          {settings.updatedAt ? `Last changed ${new Date(settings.updatedAt).toLocaleString()}${settings.updatedByName ? ` by ${settings.updatedByName}` : ''}` : 'Using server defaults'}
        </span>
        {canEdit && (
          <AdminButton variant="primary" onClick={save} disabled={saving || !dirty}>
            <Save className="size-4" /> {saving ? 'Saving...' : 'Save changes'}
          </AdminButton>
        )}
      </div>
    </div>
  );
}
