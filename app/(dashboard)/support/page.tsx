'use client';

import { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Send, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  MessageSquare,
  ChevronRight,
  LifeBuoy
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Modal from '@/components/ui/modal';
import { useToast } from '@/components/toast-context';

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  category: 'ISSUE' | 'SUGGESTION' | 'FEEDBACK' | 'OTHER';
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
}

export default function SupportPage() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form states
  const [category, setCategory] = useState<'ISSUE' | 'SUGGESTION' | 'FEEDBACK' | 'OTHER'>('ISSUE');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  // Modal states
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function fetchTickets() {
    try {
      const res = await fetch('/api/support');
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (error) {
      console.error('Failed to fetch support tickets:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      showToast('Please fill in all fields.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, subject, message }),
      });
      if (res.ok) {
        showToast('Your support ticket has been submitted successfully.', 'success');
        setSubject('');
        setMessage('');
        setCategory('ISSUE');
        fetchTickets();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to submit ticket.', 'error');
      }
    } catch (error) {
      showToast('A system error occurred.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">

      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/20">
          <LifeBuoy className="h-6 w-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-400">Support & Feedback Hub</h1>
          <p className="text-sm text-slate-400">Need help or want to write a suggestion for Finora? Reach out to our administrators.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Submit Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-white/5 pb-3">
              <MessageSquare className="h-5 w-5 text-emerald-400" />
              Submit a Message
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full glass-input text-sm cursor-pointer"
                  >
                    <option value="ISSUE" className="bg-sidebar-bg">Bug / Technical Issue</option>
                    <option value="SUGGESTION" className="bg-sidebar-bg">Feature Suggestion</option>
                    <option value="FEEDBACK" className="bg-sidebar-bg">General Feedback</option>
                    <option value="OTHER" className="bg-sidebar-bg">Other Inquiries</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Cannot export CSV, Suggestion for dark mode"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full glass-input text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase">Description / Message</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Describe your issue, feedback, or suggestion in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full glass-input text-sm resize-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-all duration-200 shadow-md shadow-emerald-500/10 outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* History / Status Tracking */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-white/5 pb-3">
              <Clock className="h-5 w-5 text-emerald-400" />
              Ticket History
            </h2>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-white/2 border border-white/5 space-y-2" >
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-2 w-24" />
                  </div>
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div className="text-center py-10 space-y-2 text-slate-500" >
                <HelpCircle className="h-8 w-8 mx-auto opacity-30" />
                <p className="text-xs">No support messages submitted yet.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin" >
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setIsModalOpen(true);
                    }}
                    className="p-3.5 rounded-xl bg-white/2 border border-white/5 hover:border-white/10 transition-all cursor-pointer space-y-2 text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                        {ticket.category}
                      </span>
                      {ticket.status === 'RESOLVED' ? (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                          Resolved
                        </span>
                      ) : ticket.status === 'IN_PROGRESS' ? (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                          In Progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-slate-200 truncate group-hover:text-emerald-400 transition-colors">
                        {ticket.subject}
                      </h4>
                      <ChevronRight className="h-4 w-4 text-slate-500 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-[10px] text-slate-500">
                      {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* READ-ONLY TICKET DETAILS MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTicket(null);
        }}
        title="Support Ticket Details"
      >
        {selectedTicket && (
          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Category
                </span>
                <span className="text-sm font-semibold text-slate-300">
                  {selectedTicket.category === 'ISSUE' ? 'Technical Issue' :
                   selectedTicket.category === 'SUGGESTION' ? 'Feature Suggestion' :
                   selectedTicket.category === 'FEEDBACK' ? 'General Feedback' : 'Other Inquiries'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block text-right">
                  Status
                </span>
                {selectedTicket.status === 'RESOLVED' ? (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    Resolved
                  </span>
                ) : selectedTicket.status === 'IN_PROGRESS' ? (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                    In Progress
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                    Pending
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2 text-left">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Subject
              </span>
              <h3 className="text-base font-bold text-slate-100">{selectedTicket.subject}</h3>
            </div>

            <div className="space-y-2 text-left bg-white/2 border border-white/5 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Your Message
              </span>
              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                {selectedTicket.message}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs text-slate-500 text-left pt-2 border-t border-white/5">
              <div>
                <span>Submitted On:</span>
                <span className="block font-medium text-slate-400 mt-0.5">
                  {new Date(selectedTicket.createdAt).toLocaleString('en-US')}
                </span>
              </div>
              <div>
                <span>Last Updated:</span>
                <span className="block font-medium text-slate-400 mt-0.5">
                  {new Date(selectedTicket.updatedAt).toLocaleString('en-US')}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedTicket(null);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-sm font-semibold text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
