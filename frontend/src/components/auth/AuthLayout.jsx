import { BarChart3, Bot, Briefcase, MessageSquare } from "lucide-react";
import Logo from "../ui/Logo";

const highlights = [
  {
    icon: Briefcase,
    title: "Track every application",
    text: "A kanban pipeline from Applied to Offer, with interview reminders.",
  },
  {
    icon: Bot,
    title: "AI career assistant",
    text: "Gemini-powered chat for stats, top jobs and company research.",
  },
  {
    icon: MessageSquare,
    title: "Talk to companies",
    text: "Message hiring teams directly on any listed role.",
  },
  {
    icon: BarChart3,
    title: "Measure what works",
    text: "Analytics on response rates, monthly volume and outcomes.",
  },
];

const AuthLayout = ({ children }) => (
  <div className="min-h-screen bg-bg grid lg:grid-cols-[1.05fr_1fr]">
    <section className="hidden lg:flex flex-col justify-between p-12 xl:p-16 bg-surface border-r border-line">
      <Logo size="lg" showTagline />

      <div className="max-w-md">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">
          Job search, organised
        </p>
        <h2 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-fg leading-[1.1]">
          Land your next role with clarity and confidence.
        </h2>
        <p className="mt-5 text-fg-muted text-lg leading-relaxed">
          JobSaathi keeps your applications, interviews, conversations and
          insights in one calm, focused workspace.
        </p>

        <ul className="mt-10 space-y-5">
          {highlights.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <Icon size={18} />
              </div>
              <div>
                <p className="font-semibold text-fg">{title}</p>
                <p className="text-sm text-fg-muted">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-fg-subtle">
        © {new Date().getFullYear()} JobSaathi. Built for ambitious job seekers.
      </p>
    </section>

    <section className="flex items-center justify-center p-6 sm:p-10">
      <div className="w-full max-w-md animate-rise">
        <div className="lg:hidden mb-8">
          <Logo size="lg" showTagline />
        </div>
        {children}
      </div>
    </section>
  </div>
);

export default AuthLayout;
