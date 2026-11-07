
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Activity,
  Bot,
  ChevronRight,
  MessageCircle,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  LoaderCircle,
} from 'lucide-react'

import LoadingState from '../../components/common/LoadingState'
import ErrorState from '../../components/common/ErrorState'
import EmptyState from '../../components/common/EmptyState'

import {
  createAIConversation,
  deleteAIConversation,
  getAIConversations,
  getAIConversation,
  getPrivacyConsents,
  sendAIMessage,
  updatePrivacyConsent,
  type AIConversation,
  type AIMessage,
} from '../../services/api'

const suggestions = [
  'Create a beginner-friendly workout routine.',
  'How can I build muscle at home?',
  'Explain proper recovery after workouts.',
  'Give me tips to improve my stamina.',
]

export default function AICoach() {
  const [conversations, setConversations] = useState<AIConversation[]>([])
  const [activeConversation, setActiveConversation] =
    useState<AIConversation | null>(null)
  const [input, setInput] = useState('')
  const [consentGranted, setConsentGranted] = useState(false)
  const [consentAccepted, setConsentAccepted] = useState(false)
  const [profileConsentGranted, setProfileConsentGranted] = useState(false)
  const [profileConsentAccepted, setProfileConsentAccepted] = useState(false)
  const [profileConsentBusy, setProfileConsentBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [creatingConversation, setCreatingConversation] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = useCallback(async () => {
  try {
    setLoading(true)
    setError('')
    setLoadError('')

    const [chatList, consents] = await Promise.all([
      getAIConversations(),
      getPrivacyConsents(),
    ])

    setConversations(chatList)

    const chatConsent = consents.find(
      (item) => item.consent_type === 'ai_chat',
    )

    setConsentGranted(chatConsent?.is_granted ?? false)

    const profileConsent = consents.find(
      (item) => item.consent_type === 'ai_profile_context',
    )

    setProfileConsentGranted(profileConsent?.is_granted ?? false)

    if (chatList.length > 0) {
      const latest = await getAIConversation(chatList[0].id)
      setActiveConversation(latest)
    } else {
      setActiveConversation(null)
    }
  } catch (err) {
    setLoadError(
      err instanceof Error ? err.message : 'Unable to load AI Coach.',
    )
  } finally {
    setLoading(false)
  }
}, [])

  // Initial load is kept separate from the retry callback so the effect
  // only synchronizes with the API and does not synchronously trigger state.
  useEffect(() => {
    let active = true

    const fetchInitialConversations = async () => {
      try {
        const [chatList, consents] = await Promise.all([
          getAIConversations(),
          getPrivacyConsents(),
        ])

        if (!active) return

        setConversations(chatList)

        const chatConsent = consents.find(
          (item) => item.consent_type === 'ai_chat',
        )
        setConsentGranted(chatConsent?.is_granted ?? false)

        const profileConsent = consents.find(
          (item) => item.consent_type === 'ai_profile_context',
        )
        setProfileConsentGranted(profileConsent?.is_granted ?? false)

        if (chatList.length > 0) {
          const latest = await getAIConversation(chatList[0].id)
          if (active) setActiveConversation(latest)
        } else {
          setActiveConversation(null)
        }
      } catch (err) {
        if (active) {
          setLoadError(
            err instanceof Error ? err.message : 'Unable to load AI Coach.',
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    void fetchInitialConversations()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [activeConversation?.messages, sending])

  const startNewConversation = async () => {
  if (creatingConversation) return

  try {
    setCreatingConversation(true)
    setError('')

    const conversation = await createAIConversation()

    setConversations((previous) => [conversation, ...previous])
    setActiveConversation(conversation)
  } catch (err) {
    setError(
      err instanceof Error ? err.message : 'Could not start a new chat.',
    )
  } finally {
    setCreatingConversation(false)
  }
}

  const openConversation = async (id: number) => {
    try {
      setError('')
      const conversation = await getAIConversation(id)
      setActiveConversation(conversation)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not open conversation.',
      )
    }
  }

  const grantConsent = async () => {
    if (!consentAccepted) return

    try {
      setError('')
      await updatePrivacyConsent('ai_chat', true)
      setConsentGranted(true)

      if (profileConsentAccepted) {
        await updatePrivacyConsent('ai_profile_context', true)
        setProfileConsentGranted(true)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save your consent.',
      )
    }
  }

  const toggleProfileConsent = async () => {
    const nextValue = !profileConsentGranted

    try {
      setProfileConsentBusy(true)
      setError('')
      await updatePrivacyConsent('ai_profile_context', nextValue)
      setProfileConsentGranted(nextValue)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not update personalization consent.',
      )
    } finally {
      setProfileConsentBusy(false)
    }
  }

  const withdrawConsent = async () => {
    try {
      setError('')
      await updatePrivacyConsent('ai_chat', false)
      if (profileConsentGranted) {
        await updatePrivacyConsent('ai_profile_context', false)
        setProfileConsentGranted(false)
      }
      setConsentGranted(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not update consent.',
      )
    }
  }

  const handleSend = async (messageText?: string) => {
    const content = (messageText ?? input).trim()

    if (!content || sending || !consentGranted) return

    try {
      setError('')
      setSending(true)

      let conversation = activeConversation

      if (!conversation) {
        conversation = await createAIConversation()
        setActiveConversation(conversation)
        setConversations((previous) => [conversation!, ...previous])
      }

      const result = await sendAIMessage(conversation.id, content)

      const userMessage: AIMessage = result.user_message
      const assistantMessage: AIMessage = result.assistant_message

      setActiveConversation((previous) =>
        previous && previous.id === conversation!.id
          ? {
              ...previous,
              title:
                previous.title === 'New conversation'
                  ? content.slice(0, 50)
                  : previous.title,
              messages: [
                ...previous.messages,
                userMessage,
                assistantMessage,
              ],
            }
          : previous,
      )

      setConversations((previous) =>
        previous.map((item) =>
          item.id === conversation!.id
            ? {
                ...item,
                title:
                  item.title === 'New conversation'
                    ? content.slice(0, 50)
                    : item.title,
                updated_at: assistantMessage.created_at,
              }
            : item,
        ),
      )

      setInput('')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to send your message.',
      )
    } finally {
      setSending(false)
    }
  }

  const removeConversation = async (id: number) => {
    const confirmed = window.confirm(
      'Delete this conversation permanently?',
    )

    if (!confirmed) return

    try {
      await deleteAIConversation(id)

      const remaining = conversations.filter((item) => item.id !== id)
      setConversations(remaining)

      if (activeConversation?.id === id) {
        if (remaining.length > 0) {
          await openConversation(remaining[0].id)
        } else {
          setActiveConversation(null)
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not delete conversation.',
      )
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl pt-10">
        <LoadingState
          title="Loading AI Coach"
          description="Fetching your conversations and privacy settings..."
          fullScreen
        />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <h1 className="text-3xl font-semibold text-white">
          AI Fitness Coach
        </h1>
        <ErrorState
          title="Unable to load AI Coach"
          message={loadError}
          onRetry={() => void loadConversations()}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[#c5f66a]">
            <Sparkles size={17} />
            YOUR PERSONAL FITNESS ASSISTANT
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            AI Fitness Coach
          </h1>
          <p className="mt-2 text-sm text-white/50">
            Ask questions, understand exercises and build healthier habits.
          </p>
        </div>

        <button
          onClick={startNewConversation}
          disabled={creatingConversation}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#c5f66a] px-5 py-3 text-sm font-semibold text-[#10120f] transition hover:bg-[#d7ff91]"
        >
          <Plus size={18} />
          {creatingConversation ? 'Creating...' : 'New conversation'}
        </button>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      {!consentGranted ? (
        <section className="mx-auto mt-8 w-full max-w-2xl rounded-3xl border border-white/10 bg-[#191c17] p-6 sm:p-9">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#c5f66a]/10 text-[#c5f66a]">
            <ShieldCheck size={28} />
          </div>

          <h2 className="text-2xl font-semibold text-white">
            Your privacy, your choice
          </h2>

          <p className="mt-3 text-sm leading-7 text-white/55">
            FitSaathi AI uses Google's Gemini AI service to generate fitness
            coach replies. When you send a message, its content is sent to
            Google for processing. Your chat messages are also saved in your
            FitSaathi account so you can revisit conversations.
          </p>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-medium text-white">
              What we send
            </p>
            <p className="mt-2 text-sm leading-6 text-white/50">
              The messages you choose to send in this chat. Your messages are
              also saved in your FitSaathi account.
            </p>

            <p className="mt-4 text-sm font-medium text-white">
              Profile personalization is optional
            </p>
            <p className="mt-2 text-sm leading-6 text-white/50">
              If you separately opt in, selected preferences such as your
              fitness goal, experience, workout style, schedule and available
              equipment may be sent to Gemini to personalize replies. Medical
              notes, health limitations, body measurements and progress photos
              are not included.
            </p>
          </div>

          <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm leading-6 text-white/70">
            <input
              type="checkbox"
              checked={consentAccepted}
              onChange={(event) => setConsentAccepted(event.target.checked)}
              className="mt-1 h-4 w-4 accent-[#c5f66a]"
            />
            I understand and agree that my chat messages will be processed
            by Google's Gemini AI service and saved in my FitSaathi account.
          </label>

          <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm leading-6 text-white/70">
            <input
              type="checkbox"
              checked={profileConsentAccepted}
              onChange={(event) =>
                setProfileConsentAccepted(event.target.checked)
              }
              className="mt-1 h-4 w-4 accent-[#c5f66a]"
            />
            <span>
              Optional: I agree to share selected fitness profile preferences
              with Gemini to personalize my AI Coach responses. I can withdraw
              this permission at any time.
            </span>
          </label>

          <button
            onClick={grantConsent}
            disabled={!consentAccepted}
            className="mt-6 w-full rounded-xl bg-[#c5f66a] px-5 py-3.5 font-semibold text-[#10120f] transition hover:bg-[#d7ff91] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Agree and continue
          </button>

          <p className="mt-4 text-center text-xs text-white/35">
            You can withdraw this consent later.
          </p>
        </section>
      ) : (
        <div className="grid min-h-[650px] gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="flex flex-col rounded-2xl border border-white/[0.08] bg-[#191c17] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                Your conversations
              </h2>
              <MessageCircle size={17} className="text-white/40" />
            </div>

            <button
              onClick={startNewConversation}
              disabled={creatingConversation}
              className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 px-3 py-3 text-sm text-white/70 transition hover:border-[#c5f66a]/50 hover:text-[#c5f66a]"
            >
              <Plus size={16} />
              {creatingConversation ? 'Creating...' : 'Start new chat'}
            </button>

            <div className="flex-1 space-y-2 overflow-y-auto">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group flex items-center gap-2 rounded-xl border px-3 py-3 ${
                    activeConversation?.id === conversation.id
                      ? 'border-[#c5f66a]/30 bg-[#c5f66a]/[0.08]'
                      : 'border-transparent hover:bg-white/[0.04]'
                  }`}
                >
                  <button
                    onClick={() => openConversation(conversation.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-sm text-white/80">
                      {conversation.title}
                    </p>
                    <p className="mt-1 text-xs text-white/35">
                      {new Date(conversation.updated_at).toLocaleDateString()}
                    </p>
                  </button>

                  <button
                    onClick={() => removeConversation(conversation.id)}
                    aria-label="Delete conversation"
                    className="rounded-lg p-2 text-white/30 opacity-100 transition hover:bg-red-400/10 hover:text-red-300 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}

              {conversations.length === 0 && (
                <EmptyState
                  title="No conversations yet"
                  description="Start a new chat to begin talking with your AI fitness coach."
                  actionLabel="Start chatting"
                  onAction={() => void startNewConversation()}
                />
              )}
            </div>

            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="mb-4">
                <p className="text-xs font-semibold text-white/75">
                  Personalization privacy
                </p>
                <p className="mt-1 text-xs leading-5 text-white/40">
                  {profileConsentGranted
                    ? 'Selected fitness preferences may be shared with Gemini.'
                    : 'Your fitness profile is not shared with Gemini.'}
                </p>
                <button
                  onClick={() => void toggleProfileConsent()}
                  disabled={profileConsentBusy}
                  className="mt-2 text-xs font-medium text-[#c5f66a] transition hover:text-white disabled:opacity-50"
                >
                  {profileConsentBusy
                    ? 'Updating...'
                    : profileConsentGranted
                      ? 'Turn off profile personalization'
                      : 'Enable profile personalization'}
                </button>
              </div>

              <button
                onClick={withdrawConsent}
                className="text-xs text-white/40 transition hover:text-red-300"
              >
                Withdraw AI Chat consent
              </button>
            </div>
          </aside>

          <section className="flex min-h-[650px] min-w-0 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#191c17]">
            <div className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c5f66a]/10 text-[#c5f66a]">
                <Bot size={22} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">
                  FitSaathi AI
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-[#c5f66a]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#c5f66a]" />
                  Fitness assistant
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
              {!activeConversation ||
              activeConversation.messages.length === 0 ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                  <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c5f66a]/10 text-[#c5f66a]">
                    <Activity size={30} />
                  </div>
                  <h3 className="text-xl font-semibold text-white">
                    Let's work on your fitness.
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-white/45">
                    Ask me about workouts, exercise techniques, recovery or
                    fitness habits.
                  </p>

                  <div className="mt-7 grid w-full max-w-xl gap-2 sm:grid-cols-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => void handleSend(suggestion)}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left text-xs leading-5 text-white/65 transition hover:border-[#c5f66a]/40 hover:text-white"
                      >
                        {suggestion}
                        <ChevronRight
                          size={15}
                          className="shrink-0 text-[#c5f66a]"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                activeConversation.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#c5f66a]/10 text-[#c5f66a]">
                        <Bot size={17} />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-7 ${
                        message.role === 'user'
                          ? 'rounded-br-sm bg-[#c5f66a] text-[#10120f]'
                          : 'rounded-bl-sm bg-white/[0.06] text-white/85'
                      }`}
                    >
                      {message.role === 'assistant' ? (
  <div className="prose prose-invert prose-sm max-w-none break-words
    prose-headings:font-semibold prose-headings:text-white
    prose-p:text-white/80 prose-strong:text-[#c5f66a]
    prose-li:text-white/80 prose-ul:my-3 prose-ol:my-3
    prose-hr:border-white/10">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {message.content}
    </ReactMarkdown>
  </div>
) : (
  message.content
)}
                    </div>

                    {message.role === 'user' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/60">
                        <User size={16} />
                      </div>
                    )}
                  </div>
                ))
              )}

              {sending && (
                <div className="flex items-center gap-3 text-sm text-white/45">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#c5f66a]/10 text-[#c5f66a]">
                    <Bot size={17} />
                  </div>
                  <LoaderCircle size={16} className="animate-spin" />
                  FitSaathi is thinking...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault()
                void handleSend()
              }}
              className="border-t border-white/[0.08] p-4 sm:p-5"
            >
              <div className="flex items-end gap-3 rounded-2xl border border-white/10 bg-[#10120f] p-2">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      void handleSend()
                    }
                  }}
                  placeholder="Ask your fitness coach anything..."
                  rows={2}
                  maxLength={4000}
                  disabled={sending}
                  className="max-h-36 min-h-12 flex-1 resize-y bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  aria-label="Send message"
                  className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c5f66a] text-[#10120f] transition hover:bg-[#d7ff91] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {sending ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
              <p className="mt-2 text-center text-[11px] text-white/30">
                General fitness guidance only. Not a substitute for medical
                advice. Press Enter to send; Shift + Enter for a new line.
              </p>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
