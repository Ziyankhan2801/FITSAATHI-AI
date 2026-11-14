
import {
  Activity,
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserRound,
  Loader2,
  AlertCircle,
  Download,
  Trash2,
  AlertTriangle,
  LockKeyhole,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import {
  getPrivacyConsents,
  updatePrivacyConsent,
  exportMyData,
  deleteMyAccount,
  type ConsentType,
  type PrivacyConsent,
} from '../../services/api'

const consentOptions: {
  type: ConsentType
  title: string
  description: string
  icon: typeof Camera
}[] = [
  {
    type: 'photo_storage',
    title: 'Progress Photo Storage',
    description:
      'Allow FitSaathi to store your progress photos so you can review your fitness journey over time.',
    icon: Camera,
  },
  {
    type: 'ai_analysis',
    title: 'AI Photo Analysis',
    description:
      'Allow AI features to analyze photos you choose to submit for fitness-related visual feedback.',
    icon: Sparkles,
  },
  {
    type: 'ai_chat',
    title: 'AI Fitness Coach',
    description:
      'Allow the AI Fitness Coach to process the messages you send during coaching conversations.',
    icon: MessageCircle,
  },
  {
    type: 'ai_profile_context',
    title: 'AI Profile Context',
    description:
      'Allow the AI Coach to use your fitness profile and preferences for more personalized responses.',
    icon: UserRound,
  },
]

export default function Settings() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [consents, setConsents] = useState<PrivacyConsent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadingError, setLoadingError] = useState('')
  const [savingType, setSavingType] = useState<ConsentType | null>(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [saveError, setSaveError] = useState('')

  const [exporting, setExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState('')
  const [exportError, setExportError] = useState('')

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (location.hash !== '#privacy-settings') return

    document.getElementById('privacy-settings')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }, [location.hash])

  useEffect(() => {
    let isMounted = true

    async function loadSettings() {
      try {
        setIsLoading(true)
        setLoadingError('')

        const data = await getPrivacyConsents()

        if (isMounted) {
          setConsents(data)
        }
      } catch (error) {
        if (isMounted) {
          setLoadingError(
            error instanceof Error
              ? error.message
              : 'Unable to load privacy settings.',
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadSettings()

    return () => {
      isMounted = false
    }
  }, [])

  function isConsentGranted(type: ConsentType) {
    return (
      consents.find((item) => item.consent_type === type)?.is_granted ??
      false
    )
  }

  async function handleConsentChange(
    type: ConsentType,
    isGranted: boolean,
  ) {
    if (savingType) return

    setSavingType(type)
    setSuccessMessage('')
    setSaveError('')

    try {
      const updatedConsent = await updatePrivacyConsent(type, isGranted)

      setConsents((previous) => {
        const existing = previous.find(
          (item) => item.consent_type === type,
        )

        if (existing) {
          return previous.map((item) =>
            item.consent_type === type ? updatedConsent : item,
          )
        }

        return [...previous, updatedConsent]
      })

      setSuccessMessage(
        `${consentOptions.find((item) => item.type === type)?.title} ${
          isGranted ? 'enabled' : 'disabled'
        } successfully.`,
      )
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Unable to update this privacy setting.',
      )
    } finally {
      setSavingType(null)
    }
  }

  async function handleExportData() {
    setExporting(true)
    setExportMessage('')
    setExportError('')

    try {
      await exportMyData()
      setExportMessage('Your data export has started successfully.')
    } catch (error) {
      setExportError(
        error instanceof Error
          ? error.message
          : 'Unable to export your data. Please try again.',
      )
    } finally {
      setExporting(false)
    }
  }

  async function handleDeleteAccount(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!deletePassword) {
      setDeleteError('Please enter your password.')
      return
    }

    setDeleting(true)
    setDeleteError('')

    try {
      await deleteMyAccount(deletePassword)

      setShowDeleteDialog(false)
      navigate('/login', {
        replace: true,
        state: {
          message: 'Your FitSaathi account has been deleted successfully.',
        },
      })
    } catch (error) {
      setDeleteError(
        error instanceof Error
          ? error.message
          : 'Unable to delete your account. Please try again.',
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/dashboard"
            className="mb-4 inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-[#c5f66a]"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>

          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Settings
          </h1>

          <p className="mt-2 text-sm text-white/45">
            Manage your account, fitness profile and privacy preferences.
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#c5f66a]/20 bg-[#c5f66a]/10 text-[#c5f66a]">
          <ShieldCheck size={24} />
        </div>
      </div>

      {/* Account Information */}
      <section className="rounded-2xl border border-white/10 bg-[#171a15] p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-white/5 p-2.5 text-[#c5f66a]">
            <UserRound size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-white">
              Account Information
            </h2>
            <p className="text-xs text-white/40">
              Your registered FitSaathi account details
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/5 bg-black/20 p-4">
            <p className="text-xs text-white/40">Username</p>
            <p className="mt-2 break-all text-sm font-medium text-white">
              {user?.username || 'Not available'}
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-black/20 p-4">
            <p className="text-xs text-white/40">Email Address</p>
            <p className="mt-2 break-all text-sm font-medium text-white">
              {user?.email || 'Not available'}
            </p>
          </div>

          <div className="rounded-xl border border-white/5 bg-black/20 p-4 sm:col-span-2">
            <p className="text-xs text-white/40">Account ID</p>
            <p className="mt-2 text-sm font-medium text-white">
              {user?.id ?? 'Not available'}
            </p>
          </div>
        </div>
      </section>

      {/* Data Export */}
      <section className="rounded-2xl border border-white/10 bg-[#171a15] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-white/5 p-2.5 text-[#c5f66a]">
              <Download size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-white">
                Export My Data
              </h2>
              <p className="mt-1 text-xs leading-5 text-white/40">
                Download a JSON copy of your FitSaathi account data,
                fitness records and saved progress.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportData}
            disabled={exporting}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#c5f66a]/20 bg-[#c5f66a]/10 px-4 py-2.5 text-sm font-medium text-[#c5f66a] transition hover:bg-[#c5f66a]/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {exporting ? 'Preparing...' : 'Download my data'}
          </button>
        </div>

        {exportMessage && (
          <p
            role="status"
            className="mt-4 text-sm text-[#c5f66a]"
          >
            {exportMessage}
          </p>
        )}

        {exportError && (
          <p role="alert" className="mt-4 text-sm text-red-300">
            {exportError}
          </p>
        )}
      </section>

      {/* Fitness Profile */}
      <section className="rounded-2xl border border-white/10 bg-[#171a15] p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/5 p-2.5 text-[#c5f66a]">
              <Activity size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-white">
                Fitness Profile
              </h2>
              <p className="text-xs text-white/40">
                Update your body details, goals and workout preferences.
              </p>
            </div>
          </div>

          <Link
            to="/dashboard/assessment"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#c5f66a]/20 bg-[#c5f66a]/10 px-4 py-2.5 text-sm font-medium text-[#c5f66a] transition hover:bg-[#c5f66a]/20"
          >
            Manage Profile
            <ChevronRight size={16} />
          </Link>
        </div>
      </section>

      {/* Privacy Settings */}
      <section
        id="privacy-settings"
        className="scroll-mt-6 rounded-2xl border border-white/10 bg-[#171a15] p-5 sm:p-6"
      >
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-xl bg-white/5 p-2.5 text-[#c5f66a]">
            <ShieldCheck size={20} />
          </div>

          <div>
            <h2 className="font-semibold text-white">
              Privacy & AI Permissions
            </h2>
            <p className="mt-1 text-xs leading-5 text-white/40">
              You control how FitSaathi stores and uses your information.
              You can change these permissions whenever you want.
            </p>
          </div>
        </div>

        {successMessage && (
          <div
            role="status"
            className="mb-4 flex items-center gap-2 rounded-xl border border-[#c5f66a]/20 bg-[#c5f66a]/10 p-3 text-sm text-[#c5f66a]"
          >
            <Check size={17} />
            {successMessage}
          </div>
        )}

        {saveError && (
          <div
            role="alert"
            className="mb-4 flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300"
          >
            <AlertCircle size={17} />
            {saveError}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-12 text-sm text-white/50">
            <Loader2 size={20} className="animate-spin" />
            Loading privacy settings...
          </div>
        ) : loadingError ? (
          <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-4">
            <p className="text-sm text-red-300">{loadingError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 text-sm font-medium text-[#c5f66a] hover:underline"
            >
              Reload settings
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {consentOptions.map((option) => {
              const Icon = option.icon
              const granted = isConsentGranted(option.type)
              const isSaving = savingType === option.type

              return (
                <div
                  key={option.type}
                  className="flex flex-col gap-4 rounded-xl border border-white/5 bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-0.5 rounded-lg bg-white/5 p-2 text-[#c5f66a]">
                      <Icon size={18} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white">
                        {option.title}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-white/40">
                        {option.description}
                      </p>
                      <p
                        className={`mt-2 text-xs font-medium ${
                          granted ? 'text-[#c5f66a]' : 'text-white/35'
                        }`}
                      >
                        {granted ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                    {isSaving && (
                      <Loader2
                        size={16}
                        className="animate-spin text-[#c5f66a]"
                      />
                    )}

                    <button
                      type="button"
                      role="switch"
                      aria-checked={granted}
                      aria-label={`${
                        granted ? 'Disable' : 'Enable'
                      } ${option.title}`}
                      disabled={savingType !== null}
                      onClick={() =>
                        handleConsentChange(option.type, !granted)
                      }
                      className={`relative h-7 w-12 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        granted ? 'bg-[#c5f66a]' : 'bg-white/15'
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                          granted ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p className="mt-5 text-xs leading-5 text-white/30">
          Disabling a permission prevents future use covered by that
          permission. It does not automatically delete previously stored
          photos, conversations or other records. Manage or delete stored
          data through the relevant app features where available.
        </p>
      </section>

      {/* Danger Zone */}
      <section className="rounded-2xl border border-red-400/20 bg-[#171a15] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-red-400/10 p-2.5 text-red-400">
            <AlertTriangle size={20} />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-red-300">
              Delete My Account
            </h2>

            <p className="mt-1 text-xs leading-5 text-white/40">
              Permanently delete your FitSaathi account and associated
              personal data, including fitness records, workout history,
              conversations and stored progress photos.
            </p>

            <button
              type="button"
              onClick={() => {
                setDeleteError('')
                setDeletePassword('')
                setShowDeleteDialog(true)
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-400/20"
            >
              <Trash2 size={16} />
              Delete account
            </button>
          </div>
        </div>
      </section>

      {/* Security note */}
      <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <ShieldCheck
          size={18}
          className="mt-0.5 shrink-0 text-[#c5f66a]"
        />
        <p className="text-xs leading-5 text-white/40">
          Your privacy matters. AI profile context is a separate optional
          permission from AI chat processing. Changing one permission does
          not automatically change the others.
        </p>
      </div>

      {/* Delete Account Confirmation Dialog */}
      {showDeleteDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setShowDeleteDialog(false)
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="w-full max-w-md rounded-2xl border border-red-400/20 bg-[#191c17] p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-xl bg-red-400/10 p-3 text-red-400">
                <AlertTriangle size={22} />
              </div>

              <div>
                <h2
                  id="delete-dialog-title"
                  className="font-semibold text-white"
                >
                  Permanently delete account?
                </h2>
                <p className="text-xs text-red-300">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <p className="mb-5 text-sm leading-6 text-white/50">
              Your account and associated personal records will be
              permanently deleted. Enter your current password to confirm.
            </p>

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label
                  htmlFor="deletePassword"
                  className="mb-2 block text-sm text-white/75"
                >
                  Current password
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#10120f] px-4 focus-within:border-red-400/50">
                  <LockKeyhole
                    size={18}
                    className="shrink-0 text-white/40"
                  />

                  <input
                    id="deletePassword"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={deletePassword}
                    onChange={(event) =>
                      setDeletePassword(event.target.value)
                    }
                    placeholder="Enter your current password"
                    className="min-w-0 flex-1 bg-transparent py-3.5 text-sm text-white outline-none placeholder:text-white/30"
                  />
                </div>
              </div>

              {deleteError && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300"
                >
                  {deleteError}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => setShowDeleteDialog(false)}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={deleting || !deletePassword}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting && (
                    <Loader2 size={16} className="animate-spin" />
                  )}
                  {deleting ? 'Deleting...' : 'Permanently delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
