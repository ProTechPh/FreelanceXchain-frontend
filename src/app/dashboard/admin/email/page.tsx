'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Mail,
  Inbox,
  Send,
  Trash2,
  Star,
  StarOff,
  RefreshCw,
  PenSquare,
  Reply,
  ArrowLeft,
  Search,
  MailOpen,
  Clock,
} from 'lucide-react';
import { emailApi } from '@/lib/api';
import { toast } from 'sonner';

type EmailItem = {
  id: string;
  message_id: string;
  user_id: string;
  from_address: string;
  to_address: string;
  subject: string;
  text_body?: string;
  html_body?: string;
  attachments: string;
  is_read: boolean;
  is_starred: boolean;
  folder: string;
  in_reply_to: string | null;
  references: string | null;
  received_at: string;
  created_at: string;
};

type Folder = 'inbox' | 'sent' | 'trash';

export default function AdminEmailPage() {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [currentFolder, setCurrentFolder] = useState<Folder>('inbox');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sending, setSending] = useState(false);

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await emailApi.list({ folder: currentFolder, limit: 50 });
      setEmails(res.data.data || []);
    } catch {
      toast.error('Failed to load emails');
    } finally {
      setLoading(false);
    }
  }, [currentFolder]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await emailApi.getUnreadCount('inbox');
      setUnreadCount(res.data.count || 0);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchEmails();
    fetchUnreadCount();
  }, [fetchEmails, fetchUnreadCount]);

  const openEmail = async (email: EmailItem) => {
    try {
      const res = await emailApi.getById(email.id);
      setSelectedEmail(res.data);
      if (!email.is_read) {
        setEmails((prev) =>
          prev.map((e) => (e.id === email.id ? { ...e, is_read: true } : e))
        );
        fetchUnreadCount();
      }
    } catch {
      toast.error('Failed to load email');
    }
  };

  const toggleStar = async (email: EmailItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await emailApi.update(email.id, { is_starred: !email.is_starred });
      setEmails((prev) =>
        prev.map((em) =>
          em.id === email.id ? { ...em, is_starred: !em.is_starred } : em
        )
      );
    } catch {
      toast.error('Failed to update email');
    }
  };

  const deleteEmail = async (email: EmailItem) => {
    try {
      await emailApi.delete(email.id);
      setSelectedEmail(null);
      fetchEmails();
      toast.success(
        email.folder === 'trash' ? 'Email permanently deleted' : 'Moved to trash'
      );
    } catch {
      toast.error('Failed to delete email');
    }
  };

  const handleSend = async () => {
    if (!composeTo || !composeSubject) {
      toast.error('To and Subject are required');
      return;
    }
    setSending(true);
    try {
      await emailApi.send({
        to: composeTo,
        subject: composeSubject,
        text: composeBody,
      });
      toast.success('Email sent');
      setComposeOpen(false);
      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      if (currentFolder === 'sent') fetchEmails();
    } catch {
      toast.error('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  const handleReply = async () => {
    if (!selectedEmail || !composeBody) {
      toast.error('Reply body is required');
      return;
    }
    setSending(true);
    try {
      await emailApi.reply(selectedEmail.id, { text: composeBody });
      toast.success('Reply sent');
      setReplyOpen(false);
      setComposeBody('');
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const filteredEmails = emails.filter(
    (e) =>
      e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.from_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.to_address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const folders: { key: Folder; label: string; icon: React.ElementType }[] = [
    { key: 'inbox', label: 'Inbox', icon: Inbox },
    { key: 'sent', label: 'Sent', icon: Send },
    { key: 'trash', label: 'Trash', icon: Trash2 },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Email</h1>
          {unreadCount > 0 && (
            <Badge variant="default">{unreadCount} unread</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchEmails}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
            <DialogTrigger>
              <Button size="sm">
                <PenSquare className="w-4 h-4 mr-2" />
                Compose
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>New Email</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>To</Label>
                  <Input
                    placeholder="recipient@example.com"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    placeholder="Email subject"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Body</Label>
                  <Textarea
                    placeholder="Write your message..."
                    rows={8}
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setComposeOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSend} disabled={sending}>
                    {sending ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Folder sidebar */}
        <div className="w-48 shrink-0 space-y-1">
          {folders.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                setCurrentFolder(f.key);
                setSelectedEmail(null);
              }}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentFolder === f.key
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <f.icon className="w-4 h-4" />
              {f.label}
              {f.key === 'inbox' && unreadCount > 0 && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {unreadCount}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* Email list */}
        {!selectedEmail ? (
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  Loading...
                </div>
              ) : filteredEmails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <MailOpen className="w-12 h-12 mb-3 opacity-30" />
                  <p>No emails</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredEmails.map((email) => (
                    <div
                      key={email.id}
                      onClick={() => openEmail(email)}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-muted/50 ${
                        !email.is_read ? 'bg-primary/5 font-medium' : ''
                      }`}
                    >
                      <button
                        onClick={(e) => toggleStar(email, e)}
                        className="shrink-0"
                      >
                        {email.is_starred ? (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        ) : (
                          <StarOff className="w-4 h-4 text-muted-foreground/40" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm truncate">
                            {currentFolder === 'sent'
                              ? email.to_address
                              : email.from_address}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(email.received_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm truncate text-muted-foreground">
                          {email.subject}
                        </p>
                      </div>
                      {!email.is_read && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Email detail view */
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEmail(null)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <CardTitle className="text-lg flex-1 truncate">
                  {selectedEmail.subject}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setComposeBody('');
                      setReplyOpen(true);
                    }}
                  >
                    <Reply className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteEmail(selectedEmail)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="flex-1 overflow-y-auto pt-4">
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    <span className="text-muted-foreground">From: </span>
                    <span className="font-medium">
                      {selectedEmail.from_address}
                    </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(selectedEmail.received_at).toLocaleString()}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">To: </span>
                  <span>{selectedEmail.to_address}</span>
                </div>
              </div>
              <Separator className="mb-4" />
              {selectedEmail.html_body ? (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.html_body }}
                />
              ) : (
                <pre className="whitespace-pre-wrap text-sm font-sans">
                  {selectedEmail.text_body}
                </pre>
              )}
            </CardContent>

            {/* Reply dialog */}
            <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>
                    Reply to {selectedEmail.from_address}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="text-sm text-muted-foreground">
                    Re: {selectedEmail.subject}
                  </div>
                  <Textarea
                    placeholder="Write your reply..."
                    rows={8}
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setReplyOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleReply} disabled={sending}>
                      {sending ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </Card>
        )}
      </div>
    </div>
  );
}
