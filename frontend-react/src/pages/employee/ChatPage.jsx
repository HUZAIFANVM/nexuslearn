import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, TextField, Button, List, ListItemButton, ListItemText,
  Paper, CircularProgress, Avatar, Chip, InputAdornment, IconButton, Tooltip, Snackbar,
} from '@mui/material';
import { Send, SmartToy, Person, SearchOutlined, ContentCopy, Replay, DeleteOutline } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { getChatbots, getChatHistory, sendMessageStream, clearChatHistory } from '../../api/chatbots';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { fadeInUp } from '../../theme/glass';

export default function ChatPage() {
  const theme = useTheme();
  const [chatbots, setChatbots] = useState([]);
  const [selectedBot, setSelectedBot] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [copySnackbar, setCopySnackbar] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    getChatbots().then((r) => setChatbots(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedBot) {
      getChatHistory(selectedBot.id)
        .then((r) => setMessages(r.data))
        .catch(() => setMessages([]));
    }
  }, [selectedBot]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopySnackbar(true);
  };

  const handleSend = async (overrideMessage) => {
    const msg = overrideMessage || input;
    if (!msg.trim() || !selectedBot || sending) return;
    setInput('');
    setSending(true);

    // Add user message with empty bot response (streaming placeholder)
    setMessages((prev) => [
      ...prev,
      { user_message: msg, bot_response: '', timestamp: new Date().toISOString(), isStreaming: true },
    ]);

    try {
      await sendMessageStream(
        selectedBot.id,
        msg,
        // onToken — append each token to the last message
        (token) => {
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            updated[updated.length - 1] = {
              ...last,
              bot_response: (last.bot_response || '') + token,
            };
            return updated;
          });
        },
        // onDone — mark streaming complete
        (fullResponse) => {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              bot_response: fullResponse,
              isStreaming: false,
            };
            return updated;
          });
          setSending(false);
        },
        // onError — show error with retry
        (error) => {
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              bot_response: `Failed to get response. ${error}`,
              isStreaming: false,
              isError: true,
              originalMessage: msg,
            };
            return updated;
          });
          setSending(false);
        }
      );
    } catch {
      setSending(false);
    }
  };

  const handleRetry = (originalMessage) => {
    setMessages((prev) => prev.slice(0, -1));
    setTimeout(() => handleSend(originalMessage), 100);
  };

  const handleClearHistory = async () => {
    if (!selectedBot) return;
    if (!window.confirm('Clear all chat history with this assistant?')) return;
    try {
      await clearChatHistory(selectedBot.id);
      setMessages([]);
      setCopySnackbar(false);
      setSnackMsg('Chat history cleared');
      setSnackOpen(true);
    } catch (err) {
      console.error('Clear history failed:', err);
      setSnackMsg('Failed to clear history');
      setSnackOpen(true);
    }
  };

  const suggestedQuestions = [
    'What is this document about?',
    'Summarize the key points',
    'What are the main policies outlined?',
    'What should I know first?',
  ];

  return (
    <Box display="flex" gap={2} height="calc(100vh - 130px)">
      {/* Bot list */}
      <Card sx={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', ...fadeInUp(0) }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={700} color="text.primary" mb={0.3} fontSize="0.95rem">Knowledge Hub</Typography>
          <Typography variant="caption" color="text.disabled">Select an AI assistant</Typography>
        </Box>
        <List sx={{ flex: 1, overflow: 'auto', px: 1, py: 1 }}>
          {chatbots.map((bot) => (
            <ListItemButton
              key={bot.id}
              selected={selectedBot?.id === bot.id}
              onClick={() => setSelectedBot(bot)}
              sx={{
                borderRadius: '10px', mb: 0.5, py: 1.5,
                '&.Mui-selected': { bgcolor: theme.palette.custom.blueTint, '&:hover': { bgcolor: '#DBEAFE' } },
                '&:hover': { bgcolor: 'background.default' },
              }}
            >
              <Avatar sx={{
                width: 36, height: 36, mr: 1.5, borderRadius: '10px',
                background: selectedBot?.id === bot.id
                  ? 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)'
                  : undefined,
                bgcolor: selectedBot?.id === bot.id ? undefined : 'action.hover',
                color: selectedBot?.id === bot.id ? '#fff' : 'text.disabled',
              }}>
                <SmartToy sx={{ fontSize: 18 }} />
              </Avatar>
              <ListItemText
                primary={bot.name}
                secondary={bot.document_name}
                primaryTypographyProps={{ fontWeight: 600, fontSize: '0.85rem', color: 'text.primary' }}
                secondaryTypographyProps={{ fontSize: '0.7rem', color: 'text.disabled', noWrap: true }}
              />
            </ListItemButton>
          ))}
          {chatbots.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <SmartToy sx={{ fontSize: 32, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.disabled">No assistants available</Typography>
            </Box>
          )}
        </List>
      </Card>

      {/* Chat area */}
      <Box flex={1} display="flex" flexDirection="column">
        {selectedBot ? (
          <>
            {/* Chat header */}
            <Card sx={{ mb: 1.5, flexShrink: 0 }}>
              <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{
                  width: 40, height: 40, borderRadius: '12px',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
                }}>
                  <SmartToy sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="body1" fontWeight={700} color="text.primary">{selectedBot.name}</Typography>
                  <Typography variant="caption" color="text.disabled">Powered by: {selectedBot.document_name}</Typography>
                </Box>
                <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                  {messages.length > 0 && (
                    <Tooltip title="Clear chat history">
                      <IconButton
                        size="small"
                        onClick={handleClearHistory}
                        disabled={sending}
                        sx={{ color: 'text.disabled', '&:hover': { color: '#EF4444', bgcolor: '#FEF2F2' } }}
                      >
                        <DeleteOutline sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Chip label="AI-Powered" size="small" sx={{ bgcolor: theme.palette.custom.purpleTint, color: '#8B5CF6', fontWeight: 600, fontSize: '0.7rem' }} />
                </Box>
              </Box>
            </Card>

            {/* Messages */}
            <Card sx={{ flex: 1, overflow: 'auto', mb: 1.5, p: 0 }}>
              <Box sx={{ p: 2, minHeight: '100%' }}>
                {/* Empty state with suggested questions */}
                {messages.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Box sx={{
                      width: 64, height: 64, borderRadius: '20px',
                      background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
                    }}>
                      <SmartToy sx={{ fontSize: 28, color: '#fff' }} />
                    </Box>
                    <Typography variant="h6" fontWeight={600} color="text.primary" mb={0.5}>Start a conversation</Typography>
                    <Typography variant="body2" color="text.disabled" mb={3}>
                      Ask anything about {selectedBot.document_name}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', maxWidth: 520, mx: 'auto' }}>
                      {suggestedQuestions.map((q) => (
                        <Chip
                          key={q}
                          label={q}
                          onClick={() => handleSend(q)}
                          sx={{
                            bgcolor: theme.palette.custom.purpleTint, color: '#7C3AED', fontWeight: 500,
                            cursor: 'pointer', fontSize: '0.8rem',
                            '&:hover': { bgcolor: '#EDE9FE' },
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Message list */}
                {messages.map((msg, i) => (
                  <Box key={i} mb={2.5}>
                    {/* User message */}
                    <Box display="flex" justifyContent="flex-end" mb={1.5}>
                      <Box sx={{
                        maxWidth: '70%', display: 'flex', gap: 1.5, alignItems: 'flex-end',
                        flexDirection: 'row-reverse',
                      }}>
                        <Avatar sx={{
                          width: 30, height: 30, fontSize: 13,
                          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                          boxShadow: '0 4px 12px rgba(99,102,241,0.30)',
                        }}>
                          <Person sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Box>
                          <Box sx={{
                            p: 2, px: 2.5,
                            background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                            color: '#fff',
                            borderRadius: '18px 18px 4px 18px',
                            boxShadow: '0 6px 20px rgba(99,102,241,0.30)',
                          }}>
                            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{msg.user_message}</Typography>
                          </Box>
                          {msg.timestamp && (
                            <Typography variant="caption" sx={{ display: 'block', textAlign: 'right', mt: 0.3, fontSize: '0.65rem', color: 'text.disabled' }}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>

                    {/* Bot response */}
                    {msg.bot_response ? (
                      <Box display="flex" justifyContent="flex-start">
                        <Box sx={{ maxWidth: '70%', display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
                          <Avatar sx={{
                            width: 30, height: 30, borderRadius: '8px',
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
                          }}>
                            <SmartToy sx={{ fontSize: 16 }} />
                          </Avatar>
                          <Box>
                            <Box sx={{
                              p: 2, px: 2.5,
                              background: (t) => t.palette.mode === 'dark'
                                ? 'rgba(255,255,255,0.04)'
                                : 'rgba(255,255,255,0.65)',
                              backdropFilter: 'blur(16px)',
                              WebkitBackdropFilter: 'blur(16px)',
                              border: '1px solid',
                              borderColor: (t) => t.palette.mode === 'dark'
                                ? 'rgba(255,255,255,0.08)'
                                : 'rgba(255,255,255,0.55)',
                              borderRadius: '18px 18px 18px 4px',
                              boxShadow: (t) => t.palette.mode === 'dark'
                                ? '0 6px 20px rgba(0,0,0,0.30)'
                                : '0 6px 20px -6px rgba(99,102,241,0.18)',
                              position: 'relative',
                              '&:hover .copy-btn': { opacity: 1 },
                            }}>
                              <Box sx={{
                                color: 'text.primary',
                                fontSize: '0.875rem',
                                lineHeight: 1.7,
                                fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                                '& p': { m: 0, mb: 1, '&:last-child': { mb: 0 } },
                                '& h1': { fontSize: '1.25rem', fontWeight: 700, color: 'text.primary', mt: 1.5, mb: 0.75 },
                                '& h2': { fontSize: '1.1rem', fontWeight: 700, color: 'text.primary', mt: 1.5, mb: 0.75 },
                                '& h3': { fontSize: '1rem', fontWeight: 600, color: 'text.primary', mt: 1, mb: 0.5 },
                                '& h4, & h5, & h6': { fontSize: '0.9rem', fontWeight: 600, color: 'text.primary', mt: 1, mb: 0.5 },
                                '& ul, & ol': { pl: 2.5, my: 0.75 },
                                '& li': { mb: 0.3 },
                                '& li::marker': { color: 'text.disabled' },
                                '& strong': { fontWeight: 600, color: 'text.primary' },
                                '& em': { fontStyle: 'italic', color: 'text.secondary' },
                                '& code': {
                                  bgcolor: 'action.hover', color: '#E11D48', px: 0.75, py: 0.25,
                                  borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'monospace',
                                },
                                '& pre': {
                                  bgcolor: '#1E293B', color: '#E2E8F0', p: 2, borderRadius: '10px',
                                  overflow: 'auto', my: 1, fontSize: '0.8rem',
                                  '& code': { bgcolor: 'transparent', color: 'inherit', p: 0 },
                                },
                                '& blockquote': {
                                  borderLeft: '3px solid #3B82F6', pl: 2, ml: 0, my: 1,
                                  color: 'text.secondary', fontStyle: 'italic',
                                },
                                '& table': {
                                  width: '100%', borderCollapse: 'collapse', my: 1, fontSize: '0.8rem',
                                },
                                '& th': { bgcolor: 'action.hover', fontWeight: 600, p: 1, textAlign: 'left', borderBottom: (t) => `2px solid ${t.palette.divider}` },
                                '& td': { p: 1, borderBottom: (t) => `1px solid ${t.palette.divider}` },
                                '& hr': { border: 'none', borderTop: (t) => `1px solid ${t.palette.divider}`, my: 1.5 },
                                '& a': { color: '#3B82F6', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
                              }}>
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {msg.bot_response}
                                </ReactMarkdown>
                                {msg.isStreaming && (
                                  <Box component="span" sx={{
                                    display: 'inline-block', width: 2, height: 16,
                                    bgcolor: '#8B5CF6', ml: 0.5, verticalAlign: 'text-bottom',
                                    animation: 'blink 0.8s infinite',
                                    '@keyframes blink': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0 } },
                                  }} />
                                )}
                              </Box>
                              {!msg.isStreaming && !msg.isError && (
                                <Tooltip title="Copy response">
                                  <IconButton
                                    className="copy-btn"
                                    size="small"
                                    onClick={() => handleCopy(msg.bot_response)}
                                    sx={{
                                      position: 'absolute', top: 6, right: 6,
                                      opacity: 0, transition: 'opacity 0.2s',
                                    }}
                                  >
                                    <ContentCopy sx={{ fontSize: 14, color: 'text.disabled' }} />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Box>
                            {/* Retry button on error */}
                            {msg.isError && (
                              <Button
                                size="small"
                                startIcon={<Replay sx={{ fontSize: 14 }} />}
                                onClick={() => handleRetry(msg.originalMessage)}
                                sx={{ mt: 0.5, color: '#EF4444', fontSize: '0.75rem', textTransform: 'none' }}
                              >
                                Retry
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    ) : msg.isStreaming ? (
                      /* Typing dots — shown when streaming hasn't produced text yet */
                      <Box display="flex" alignItems="center" gap={1.5} pl={0.5}>
                        <Avatar sx={{ width: 30, height: 30, borderRadius: '8px', background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)' }}>
                          <SmartToy sx={{ fontSize: 16 }} />
                        </Avatar>
                        <Box sx={{
                          p: 1.5,
                          background: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.65)',
                          backdropFilter: 'blur(16px)',
                          WebkitBackdropFilter: 'blur(16px)',
                          border: '1px solid',
                          borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.55)',
                          borderRadius: '14px',
                          display: 'flex', gap: 0.5, alignItems: 'center',
                        }}>
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.disabled', animation: 'pulse 1.2s infinite', '@keyframes pulse': { '0%, 100%': { opacity: 0.4 }, '50%': { opacity: 1 } } }} />
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.disabled', animation: 'pulse 1.2s infinite 0.2s' }} />
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.disabled', animation: 'pulse 1.2s infinite 0.4s' }} />
                        </Box>
                      </Box>
                    ) : null}
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </Box>
            </Card>

            {/* Input */}
            <Card sx={{ flexShrink: 0 }}>
              <Box sx={{ p: 1.5, display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <TextField
                  fullWidth size="small" placeholder="Ask a question about the document..."
                  value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  disabled={sending}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px', bgcolor: 'background.default',
                      '& fieldset': { borderColor: 'divider' },
                    },
                  }}
                />
                <Button
                  variant="contained" onClick={() => handleSend()} disabled={sending || !input.trim()}
                  sx={{
                    minWidth: 44, height: 44, borderRadius: '14px',
                    background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
                    boxShadow: '0 6px 18px rgba(99,102,241,0.40)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                      boxShadow: '0 10px 24px rgba(99,102,241,0.55)',
                      transform: 'translateY(-1px)',
                    },
                    '&.Mui-disabled': { background: 'rgba(99,102,241,0.25)', color: '#fff' },
                  }}
                >
                  <Send sx={{ fontSize: 18 }} />
                </Button>
              </Box>
            </Card>
          </>
        ) : (
          <Card sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{
                width: 80, height: 80, borderRadius: '24px',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
              }}>
                <SmartToy sx={{ fontSize: 36, color: '#fff' }} />
              </Box>
              <Typography variant="h6" fontWeight={600} color="text.primary" mb={0.5}>AI Knowledge Hub</Typography>
              <Typography variant="body2" color="text.disabled">Select an assistant from the left to start asking questions</Typography>
            </Box>
          </Card>
        )}
      </Box>

      {/* Copy snackbar */}
      <Snackbar
        open={copySnackbar}
        autoHideDuration={2000}
        onClose={() => setCopySnackbar(false)}
        message="Copied to clipboard"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
      <Snackbar
        open={snackOpen}
        autoHideDuration={2500}
        onClose={() => setSnackOpen(false)}
        message={snackMsg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
}
