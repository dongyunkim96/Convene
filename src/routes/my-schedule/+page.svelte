<script lang="ts">
  import { page } from '$app/state';
  import { CalendarDays, Download, Printer, ArrowUpRight, Ticket, MapPin } from '@lucide/svelte';
  import { time, day, trackClass } from '#lib/event.ts';
  import Booking from '#lib/components/Booking.svelte';
  let { data }: import('./$types').PageProps = $props();
  let selected = $state('2027-05-20');
  const confirmed = $derived(data.sessions.filter((s) => s.state === 'reserved'));
  const waiting = $derived(data.sessions.filter((s) => s.state === 'waitlisted'));
  const visible = $derived(confirmed.filter((s) => s.start.startsWith(selected)));
</script>

<svelte:head><title>My Schedule · CONVENE</title></svelte:head>
<div class="wrap">
  <div class="page-head">
    <div class="eyebrow">A LITTLE SPACE FOR WHAT MATTERS</div>
    <div class="head-row">
      <div>
        <h1>Your days, taking shape.</h1>
        <p>
          A personal agenda for your curious mind. Your confirmed seats are saved here, ready when
          you are.
        </p>
      </div>
      <a class="btn" href="/my-pass"><Ticket size={16} />My conference pass</a>
    </div>
    <div class="small muted">All times in America/New_York · EDT (UTC−4)</div>
  </div>
  {#if page.url.searchParams.has('welcome')}<div class="notice success" role="status">
      <strong>You’re registered, {data.user?.name.split(' ')[0]}.</strong> Your conference pass is ready.
      Explore sessions to start building your agenda. No email was sent.
    </div>{/if}
  {#each data.notifications as notification}<div class="notice success" role="status">
      <strong>A place opened up!</strong> You’ve been promoted from the waitlist for “{notification.title}”.
      Your seat is confirmed.
    </div>{/each}
  <div class="agenda-layout">
    <section>
      <div class="tabs" role="tablist" aria-label="Conference day">
        {#each ['2027-05-20', '2027-05-21'] as d, i}<button
            role="tab"
            aria-selected={selected === d}
            aria-controls="day-agenda"
            id={'day-' + i}
            class:active={selected === d}
            tabindex={selected === d ? 0 : -1}
            onkeydown={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                selected = selected === '2027-05-20' ? '2027-05-21' : '2027-05-20';
                document.getElementById(selected.endsWith('20') ? 'day-0' : 'day-1')?.focus();
              }
            }}
            onclick={() => (selected = d)}>{i === 0 ? 'Thu, May 20' : 'Fri, May 21'}</button
          >{/each}
      </div>
      <div
        role="tabpanel"
        id="day-agenda"
        aria-labelledby={selected.endsWith('20') ? 'day-0' : 'day-1'}
      >
        <div class="print-only">
          <h2>{day(selected + 'T13:00:00Z')} · Confirmed reservations</h2>
        </div>
        {#if visible.length}{#each visible as session}<article class="agenda-row">
              <div class="agenda-time">
                {time(session.start)}<small>to {time(session.end)}</small>
              </div>
              <div class="agenda-body">
                <span class={'badge ' + trackClass(session.track)}>{session.track}</span>
                <h3><a href={'/sessions/' + session.slug}>{session.title}</a></h3>
                <p>{session.speaker} · {session.format} · {session.level}</p>
                <p style="display:flex;gap:6px;align-items:center">
                  <MapPin size={13} />{session.room}
                </p>
                <Booking {session} user={data.user} />
              </div>
            </article>{/each}{:else}<div class="empty">
            <CalendarDays size={28} style="margin:auto;color:var(--primary)" />
            <h2>A day of possibilities.</h2>
            <p>
              You haven’t reserved any sessions for this day yet. Find an idea worth making room
              for.
            </p>
            <a class="btn primary" href={'/sessions?date=' + selected}
              >Explore sessions<ArrowUpRight size={15} /></a
            >
          </div>{/if}
      </div>
      <div class="print-only">
        {#each confirmed.filter((s) => !s.start.startsWith(selected)) as s}<div class="agenda-row">
            <div>{day(s.start)}<br />{time(s.start)}–{time(s.end)}</div>
            <div>
              <strong>{s.title}</strong>
              <p>{s.room} · {s.speaker}</p>
            </div>
          </div>{/each}
      </div>
    </section>
    <aside class="panel agenda-summary" style="height:max-content">
      <div class="eyebrow">YOUR CONVENE</div>
      <div class="agenda-count">{confirmed.length} <small>confirmed sessions</small></div>
      <p>
        Your schedule is saved to your account. Come back from any device and pick up where you left
        off.
      </p>
      <div style="display:grid;gap:10px;margin-top:22px">
        <a class="btn" href="/my-schedule/calendar" download
          ><Download size={15} />Export calendar (.ics)</a
        ><button class="btn print-action" onclick={() => window.print()}
          ><Printer size={15} />Print agenda</button
        ><a
          class="text-link"
          style="justify-content:center;font-size:12px;margin-top:6px"
          href="/sessions">Find another session<ArrowUpRight size={14} /></a
        >
      </div>
    </aside>
  </div>
  <section class="waitlist-section">
    <h2>A few possibilities on hold.</h2>
    <p class="small">
      Waitlisted sessions are separate from your confirmed agenda. They do not hold a seat or block
      another booking.
    </p>
    {#if waiting.length}<div class="session-grid" style="margin-top:24px">
        {#each waiting as session}<article class="session-card">
            <span class="badge warning" style="width:max-content"
              >On waitlist · Position {session.position}</span
            >
            <h3 style="margin-top:18px">
              <a href={'/sessions/' + session.slug}>{session.title}</a>
            </h3>
            <p class="small">
              {day(session.start)} · {time(session.start)}–{time(session.end)} EDT<br
              />{session.room} · {session.speaker}
            </p>
            <div style="margin-top:20px"><Booking {session} user={data.user} /></div>
          </article>{/each}
      </div>{:else}<p class="small" style="margin-top:16px">You’re not on any waitlists.</p>{/if}
    <details style="margin-top:22px">
      <summary>How do promotions work?</summary>
      <p class="small" style="margin-top:12px">
        When a place opens, the earliest eligible person with no confirmed schedule conflict is
        promoted. Conflicting attendees keep their waitlist position but may be skipped. Promotions
        appear here after navigation or a page refresh. No emails or push notifications are sent.
      </p>
    </details>
  </section>
</div>
