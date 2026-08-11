import Link from "next/link";

import { AdminPageHeader, EmptyAdminState } from "@/components/admin/admin-ui";
import adminStyles from "@/components/admin/admin.module.css";
import { CopyButton } from "@/components/admin/copy-button";
import styles from "@/components/admin/marketing.module.css";
import {
  formatJamaicaDate,
  formatJamaicaDateTime,
  getJamaicaDateKey,
  marketingChannels,
  marketingContentStatuses,
  marketingLabel,
  marketingPillars,
  type MarketingCalendarView,
} from "@/lib/admin/marketing";
import {
  getMarketingCalendar,
  getMarketingCampaigns,
} from "@/lib/admin/marketing-queries";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MarketingCalendarPage({ searchParams }: { searchParams: SearchParams }) {
  const query = await searchParams;
  const requestedView = first(query.view);
  const view: MarketingCalendarView = ["month", "week", "agenda"].includes(requestedView ?? "")
    ? (requestedView as MarketingCalendarView)
    : "week";
  const dateKey = first(query.date) ?? getJamaicaDateKey();
  const channel = first(query.channel) as Parameters<typeof getMarketingCalendar>[0]["channel"];
  const pillar = first(query.pillar) as Parameters<typeof getMarketingCalendar>[0]["pillar"];
  const campaignId = first(query.campaign) || undefined;
  const status = first(query.status) as Parameters<typeof getMarketingCalendar>[0]["status"];
  const [calendar, campaigns] = await Promise.all([
    getMarketingCalendar({ view, dateKey, channel: channel || undefined, pillar: pillar || undefined, campaignId, status: status || undefined }),
    getMarketingCampaigns(),
  ]);

  const contentByDay = new Map<string, typeof calendar.content>();
  const conflicts = new Map<string, number>();
  for (const item of calendar.content) {
    if (!item.publishAt) continue;
    const day = getJamaicaDateKey(item.publishAt);
    contentByDay.set(day, [...(contentByDay.get(day) ?? []), item]);
    const hour = `${day}-${new Intl.DateTimeFormat("en-CA", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone: "America/Jamaica",
    }).format(item.publishAt)}`;
    conflicts.set(hour, (conflicts.get(hour) ?? 0) + 1);
  }
  const conflictCount = [...conflicts.values()].filter((count) => count > 2).length;
  const days: Date[] = [];
  for (let time = calendar.start.getTime(); time < calendar.end.getTime(); time += 86_400_000) {
    days.push(new Date(time));
  }
  const filterQuery = new URLSearchParams({ date: calendar.dateKey });
  if (channel) filterQuery.set("channel", channel);
  if (pillar) filterQuery.set("pillar", pillar);
  if (campaignId) filterQuery.set("campaign", campaignId);
  if (status) filterQuery.set("status", status);

  return (
    <>
      <AdminPageHeader
        eyebrow="Marketing OS / Calendar"
        title="One schedule, Jamaica time."
        description="Plan distribution across channels without pretending the system publishes for you. Copy is prepared here; posting and response windows remain deliberate founder actions."
        action={{ href: "/admin/marketing/content", label: "Manage content" }}
      />

      <div className={styles.calendarToolbar}>
        <div className={styles.viewSwitch} aria-label="Calendar view">
          {(["month", "week", "agenda"] as const).map((item) => {
            const params = new URLSearchParams(filterQuery);
            params.set("view", item);
            return <Link aria-current={view === item ? "page" : undefined} href={`?${params}`} key={item}>{item}</Link>;
          })}
        </div>
        <span className={styles.kicker}>{formatJamaicaDate(calendar.start)} — {formatJamaicaDate(new Date(calendar.end.getTime() - 1))}</span>
      </div>

      <form className={styles.filters} method="get">
        <input name="view" type="hidden" value={view} />
        <label>Date<input defaultValue={calendar.dateKey} name="date" type="date" /></label>
        <label>Channel<select defaultValue={channel ?? ""} name="channel"><option value="">All channels</option>{marketingChannels.map((item) => <option key={item} value={item}>{marketingLabel(item)}</option>)}</select></label>
        <label>Pillar<select defaultValue={pillar ?? ""} name="pillar"><option value="">All pillars</option>{marketingPillars.map((item) => <option key={item} value={item}>{marketingLabel(item)}</option>)}</select></label>
        <label>Campaign<select defaultValue={campaignId ?? ""} name="campaign"><option value="">All campaigns</option>{campaigns.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Status<select defaultValue={status ?? ""} name="status"><option value="">All live statuses</option>{marketingContentStatuses.map((item) => <option key={item} value={item}>{marketingLabel(item)}</option>)}</select></label>
        <button className={adminStyles.secondaryButton} type="submit">Apply</button>
      </form>

      {conflictCount ? (
        <p className={styles.conflict} role="status">{conflictCount} scheduling conflict {conflictCount === 1 ? "window" : "windows"}: more than two pieces share the same Jamaica-time hour.</p>
      ) : null}

      {view === "agenda" ? (
        <section className={styles.panel} aria-labelledby="agenda-title">
          <div className={styles.panelHeader}><h2 id="agenda-title">Agenda</h2><p>{calendar.content.length} scheduled pieces</p></div>
          {calendar.content.length ? (
            <div className={styles.list}>
              {calendar.content.map((item) => (
                <div className={styles.listItem} key={item.id}>
                  <div><strong>{item.title}</strong><small>{formatJamaicaDateTime(item.publishAt)} · {marketingLabel(item.primaryChannel)} · {item.campaign?.name ?? "No campaign"}</small></div>
                  <CopyButton label="Copy prepared post" value={item.shortCaption || item.body} />
                </div>
              ))}
            </div>
          ) : <EmptyAdminState>No content matches this agenda window.</EmptyAdminState>}
        </section>
      ) : (
        <div className={styles.calendarWrap}>
          <div className={styles.calendarGrid}>
            {days.map((day, index) => {
              const key = getJamaicaDateKey(day);
              const items = contentByDay.get(key) ?? [];
              const firstColumn = index === 0 && view === "month" ? ((day.getUTCDay() + 6) % 7) + 1 : undefined;
              return (
                <section className={styles.calendarDay} key={key} style={firstColumn ? { gridColumnStart: firstColumn } : undefined}>
                  <time dateTime={key}>{new Intl.DateTimeFormat("en-JM", { weekday: "short", day: "2-digit", month: "short", timeZone: "America/Jamaica" }).format(day)}</time>
                  {items.map((item) => (
                    <article className={styles.calendarItem} key={item.id}>
                      <time>{formatJamaicaDateTime(item.publishAt).split(",").at(-1)?.trim()}</time>
                      <strong>{item.title}</strong>
                      <small>{marketingLabel(item.primaryChannel)} · {marketingLabel(item.status)}</small>
                      <CopyButton value={item.shortCaption || item.body} />
                    </article>
                  ))}
                </section>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
