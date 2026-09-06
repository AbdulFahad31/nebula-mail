'use client';

import React, { useEffect } from 'react';
import { useMailStore } from '@/lib/store/useMailStore';
import { parseContacts } from '@/lib/gmail/contacts';
import { Reply, Forward, Trash2, RotateCcw, Paperclip, FileText, Download } from 'lucide-react';
import { commandDeleteEmail, commandRestoreEmail, commandPermanentlyDeleteEmail } from '@/lib/commands';


import { NebulaBrief } from './NebulaBrief';

function EmailBodyIframe({ html }: { html: string }) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const iframeId = React.useId().replace(/:/g, '_');

  const srcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <base target="_blank">
        <style>
          html, body {
            margin: 0;
            padding: 0;
            background-color: #FAFAF8;
            color: #14161A;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            font-size: 13px;
            word-break: break-word;
            overflow: hidden;
          }
          #email-content-wrapper {
            padding: 16px;
            box-sizing: border-box;
            display: flow-root;
          }
          img { max-width: 100% !important; height: auto !important; }
          table { max-width: 100% !important; }
        </style>
      </head>
      <body>
        <div id="email-content-wrapper">
          ${html}
        </div>
        <script>
          (function() {
            function sendHeight() {
              const wrapper = document.getElementById('email-content-wrapper');
              if (wrapper) {
                const height = wrapper.getBoundingClientRect().height;
                window.parent.postMessage({ type: 'EMAIL_IFRAME_RESIZE', iframeId: '${iframeId}', height }, '*');
              }
            }
            window.addEventListener('load', sendHeight);
            document.querySelectorAll('img').forEach(function(img) {
              if (!img.complete) {
                img.addEventListener('load', sendHeight);
                img.addEventListener('error', sendHeight);
              }
            });
            if (window.ResizeObserver) {
              var ro = new ResizeObserver(sendHeight);
              var elem = document.getElementById('email-content-wrapper');
              if (elem) ro.observe(elem);
            }
            sendHeight();
          })();
        </script>
      </body>
    </html>
  `;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data &&
        event.data.type === 'EMAIL_IFRAME_RESIZE' &&
        event.data.iframeId === iframeId &&
        typeof event.data.height === 'number'
      ) {
        if (iframeRef.current) {
          const newHeight = Math.ceil(event.data.height);
          iframeRef.current.style.height = `${newHeight}px`;
        }
      }
    };

    window.addEventListener('message', handleMessage);

    const timer = setTimeout(() => {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          const wrapper = iframeRef.current.contentWindow.document.getElementById('email-content-wrapper');
          if (wrapper) {
            const height = Math.ceil(wrapper.getBoundingClientRect().height);
            iframeRef.current.style.height = `${height}px`;
          }
        } catch (e) {}
      }
    }, 100);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timer);
    };
  }, [html, iframeId]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcDoc}
      title="Email content"
      sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
      className="w-full border-0 rounded-lg bg-[#FAFAF8] transition-[height] duration-150 ease-out"
      style={{ height: '200px' }}
    />
  );
}

export function EmailDetail() {
  const { emails, selectedEmailId, activeView, setComposeState } = useMailStore();

  const selectedEmail = emails.find(
    e => e.id === selectedEmailId || e.gmailMessageId === selectedEmailId
  );

  useEffect(() => {
    if (selectedEmail && !selectedEmail.isRead) {
      const updated = emails.map(e =>
        e.id === selectedEmail.id || e.gmailMessageId === selectedEmail.gmailMessageId
          ? { ...e, isRead: true }
          : e
      );
      useMailStore.getState().setEmails(updated);
      fetch(`/api/mail/${selectedEmail.id}`).catch(() => {});
    }
  }, [selectedEmail?.id, selectedEmail?.isRead]);

  if (!selectedEmail) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-[#14161A] border-r border-[#2A2D33] text-[#6B6D73] font-sans p-6 text-center">
        <div className="w-12 h-12 rounded-full border border-[#2A2D33] bg-[#1C1F24] flex items-center justify-center mb-3">
          <span className="text-lg text-[#6B9971] font-serif-display font-semibold">N</span>
        </div>
        <p className="text-xs font-serif-display font-medium text-[#EDECE8] mb-1">
          No conversation selected
        </p>
        <p className="text-[11px] text-[#6B6D73] font-normal">
          Select an email from your list to read its content
        </p>
      </div>
    );
  }

  const formattedDate = new Date(selectedEmail.receivedAt).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const handleReplyClick = () => {
    setComposeState({
      isOpen: true,
      to: [selectedEmail.sender],
      subject: selectedEmail.subject.startsWith('Re:')
        ? selectedEmail.subject
        : `Re: ${selectedEmail.subject}`,
      body: `\n\n--- On ${formattedDate}, ${selectedEmail.sender} wrote:\n> ${selectedEmail.snippet}`,
      replyToMessageId: selectedEmail.id,
    });
  };

  const handleForwardClick = () => {
    setComposeState({
      isOpen: true,
      to: [],
      subject: selectedEmail.subject.startsWith('Fwd:')
        ? selectedEmail.subject
        : `Fwd: ${selectedEmail.subject}`,
      body: `\n\n--- Forwarded Message ---\nFrom: ${selectedEmail.sender}\nDate: ${formattedDate}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.snippet}`,
    });
  };

  const isSentView = activeView === 'sent' || selectedEmail.isSent;
  const recipientContacts = parseContacts(selectedEmail.recipient);
  const primaryRecipient = recipientContacts[0]?.name || recipientContacts[0]?.email || selectedEmail.recipient || 'Unknown Recipient';

  const headerTitle = isSentView
    ? `To: ${primaryRecipient}${recipientContacts.length > 1 ? ` (+${recipientContacts.length - 1})` : ''}`
    : selectedEmail.senderName || selectedEmail.sender;

  const avatarChar = (
    isSentView
      ? primaryRecipient.replace(/^To:\s*/i, '').trim().charAt(0) || 'R'
      : (selectedEmail.senderName || selectedEmail.sender).charAt(0) || 'U'
  ).toUpperCase();

  return (
    <div className="flex-1 flex flex-col h-full bg-[#14161A] overflow-y-auto border-r border-[#2A2D33] font-sans transition-colors duration-150">
      {/* Top Action Bar */}
      <div className="px-4 py-2.5 border-b border-[#2A2D33] bg-[#14161A] flex items-center justify-between">
        <div className="flex items-center gap-2 font-sans">
          <button
            onClick={handleReplyClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1C1F24] hover:bg-[#24282F] text-[#6B9971] hover:text-[#EDECE8] border border-[#6B9971]/40 hover:border-[#6B9971]/80 text-xs font-medium font-sans transition-all duration-150"
          >
            <Reply className="w-3.5 h-3.5 text-[#6B9971]" />
            Reply
          </button>
          <button
            onClick={handleForwardClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1C1F24] hover:bg-[#24282F] border border-[#2A2D33] text-[#9A9CA3] hover:text-[#EDECE8] text-xs font-medium transition-colors font-sans"
          >
            <Forward className="w-3.5 h-3.5 text-[#6B6D73]" />
            Forward
          </button>

          {activeView === 'trash' ? (
            <>
              <button
                onClick={() => commandRestoreEmail({ messageId: selectedEmail.id })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1C1F24] hover:bg-[#24282F] border border-[#2A2D33] text-[#9A9CA3] hover:text-[#EDECE8] text-xs font-medium transition-colors font-sans"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#6B9971]" />
                Restore
              </button>
              <button
                onClick={() => commandPermanentlyDeleteEmail({ messageId: selectedEmail.id })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1C1F24] hover:bg-[#24282F] border border-[#2A2D33] text-[#9A9CA3] hover:text-[#EDECE8] text-xs font-medium transition-colors font-sans"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#9A9CA3]" />
                Delete Permanently
              </button>
            </>
          ) : (
            <button
              onClick={() => commandDeleteEmail({ messageId: selectedEmail.id })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1C1F24] hover:bg-[#24282F] border border-[#2A2D33] text-[#9A9CA3] hover:text-[#EDECE8] text-xs font-medium transition-colors font-sans"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#6B6D73]" />
              Trash
            </button>
          )}
        </div>

        <div className="text-[11px] text-[#6B6D73] font-mono">
        </div>
      </div>

      {/* Main Email Content */}
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-4 border-b border-[#2A2D33] pb-6">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-xl font-serif-display font-semibold text-[#EDECE8] tracking-[-0.015em] leading-snug">
              {selectedEmail.subject}
            </h1>
            <span className="text-[11px] font-sans text-[#6B6D73] shrink-0 font-normal pt-1">
              {formattedDate}
            </span>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full border border-[#6B9971]/30 bg-[#6B9971]/15 text-[#6B9971] flex items-center justify-center font-serif-display font-semibold text-sm shrink-0 mt-0.5">
              {avatarChar}
            </div>
            <div className="space-y-1 text-xs font-sans">
              <div className="font-serif-display font-semibold text-[#EDECE8] text-sm">
                {headerTitle}
              </div>
              <div className="text-[#9A9CA3] text-[11px] space-y-0.5 font-normal">
                <div>
                  <span className="text-[#6B6D73] font-medium">From: </span>
                  <span className="text-[#EDECE8]">{selectedEmail.sender}</span>
                </div>
                <div>
                  <span className="text-[#6B6D73] font-medium">To: </span>
                  <span className="text-[#EDECE8]">{selectedEmail.recipient}</span>
                </div>
                {selectedEmail.cc && (
                  <div>
                    <span className="text-[#6B6D73] font-medium">Cc: </span>
                    <span className="text-[#EDECE8]">{selectedEmail.cc}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Nebula Brief Section */}
        <NebulaBrief email={selectedEmail} key={selectedEmail.id} />

        {/* Email Body Content Container */}
        <div className="space-y-3 pt-2 font-sans">
          {selectedEmail.bodyHtml ? (
            <div className="rounded-xl border border-[#2A2D33] p-5 bg-[#1C1F24]">
              <div className="text-[10px] font-sans font-semibold text-[#6B6D73] flex items-center gap-1.5 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#6B9971]/60" />
                <span>Original formatting preserved</span>
              </div>
              <EmailBodyIframe html={selectedEmail.bodyHtml} />
            </div>
          ) : (
            <div className="whitespace-pre-wrap font-sans text-[13.5px] text-[#EDECE8] leading-[1.6] font-normal">
              {selectedEmail.bodyText}
            </div>
          )}
        </div>

        {/* Attachments Display Section */}
        {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
          <div className="pt-4 border-t border-[#2A2D33] space-y-3">
            <div className="flex items-center gap-2 text-xs font-serif-display font-semibold text-[#EDECE8]">
              <Paperclip className="w-4 h-4 text-[#6B9971]" />
              <span>Attachments ({selectedEmail.attachments.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {selectedEmail.attachments.map((att) => {
                const formatSize = (bytes: number) => {
                  if (!bytes) return '0 B';
                  if (bytes < 1024) return `${bytes} B`;
                  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                };

                const handleDownload = () => {
                  if (att.base64) {
                    const link = document.createElement('a');
                    link.href = att.base64;
                    link.download = att.filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } else {
                    alert(`Attachment "${att.filename}" (${formatSize(att.size)})`);
                  }
                };

                return (
                  <div
                    key={att.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#1C1F24] border border-[#2A2D33] hover:border-[#6B9971]/50 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded bg-[#14161A] text-[#6B9971] shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-[#EDECE8] truncate">
                          {att.filename}
                        </div>
                        <div className="text-[10px] text-[#6B6D73]">
                          {formatSize(att.size)}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="p-1.5 rounded text-[#6B6D73] hover:text-[#EDECE8] hover:bg-[#25282E] transition-colors shrink-0"
                      title="Download / View file"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
