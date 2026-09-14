import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  CirclePause,
  Cpu,
  Download,
  Filter,
  LayoutDashboard,
  Lightbulb,
  Menu,
  Moon,
  MoreHorizontal,
  Pause,
  Play,
  Rocket,
  Search,
  Sparkles,
  Sun,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";

type Status = "active" | "learning" | "paused";
type Range = "7d" | "14d" | "30d";
type NavId = "overview" | "campaigns" | "insights" | "creatives";

type Campaign = {
  id: string;
  name: string;
  channel: string;
  status: Status;
  spend: number;
  installs: number;
  cpi: number;
  roas: number;
  trend: number;
};

type Insight = {
  id: string;
  title: string;
  body: string;
  impact: string;
  action: "pause" | "scale" | "refresh";
  campaignId: string;
};

const USER = {
  name: "Timotej Zaevski",
  role: "UA Lead · Glow Sculpt",
  initials: "TZ",
};

const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: "gs-tt-asmr",
    name: "Glow Sculpt · TikTok ASMR",
    channel: "TikTok",
    status: "active",
    spend: 12840,
    installs: 14210,
    cpi: 0.9,
    roas: 3.4,
    trend: 12.4,
  },
  {
    id: "gs-meta-tf",
    name: "Glow Sculpt · Meta Transform",
    channel: "Meta",
    status: "active",
    spend: 9640,
    installs: 8120,
    cpi: 1.19,
    roas: 2.5,
    trend: 4.2,
  },
  {
    id: "gs-yt-shorts",
    name: "Glow Sculpt · YouTube Shorts",
    channel: "YouTube",
    status: "active",
    spend: 7320,
    installs: 6980,
    cpi: 1.05,
    roas: 2.2,
    trend: -1.6,
  },
  {
    id: "gs-uac",
    name: "Glow Sculpt · Google UAC",
    channel: "Google",
    status: "learning",
    spend: 5480,
    installs: 4010,
    cpi: 1.37,
    roas: 1.9,
    trend: 8.1,
  },
  {
    id: "gs-meta-lal",
    name: "Glow Sculpt · Meta Lookalike",
    channel: "Meta",
    status: "paused",
    spend: 6120,
    installs: 3280,
    cpi: 1.87,
    roas: 0.85,
    trend: -18.4,
  },
  {
    id: "gs-tt-ch",
    name: "Glow Sculpt · TikTok Challenge",
    channel: "TikTok",
    status: "active",
    spend: 3800,
    installs: 3720,
    cpi: 1.02,
    roas: 2.37,
    trend: 6.8,
  },
];

const INITIAL_INSIGHTS: Insight[] = [
  {
    id: "i1",
    title: "Pause Meta Lookalike",
    body: "ROAS is 0.85x over the last 14 days with $6.1k spend. CPI is 67% above account average. Continuing this set will drag blended ROAS below 2.3x.",
    impact: "Protect ~$1.8k / week",
    action: "pause",
    campaignId: "gs-meta-lal",
  },
  {
    id: "i2",
    title: "Scale TikTok ASMR",
    body: "Highest-efficiency set at 3.4x ROAS and $0.90 CPI. Frequency is still 1.8. A 20% budget lift is within the current learning envelope.",
    impact: "+$2.4k projected revenue",
    action: "scale",
    campaignId: "gs-tt-asmr",
  },
  {
    id: "i3",
    title: "Refresh Google UAC creatives",
    body: "The campaign is stuck in learning with CPI $1.37. Hook fatigue is likely. Swap in transformation + ASMR variants and keep budget stable for 3 days.",
    impact: "Exit learning faster",
    action: "refresh",
    campaignId: "gs-uac",
  },
  {
    id: "i4",
    title: "Reallocate YouTube to Challenge",
    body: "YouTube Shorts is slightly negative week-over-week. TikTok Challenge is 2.37x with unused headroom. Move 15% of YT spend.",
    impact: "Lift blended ROAS +0.08x",
    action: "scale",
    campaignId: "gs-tt-ch",
  },
];

const NAV = [
  { id: "overview" as const, label: "Overview", icon: LayoutDashboard },
  { id: "campaigns" as const, label: "Campaigns", icon: Activity },
  { id: "insights" as const, label: "AI Insights", icon: Sparkles },
  { id: "creatives" as const, label: "Creatives", icon: Lightbulb },
];

function money(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n >= 100 ? 0 : 2,
  });
}

function compact(n: number) {
  if (n >= 10000) return `${(n / 1000).toFixed(1)}K`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toLocaleString("en-US");
}

function buildSeries(days: number) {
  const points: { label: string; spend: number; revenue: number }[] = [];
  for (let i = 0; i < days; i++) {
    const wave = Math.sin(i / 2.6);
    const spend = Math.round(1180 + wave * 160 + (i % 6) * 38);
    const roas = 2.18 + Math.cos(i / 3.1) * 0.42;
    points.push({
      label: `D${i + 1}`,
      spend,
      revenue: Math.round(spend * roas),
    });
  }
  return points;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 shadow-[var(--shadow-border)]">
      <p className="mb-1 font-mono text-xs text-muted">{label}</p>
      {payload.map((item) => (
        <p key={item.name} className="font-mono text-sm tabular-nums text-fg">
          <span className="mr-2 inline-block size-1.5 rounded-full" style={{ background: item.color }} />
          {item.name}: {item.name === "ROAS" ? `${item.value.toFixed(2)}x` : money(item.value)}
        </p>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const map = {
    active: "bg-positive/15 text-positive",
    learning: "bg-warning/15 text-warning",
    paused: "bg-muted/15 text-muted",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize",
        map[status],
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "active" && "bg-positive",
          status === "learning" && "bg-warning",
          status === "paused" && "bg-muted",
        )}
      />
      {status}
    </span>
  );
}

export function Dashboard() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [range, setRange] = useState<Range>("14d");
  const [nav, setNav] = useState<NavId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [campaigns, setCampaigns] = useState(INITIAL_CAMPAIGNS);
  const [insights, setInsights] = useState(INITIAL_INSIGHTS);
  const [selected, setSelected] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [detail, setDetail] = useState<Campaign | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const days = range === "7d" ? 7 : range === "14d" ? 14 : 30;
  const series = useMemo(() => buildSeries(days), [days]);

  const totals = useMemo(() => {
    const spend = campaigns.reduce((s, c) => s + c.spend, 0);
    const installs = campaigns.reduce((s, c) => s + c.installs, 0);
    const revenue = campaigns.reduce((s, c) => s + c.spend * c.roas, 0);
    return {
      spend,
      installs,
      cpi: spend / installs,
      roas: revenue / spend,
    };
  }, [campaigns]);

  const filtered = campaigns.filter((c) => {
    const q = query.trim().toLowerCase();
    const matchQ = !q || c.name.toLowerCase().includes(q) || c.channel.toLowerCase().includes(q);
    const matchS = statusFilter === "all" || c.status === statusFilter;
    return matchQ && matchS;
  });

  const roasBars = campaigns.map((c) => ({
    name: c.channel === "Google" ? "UAC" : c.name.split("·")[1]?.trim() ?? c.channel,
    ROAS: c.roas,
    fillId: c.id,
  }));

  function notify(msg: string) {
    setToast(msg);
  }

  function applyInsight(insight: Insight) {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id !== insight.campaignId) return c;
        if (insight.action === "pause") return { ...c, status: "paused" as const };
        if (insight.action === "scale")
          return { ...c, spend: Math.round(c.spend * 1.2), installs: Math.round(c.installs * 1.16), status: "active" };
        return { ...c, status: "learning" as const };
      }),
    );
    setInsights((prev) => prev.filter((i) => i.id !== insight.id));
    notify(`Applied: ${insight.title}`);
  }

  function togglePause(id: string) {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: c.status === "paused" ? "active" : "paused" } : c,
      ),
    );
    const c = campaigns.find((x) => x.id === id);
    notify(c?.status === "paused" ? `Resumed ${c.name}` : `Paused ${c?.name ?? "campaign"}`);
    setMenuFor(null);
  }

  function scaleCampaign(id: string) {
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, spend: Math.round(c.spend * 1.15), installs: Math.round(c.installs * 1.12) } : c,
      ),
    );
    notify("Budget increased 15%");
    setMenuFor(null);
  }

  const kpis = [
    {
      label: "Total Spend",
      value: money(totals.spend),
      delta: 8.2,
      icon: Wallet,
      hint: "vs previous period",
    },
    {
      label: "Avg ROAS",
      value: `${totals.roas.toFixed(1)}x`,
      delta: 14.2,
      icon: TrendingUp,
      hint: "blended, last period",
    },
    {
      label: "Avg CPI",
      value: `$${totals.cpi.toFixed(2)}`,
      delta: -6.1,
      invert: true,
      icon: Download,
      hint: "lower is better",
    },
    {
      label: "Installs",
      value: compact(totals.installs),
      delta: 11.4,
      icon: Rocket,
      hint: "attributed installs",
    },
  ];

  return (
    <div className="min-h-screen bg-bg text-fg">
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-bg/70 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface px-4 py-5 transition-transform duration-200 ease-out",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="mb-8 flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-md bg-accent text-accent-fg">
              <Cpu className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-tight">Lumen</p>
              <p className="text-xs text-subtle">Performance UA</p>
            </div>
          </div>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-md text-muted lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = nav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setNav(item.id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-150",
                  active ? "bg-elevated text-fg" : "text-muted hover:bg-elevated/70 hover:text-fg",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="rounded-lg border border-border bg-elevated/60 p-3">
          <p className="text-xs font-medium text-muted">Account health</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-2 animate-ping rounded-full bg-positive opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-positive" />
            </span>
            <span className="text-sm">Live bidding</span>
          </div>
          <p className="mt-1 text-xs text-subtle">4 networks · 6 campaigns</p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-bg/90 px-4 py-3 backdrop-blur-sm sm:px-6">
          <button
            type="button"
            className="grid size-11 place-items-center rounded-md text-fg lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold tracking-tight">Glow Sculpt · UA cockpit</p>
            <p className="hidden text-xs text-subtle sm:block">Simulated marketing data for portfolio review</p>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {(["7d", "14d", "30d"] as Range[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={cn(
                  "min-h-11 rounded-md px-3 text-xs font-medium uppercase tracking-wide transition-colors duration-150",
                  range === r ? "bg-elevated text-fg" : "text-muted hover:text-fg",
                )}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="hidden items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-muted sm:inline-flex">
              <span className="size-1.5 rounded-full bg-positive" />
              AI online
            </span>
            <button
              type="button"
              className="grid size-11 place-items-center rounded-md text-muted hover:text-fg"
              aria-label="Notifications"
              onClick={() => notify("No new alerts")}
            >
              <Bell className="size-4" />
            </button>
            <button
              type="button"
              className="grid size-11 place-items-center rounded-md text-muted hover:text-fg"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <div className="ml-1 flex items-center gap-2 rounded-lg border border-border bg-surface py-1 pl-1 pr-3">
              <span className="grid size-8 place-items-center rounded-md bg-elevated font-mono text-xs font-medium">
                {USER.initials}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="text-xs font-medium">{USER.name}</p>
                <p className="text-xs text-subtle">{USER.role}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
          <div className="flex flex-wrap gap-2 md:hidden">
            {(["7d", "14d", "30d"] as Range[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={cn(
                  "min-h-11 rounded-md px-4 text-xs font-medium uppercase",
                  range === r ? "bg-elevated" : "border border-border",
                )}
              >
                {r}
              </button>
            ))}
          </div>

          {(nav === "overview" || nav === "creatives") && (
            <>
              {nav === "creatives" ? (
                <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-border)]">
                  <h2 className="text-lg font-semibold tracking-tight">Creative pipeline</h2>
                  <p className="mt-1 max-w-2xl text-sm text-muted">
                    Winning Glow Sculpt ads this period: ASMR close-ups, before/after glow reveals, and 20-second
                    challenge hooks. Refresh Google UAC first.
                  </p>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                    {[
                      { title: "ASMR carve 07", score: "3.8x" },
                      { title: "Glow reveal 12", score: "3.1x" },
                      { title: "Challenge 03", score: "2.6x" },
                    ].map((c) => (
                      <li key={c.title} className="rounded-lg bg-elevated p-4">
                        <p className="text-sm font-medium">{c.title}</p>
                        <p className="mt-1 font-mono text-xs text-muted">Predicted ROAS {c.score}</p>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((k) => {
                  const Icon = k.icon;
                  const good = k.invert ? k.delta < 0 : k.delta > 0;
                  return (
                    <article
                      key={k.label}
                      className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
                    >
                      <div className="flex items-start justify-between">
                        <p className="text-sm text-muted">{k.label}</p>
                        <span className="grid size-8 place-items-center rounded-md bg-elevated text-muted">
                          <Icon className="size-4" />
                        </span>
                      </div>
                      <p className="mt-3 font-mono text-3xl font-medium tracking-tight tabular-nums">{k.value}</p>
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span
                          className={cn(
                            "inline-flex items-center gap-0.5 font-medium",
                            good ? "text-positive" : "text-negative",
                          )}
                        >
                          {k.delta > 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                          {Math.abs(k.delta)}%
                        </span>
                        <span className="text-subtle">{k.hint}</span>
                      </div>
                    </article>
                  );
                })}
              </section>

              <section className="grid gap-3 xl:grid-cols-5">
                <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-border)] xl:col-span-3">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold tracking-tight">Spend vs revenue</h2>
                      <p className="text-sm text-muted">Daily attributed performance · {range}</p>
                    </div>
                  </div>
                  <div className="h-64 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="var(--color-chart-grid)" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: "var(--color-subtle)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "var(--color-subtle)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-muted)" }} />
                        <Line
                          type="monotone"
                          dataKey="spend"
                          name="Spend"
                          stroke="var(--color-chart-spend)"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          name="Revenue"
                          stroke="var(--color-chart-revenue)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-border)] xl:col-span-2">
                  <h2 className="text-base font-semibold tracking-tight">ROAS by campaign</h2>
                  <p className="mb-4 text-sm text-muted">Tap a bar to inspect the set</p>
                  <div className="h-64 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={roasBars} margin={{ top: 8, right: 8, left: 0, bottom: 16 }}>
                        <CartesianGrid stroke="var(--color-chart-grid)" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "var(--color-subtle)", fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          interval={0}
                          angle={-18}
                          textAnchor="end"
                          height={48}
                        />
                        <YAxis tick={{ fill: "var(--color-subtle)", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Bar
                          dataKey="ROAS"
                          name="ROAS"
                          fill="var(--color-chart-revenue)"
                          radius={[6, 6, 0, 0]}
                          cursor="pointer"
                          onClick={(_, index) => {
                            const c = campaigns[index];
                            if (c) {
                              setSelected(c.id);
                              setDetail(c);
                            }
                          }}
                          opacity={0.95}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </section>
            </>
          )}

          {(nav === "overview" || nav === "campaigns") && (
            <section className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow-border)] sm:p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">Campaign performance</h2>
                  <p className="text-sm text-muted">{filtered.length} sets in view</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <label className="relative block">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search campaigns"
                      className="h-11 w-full rounded-md border border-border bg-bg pr-3 pl-9 text-sm text-fg outline-none placeholder:text-subtle focus:ring-2 focus:ring-accent/40 sm:w-56"
                    />
                  </label>
                  <div className="flex items-center gap-1">
                    <Filter className="size-4 text-subtle" />
                    {(["all", "active", "learning", "paused"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatusFilter(s)}
                        className={cn(
                          "min-h-11 rounded-md px-3 text-xs font-medium capitalize",
                          statusFilter === s ? "bg-elevated" : "text-muted hover:text-fg",
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border text-xs uppercase tracking-wide text-subtle">
                    <tr>
                      <th className="py-3 pr-3 font-medium">Campaign</th>
                      <th className="py-3 pr-3 font-medium">Status</th>
                      <th className="py-3 pr-3 font-medium">Spend</th>
                      <th className="py-3 pr-3 font-medium">Installs</th>
                      <th className="py-3 pr-3 font-medium">CPI</th>
                      <th className="py-3 pr-3 font-medium">ROAS</th>
                      <th className="py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr
                        key={c.id}
                        className={cn(
                          "border-b border-border last:border-0",
                          selected === c.id && "bg-elevated/50",
                        )}
                      >
                        <td className="py-3 pr-3">
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-subtle">{c.channel}</p>
                        </td>
                        <td className="py-3 pr-3">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="py-3 pr-3 font-mono tabular-nums">{money(c.spend)}</td>
                        <td className="py-3 pr-3 font-mono tabular-nums">{c.installs.toLocaleString()}</td>
                        <td className="py-3 pr-3 font-mono tabular-nums">${c.cpi.toFixed(2)}</td>
                        <td className="py-3 pr-3">
                          <span
                            className={cn(
                              "font-mono tabular-nums",
                              c.roas >= 2 ? "text-positive" : c.roas < 1 ? "text-negative" : "text-warning",
                            )}
                          >
                            {c.roas.toFixed(2)}x
                          </span>
                          <span
                            className={cn(
                              "ml-2 text-xs",
                              c.trend >= 0 ? "text-positive" : "text-negative",
                            )}
                          >
                            {c.trend >= 0 ? "+" : ""}
                            {c.trend}%
                          </span>
                        </td>
                        <td className="relative py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="grid size-11 place-items-center rounded-md text-muted hover:bg-elevated hover:text-fg"
                              aria-label={c.status === "paused" ? "Resume" : "Pause"}
                              onClick={() => togglePause(c.id)}
                            >
                              {c.status === "paused" ? <Play className="size-4" /> : <Pause className="size-4" />}
                            </button>
                            <button
                              type="button"
                              className="grid size-11 place-items-center rounded-md text-muted hover:bg-elevated hover:text-fg"
                              aria-label="Scale budget"
                              onClick={() => scaleCampaign(c.id)}
                            >
                              <Rocket className="size-4" />
                            </button>
                            <button
                              type="button"
                              className="grid size-11 place-items-center rounded-md text-muted hover:bg-elevated hover:text-fg"
                              aria-label="More actions"
                              onClick={() => setMenuFor(menuFor === c.id ? null : c.id)}
                            >
                              <MoreHorizontal className="size-4" />
                            </button>
                          </div>
                          {menuFor === c.id ? (
                            <div className="absolute right-0 z-10 mt-1 w-40 rounded-md border border-border bg-surface py-1 shadow-[var(--shadow-border)]">
                              <button
                                type="button"
                                className="block w-full px-3 py-2 text-left text-sm hover:bg-elevated"
                                onClick={() => {
                                  setDetail(c);
                                  setMenuFor(null);
                                }}
                              >
                                View details
                              </button>
                              <button
                                type="button"
                                className="block w-full px-3 py-2 text-left text-sm hover:bg-elevated"
                                onClick={() => {
                                  notify("Exported CSV for " + c.channel);
                                  setMenuFor(null);
                                }}
                              >
                                Export
                              </button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">
                {filtered.map((c) => (
                  <article key={c.id} className="rounded-lg border border-border bg-bg p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-subtle">{c.channel}</p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="text-xs text-subtle">Spend</dt>
                        <dd className="font-mono tabular-nums">{money(c.spend)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-subtle">Installs</dt>
                        <dd className="font-mono tabular-nums">{c.installs.toLocaleString()}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-subtle">CPI</dt>
                        <dd className="font-mono tabular-nums">${c.cpi.toFixed(2)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-subtle">ROAS</dt>
                        <dd className="font-mono tabular-nums">{c.roas.toFixed(2)}x</dd>
                      </div>
                    </dl>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        className="min-h-11 flex-1 rounded-md bg-elevated text-sm"
                        onClick={() => togglePause(c.id)}
                      >
                        {c.status === "paused" ? "Resume" : "Pause"}
                      </button>
                      <button
                        type="button"
                        className="min-h-11 flex-1 rounded-md bg-accent text-sm text-accent-fg"
                        onClick={() => scaleCampaign(c.id)}
                      >
                        Scale
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {(nav === "overview" || nav === "insights") && (
            <section className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-border)]">
              <div className="mb-4 flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-md bg-accent text-accent-fg">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <h2 className="text-base font-semibold tracking-tight">AI optimization insights</h2>
                  <p className="text-sm text-muted">Generated from last {range} of Glow Sculpt delivery</p>
                </div>
              </div>

              {insights.length === 0 ? (
                <p className="rounded-lg bg-elevated px-4 py-8 text-center text-sm text-muted">
                  Queue clear. New suggestions will appear after the next bidding cycle.
                </p>
              ) : (
                <ul className="grid gap-3 lg:grid-cols-2">
                  {insights.map((ins) => (
                    <li key={ins.id} className="rounded-lg border border-border bg-bg p-4">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-medium">{ins.title}</h3>
                        <span className="shrink-0 rounded-full bg-elevated px-2 py-1 text-xs text-muted">{ins.impact}</span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{ins.body}</p>
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          className="min-h-11 rounded-md bg-accent px-4 text-sm font-medium text-accent-fg transition-transform duration-150 active:scale-[0.96]"
                          onClick={() => applyInsight(ins)}
                        >
                          Apply
                        </button>
                        <button
                          type="button"
                          className="min-h-11 rounded-md px-4 text-sm text-muted hover:text-fg"
                          onClick={() => setInsights((prev) => prev.filter((i) => i.id !== ins.id))}
                        >
                          Dismiss
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </main>
      </div>

      {detail ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg/70 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow-border)]">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">{detail.name}</h2>
                <p className="text-sm text-muted">{detail.channel}</p>
              </div>
              <button
                type="button"
                className="grid size-11 place-items-center rounded-md"
                aria-label="Close"
                onClick={() => setDetail(null)}
              >
                <X className="size-4" />
              </button>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-elevated p-3">
                <dt className="text-xs text-subtle">Spend</dt>
                <dd className="font-mono tabular-nums">{money(detail.spend)}</dd>
              </div>
              <div className="rounded-md bg-elevated p-3">
                <dt className="text-xs text-subtle">ROAS</dt>
                <dd className="font-mono tabular-nums">{detail.roas.toFixed(2)}x</dd>
              </div>
              <div className="rounded-md bg-elevated p-3">
                <dt className="text-xs text-subtle">Installs</dt>
                <dd className="font-mono tabular-nums">{detail.installs.toLocaleString()}</dd>
              </div>
              <div className="rounded-md bg-elevated p-3">
                <dt className="text-xs text-subtle">CPI</dt>
                <dd className="font-mono tabular-nums">${detail.cpi.toFixed(2)}</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm text-muted">
              Simulated Glow Sculpt delivery. Use pause, scale, and AI apply actions to model a UA workflow.
            </p>
            <button
              type="button"
              className="mt-4 min-h-11 w-full rounded-md bg-accent text-sm font-medium text-accent-fg"
              onClick={() => setDetail(null)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-surface px-4 py-2 text-sm shadow-[var(--shadow-border)]">
          <span className="inline-flex items-center gap-2">
            <CirclePause className="size-3.5 text-accent" />
            {toast}
          </span>
        </div>
      ) : null}
    </div>
  );
}
