'use client';

import { FormEvent, useMemo, useState } from 'react';
import { Loader2, Mail, Send } from 'lucide-react';
import {
  type AdminEmailAudience,
  useAdminEmailAudienceCounts,
  useSendBulkEmail,
} from '@/hooks/useAdminEmail';

const audienceOptions: Array<{ value: AdminEmailAudience; label: string }> = [
  { value: 'all_users', label: 'All users' },
  { value: 'all_gcs', label: 'All general contractors' },
  { value: 'all_homeowners', label: 'All homeowners' },
  { value: 'specific_users', label: 'Specific email addresses' },
];

export default function AdminEmailsPage() {
  const { data: counts, isLoading: countsLoading } = useAdminEmailAudienceCounts();
  const sendMutation = useSendBulkEmail();

  const [audience, setAudience] = useState<AdminEmailAudience>('all_users');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [text, setText] = useState('');
  const [recipientsInput, setRecipientsInput] = useState('');
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const parsedRecipients = useMemo(() => {
    return Array.from(
      new Set(
        recipientsInput
          .split(/[\n,;]/g)
          .map((x) => x.trim().toLowerCase())
          .filter(Boolean),
      ),
    );
  }, [recipientsInput]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setResultMessage(null);
    setErrorMessage(null);

    try {
      if (!subject.trim()) {
        throw new Error('Subject is required');
      }
      if (!html.trim() && !text.trim()) {
        throw new Error('Provide at least HTML or text content');
      }
      if (audience === 'specific_users' && parsedRecipients.length === 0) {
        throw new Error('Provide at least one email address');
      }

      const response = await sendMutation.mutateAsync({
        audience,
        subject: subject.trim(),
        html: html.trim() || undefined,
        text: text.trim() || undefined,
        recipients: audience === 'specific_users' ? parsedRecipients : undefined,
      });

      setResultMessage(
        `Campaign sent. Targeted: ${response.totalRecipients}, Sent: ${response.sent}, Failed: ${response.failed}.`,
      );
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to send emails');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-poppins">Email Campaigns</h1>
        <p className="text-gray-500 mt-1">
          Send plain-text or HTML emails to all users, all GCs, all homeowners, or specific users.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">All users</p>
          <p className="text-2xl font-bold">{countsLoading ? '...' : counts?.allUsers ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">General contractors</p>
          <p className="text-2xl font-bold">{countsLoading ? '...' : counts?.allGcs ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Homeowners</p>
          <p className="text-2xl font-bold">{countsLoading ? '...' : counts?.allHomeowners ?? 0}</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-gray-700" />
          <h2 className="text-lg font-semibold">Compose campaign</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
          <select
            value={audience}
            onChange={(event) => setAudience(event.target.value as AdminEmailAudience)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
          >
            {audienceOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {audience === 'specific_users' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient emails (comma, semicolon, or new line separated)
            </label>
            <textarea
              value={recipientsInput}
              onChange={(event) => setRecipientsInput(event.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[100px]"
              placeholder="user1@example.com, user2@example.com"
            />
            <p className="text-xs text-gray-500 mt-1">Detected recipients: {parsedRecipients.length}</p>
          </div>
        ) : null}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Important update from BuildMyHouse"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plain text content</label>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[120px]"
            placeholder="Write plain text email body (optional if HTML is provided)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">HTML content</label>
          <textarea
            value={html}
            onChange={(event) => setHtml(event.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[180px] font-mono text-sm"
            placeholder="<h1>Hello from BuildMyHouse</h1><p>...</p>"
          />
        </div>

        {resultMessage ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-3 py-2 text-sm">
            {resultMessage}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
            {errorMessage}
          </div>
        ) : null}

        <div>
          <button
            type="submit"
            disabled={sendMutation.isPending}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white ${
              sendMutation.isPending ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {sendMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send campaign
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

