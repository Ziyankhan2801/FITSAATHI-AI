
import { useState } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  Check,
  ChevronRight,
  Dumbbell,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'

const features = [
  {
    number: '01',
    icon: Activity,
    title: 'Your fitness, understood.',
    description:
      'Start with your current fitness level, goals, available time, and equipment. Build a plan around your life.',
    tag: 'PERSONAL ASSESSMENT',
  },
  {
    number: '02',
    icon: Dumbbell,
    title: 'Work out at your pace.',
    description:
      'Follow beginner-friendly exercises with clear instructions, sets, reps, and rest periods.',
    tag: 'HOME WORKOUTS',
  },
  {
    number: '03',
    icon: BrainCircuit,
    title: 'Guidance that adapts.',
    description:
      'Get fitness guidance and gradually adjust your routine using your recorded performance and recovery feedback.',
    tag: 'AI FITNESS COACH',
  },
]

const steps = [
  {
    number: '01',
    title: 'Know your starting point',
    description: 'Tell us about your goals, routine, experience, and equipment.',
  },
  {
    number: '02',
    title: 'Get your personal plan',
    description: 'Follow a practical workout plan designed around your starting ability.',
  },
  {
    number: '03',
    title: 'Build your consistency',
    description: 'Log workouts, review real progress, and adjust as you improve.',
  },
]

function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="min-h-screen overflow-hidden bg-[#10120f] text-[#f4f5f0]">
      <header className="relative z-20 border-b border-white/[0.08]">
        <nav
          className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-14"
          aria-label="Main navigation"
        >
          <a
            href="#home"
            onClick={closeMenu}
            className="flex items-center gap-3"
            aria-label="FitSaathi AI home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c5f66a] text-[#10120f]">
              <Activity size={23} strokeWidth={2.5} />
            </span>
            <span className="text-lg font-bold tracking-tight">
              FitSaathi<span className="text-[#c5f66a]">.ai</span>
            </span>
          </a>

          <div className="hidden items-center gap-8 text-sm text-white/65 md:flex">
            <a className="transition hover:text-white" href="#features">
              Features
            </a>
            <a className="transition hover:text-white" href="#how-it-works">
              How it works
            </a>
            <a className="transition hover:text-white" href="#our-approach">
              Our approach
            </a>
          </div>

          <a
            href="#get-started"
            className="hidden items-center gap-2 rounded-full bg-[#c5f66a] px-5 py-3 text-sm font-semibold text-[#10120f] transition hover:bg-[#d6ff8c] sm:flex"
          >
            Start your journey <ArrowRight size={16} />
          </a>

          <button
            type="button"
            className="rounded-lg border border-white/10 p-2 md:hidden"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {menuOpen && (
          <div className="flex flex-col gap-5 border-t border-white/10 px-5 py-6 text-sm text-white/75 md:hidden">
            <a href="#features" onClick={closeMenu}>Features</a>
            <a href="#how-it-works" onClick={closeMenu}>How it works</a>
            <a href="#our-approach" onClick={closeMenu}>Our approach</a>
            <a
              href="#get-started"
              onClick={closeMenu}
              className="flex items-center justify-center gap-2 rounded-full bg-[#c5f66a] px-5 py-3 font-semibold text-[#10120f]"
            >
              Start your journey <ArrowRight size={16} />
            </a>
          </div>
        )}
      </header>

      <main>
        <section
          id="home"
          className="relative mx-auto grid max-w-[1440px] items-center gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:px-14 lg:pb-28 lg:pt-28"
        >
          <div className="pointer-events-none absolute -left-48 top-20 h-96 w-96 rounded-full bg-[#c5f66a]/[0.06] blur-[120px]" />

          <div className="relative z-10">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#c5f66a]/25 bg-[#c5f66a]/[0.07] px-4 py-2 text-xs font-medium tracking-wide text-[#c5f66a]">
              <Sparkles size={15} />
              YOUR JOURNEY. YOUR PACE.
            </div>

            <h1 className="max-w-3xl text-5xl leading-[1.06] font-semibold tracking-[-0.055em] sm:text-6xl lg:text-[76px]">
              Stronger starts
              <br />
              <span className="text-white/45">with one small</span>
              <br />
              <span className="text-[#c5f66a]">step at home.</span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-8 text-white/55 sm:text-lg">
              Meet your personal home fitness companion. Get beginner-friendly
              workouts, practical guidance, and a plan that grows with you.
              No gym required.
            </p>

            <div
              id="get-started"
              className="mt-9 flex flex-col gap-3 sm:flex-row"
            >
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-3 rounded-full bg-[#c5f66a] px-7 py-4 font-semibold text-[#10120f] transition hover:bg-[#d6ff8c]"
              >
                Explore your journey <ArrowRight size={18} />
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-7 py-4 font-medium text-white/80 transition hover:border-white/35 hover:bg-white/[0.04]"
              >
                Discover FitSaathi <ChevronRight size={17} />
              </a>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/55">
              <span className="flex items-center gap-2">
                <Check size={16} className="text-[#c5f66a]" />
                Beginner-friendly
              </span>
              <span className="flex items-center gap-2">
                <Check size={16} className="text-[#c5f66a]" />
                Home-based
              </span>
              <span className="flex items-center gap-2">
                <Check size={16} className="text-[#c5f66a]" />
                Your own pace
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[540px] lg:ml-auto">
            <div className="absolute inset-10 rounded-full bg-[#c5f66a]/10 blur-[90px]" />

            <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#191c17] p-5 shadow-2xl sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs tracking-[0.2em] text-white/40">
                    YOUR PERSONAL SPACE
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">
                    Every step counts.
                  </h2>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#c5f66a]/10 text-[#c5f66a]">
                  <Activity size={23} />
                </div>
              </div>

              <div className="mt-7 rounded-2xl border border-white/[0.07] bg-[#11130f] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-white/45">Your first milestone</p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">
                      Start where you are.
                    </p>
                  </div>
                  <span className="rounded-full bg-[#c5f66a]/10 px-3 py-1 text-xs text-[#c5f66a]">
                    Day one
                  </span>
                </div>

                <div className="mt-7 grid grid-cols-3 gap-3">
                  {[
                    { value: 'Your', label: 'Starting point' },
                    { value: 'Your', label: 'Own schedule' },
                    { value: 'Your', label: 'Own pace' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3 sm:p-4"
                    >
                      <p className="text-lg font-semibold text-[#c5f66a]">
                        {item.value}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-white/45">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex items-center gap-3 rounded-xl bg-white/[0.035] p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#c5f66a]/10 text-[#c5f66a]">
                    <Dumbbell size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Your first workout</p>
                    <p className="mt-1 text-xs text-white/40">
                      Begin with simple movements
                    </p>
                  </div>
                  <ArrowUpRight size={18} className="text-white/45" />
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3 px-1">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#c5f66a]/20 bg-[#c5f66a]/10 text-[#c5f66a]">
                  <ShieldCheck size={20} />
                </div>
                <p className="text-xs leading-6 text-white/45">
                  Progress at a pace that respects your ability and recovery.
                </p>
              </div>
            </div>

            <div className="absolute -right-2 -top-5 hidden items-center gap-2 rounded-2xl border border-white/10 bg-[#20241d] px-4 py-3 shadow-xl sm:flex lg:-right-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c5f66a]/10 text-[#c5f66a]">
                <Sparkles size={16} />
              </span>
              <span className="text-sm font-medium">Made for beginners</span>
            </div>

            <div className="absolute -bottom-5 -left-2 hidden items-center gap-2 rounded-2xl border border-white/10 bg-[#20241d] px-4 py-3 shadow-xl sm:flex lg:-left-5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#c5f66a]/10 text-[#c5f66a]">
                <Activity size={16} />
              </span>
              <span className="text-sm font-medium">One day at a time</span>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="border-y border-white/[0.07] bg-[#151713] px-5 py-20 sm:px-8 lg:px-14 lg:py-24"
        >
          <div className="mx-auto max-w-[1312px]">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="text-xs font-semibold tracking-[0.22em] text-[#c5f66a]">
                  BUILT AROUND YOU
                </p>
                <h2 className="mt-4 max-w-2xl text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
                  Fitness that fits
                  <br className="hidden sm:block" /> your real life.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-7 text-white/50 sm:text-base">
                Less pressure to be perfect. More support for building habits
                you can actually maintain.
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon

                return (
                  <article
                    key={feature.number}
                    className="group rounded-2xl border border-white/[0.08] bg-[#1a1d17] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#c5f66a]/30 sm:p-8"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c5f66a]/10 text-[#c5f66a] transition group-hover:bg-[#c5f66a] group-hover:text-[#10120f]">
                        <Icon size={23} />
                      </div>
                      <span className="text-sm text-white/25">
                        {feature.number}
                      </span>
                    </div>

                    <p className="mt-8 text-[10px] font-semibold tracking-[0.16em] text-[#c5f66a]">
                      {feature.tag}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-white/50">
                      {feature.description}
                    </p>
                    <a
                      href="#how-it-works"
                      className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-white/70 transition group-hover:text-[#c5f66a]"
                    >
                      Learn more <ArrowDownRight size={16} />
                    </a>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="mx-auto max-w-[1312px] px-5 py-20 sm:px-8 lg:px-14 lg:py-28"
        >
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold tracking-[0.22em] text-[#c5f66a]">
              SIMPLE BY DESIGN
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Three steps. One new habit.
            </h2>
            <p className="mt-5 text-sm leading-7 text-white/50 sm:text-base">
              You don't need to know everything to get started. You just need
              a starting point.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
            {steps.map((step, index) => (
              <div key={step.number} className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#c5f66a]/30 text-sm font-semibold text-[#c5f66a]">
                  {step.number}
                </div>
                <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-7 text-white/50">
                  {step.description}
                </p>
                {index < steps.length - 1 && (
                  <ArrowRight
                    size={22}
                    className="absolute right-2 top-3 hidden text-white/20 md:block"
                  />
                )}
              </div>
            ))}
          </div>
        </section>

        <section id="our-approach" className="px-5 pb-20 sm:px-8 lg:px-14 lg:pb-28">
          <div className="mx-auto flex max-w-[1312px] flex-col justify-between gap-8 rounded-[28px] border border-[#c5f66a]/20 bg-[#c5f66a]/[0.055] p-7 sm:p-10 lg:flex-row lg:items-center lg:p-14">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-sm font-medium text-[#c5f66a]">
                <ShieldCheck size={19} /> A MORE THOUGHTFUL APPROACH
              </div>
              <h2 className="mt-5 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
                Your progress is personal.
                <br />
                Your plan should be too.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
                FitSaathi AI is being built around realistic routines,
                gradual progression, and honest progress tracking. No
                guaranteed transformations. No pressure to train through pain.
              </p>
            </div>
            <a
              href="#get-started"
              className="inline-flex shrink-0 items-center justify-center gap-3 self-start rounded-full bg-[#c5f66a] px-6 py-4 font-semibold text-[#10120f] transition hover:bg-[#d6ff8c] lg:self-center"
            >
              Take the first step <ArrowUpRight size={18} />
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.08] px-5 py-8 sm:px-8 lg:px-14">
        <div className="mx-auto flex max-w-[1312px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <a href="#home" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c5f66a] text-[#10120f]">
              <Activity size={20} />
            </span>
            <span className="font-bold">
              FitSaathi<span className="text-[#c5f66a]">.ai</span>
            </span>
          </a>
          <p className="text-xs leading-6 text-white/40">
            Your journey, your pace. Built for everyday progress.
          </p>
          <a
            href="#home"
            className="text-sm text-white/55 transition hover:text-[#c5f66a]"
          >
            Back to top ↑
          </a>
        </div>
        <p className="mx-auto mt-6 max-w-[1312px] text-xs leading-6 text-white/30">
          FitSaathi AI provides general fitness guidance and is not a substitute
          for professional medical advice.
        </p>
      </footer>
    </div>
  )
}

export default App
