<script lang="ts">
  import { enhance } from '$app/forms';
  import { refreshAll } from '$app/navigation';
  import { RefreshCw, Download, ArrowUpRight, ShieldCheck } from '@lucide/svelte';
  import { time, day } from '#lib/event.ts';
  let { data, form }: import('./$types').PageProps = $props();
  let query = $state(''),
    attendeeQuery = $state(''),
    token = $state(''),
    pending = $state(false),
    refreshing = $state(false);
  const list = $derived(
    data.sessions.filter((s) =>
      `${s.title} ${s.track}`.toLowerCase().includes(query.toLowerCase()),
    ),
  );
  const attendees = $derived(
    data.attendees.filter((a) =>
      `${a.name} ${a.email} ${a.reference}`.toLowerCase().includes(attendeeQuery.toLowerCase()),
    ),
  );
  const confirmed = $derived(data.sessions.reduce((n, s) => n + s.confirmed, 0));
  const waiting = $derived(data.sessions.reduce((n, s) => n + s.waiting, 0));
</script>

<svelte:head><title>Organizer dashboard · CONVENE</title></svelte:head>
<div class="wrap">
  <div class="page-head">
    <div class="eyebrow"><ShieldCheck size={14} />ORGANIZER WORKSPACE</div>
    <div class="head-row">
      <div>
        <h1>A clear view of CONVENE.</h1>
        <p>One source of truth for registrations, reservations, and event check-in.</p>
      </div>
      <div class="actions">
        <button
          class="btn"
          disabled={refreshing}
          onclick={async () => {
            refreshing = true;
            await refreshAll();
            refreshing = false;
          }}><RefreshCw size={15} />{refreshing ? 'Refreshing…' : 'Refresh data'}</button
        ><a class="btn primary" href="/admin/export" download><Download size={15} />Export CSV</a>
      </div>
    </div>
  </div>
  <div class="admin-metrics">
    {#each [['Registered attendees', data.attendees.length], ['Confirmed reservations', confirmed], ['Waitlist entries', waiting], ['Event check-ins', data.attendees.filter((a) => a.checked_at).length]] as [label, value]}<div
        class="panel metric"
      >
        <p>{label}</p>
        <strong>{value}</strong>
      </div>{/each}
  </div>
  <div class="actions" style="gap:20px;font-size:12px">
    {#each ['general', 'vip', 'speaker'] as category}<span style="text-transform:capitalize"
        >{category}:
        <strong>{data.attendees.filter((a) => a.category === category).length}</strong></span
      >{/each}
  </div>
  <p class="admin-help muted">
    Reservations indicate saved seats, not actual session attendance. Event check-in is recorded
    separately. Data refreshes on navigation; use Refresh data to retrieve changes from other
    attendees.
  </p>
  <section class="admin-section panel" id="verification">
    <h2>Welcome desk · Verify a pass</h2>
    <p class="small" style="margin-bottom:20px">
      Paste the opaque token from an attendee’s QR code or manual fallback. Verification records
      event check-in. Repeated scans do not create duplicates.
    </p>
    <form
      class="verify-form"
      action="?/verify"
      method="POST"
      use:enhance={() => {
        pending = true;
        return async ({ update }) => {
          await update({ reset: false });
          pending = false;
        };
      }}
    >
      <div class="field">
        <label for="token">Pass token</label><input
          id="token"
          name="token"
          bind:value={token}
          autocomplete="off"
          spellcheck="false"
          placeholder="64-character pass token"
          required
        />
      </div>
      <button class="btn primary" disabled={pending}
        ><ShieldCheck size={16} />{pending ? 'Verifying…' : 'Verify & check in'}</button
      >
    </form>
    {#if form?.message}<div
        class="notice"
        class:success={!!form.name}
        class:error={!form.name}
        role="status"
      >
        <strong>{form.message}</strong>{#if form.name}<p>{form.name} · {form.reference}</p>{/if}
      </div>{/if}
  </section>
  <section class="admin-section">
    <div class="admin-toolbar">
      <h2 style="margin:0">Session reservations</h2>
      <div>
        <label for="session-query">Search sessions</label><input
          id="session-query"
          type="search"
          placeholder="Session title or track"
          bind:value={query}
        />
      </div>
    </div>
    <div class="table-scroll">
      <table>
        <caption
          >Session capacity, confirmed reservations, remaining seats, and waitlist counts</caption
        ><thead
          ><tr
            ><th>Session</th><th>When · EDT</th><th>Capacity</th><th>Confirmed</th><th>Remaining</th
            ><th>Waitlist</th></tr
          ></thead
        ><tbody
          >{#each list as s}<tr
              ><td
                ><a href={'/admin/sessions/' + s.id}>{s.title} ↗</a>
                <p class="small" style="font-size:10px;margin-top:4px">{s.track} · {s.room}</p></td
              ><td style="white-space:nowrap">{day(s.start)}<br />{time(s.start)}</td><td
                >{s.capacity}</td
              ><td
                >{s.confirmed}<span
                  class="occupancy"
                  aria-label={`${s.confirmed} of ${s.capacity} seats reserved`}
                  ><i style:width={(s.capacity ? (s.confirmed / s.capacity) * 100 : 0) + '%'}
                  ></i></span
                ></td
              ><td>{s.capacity - s.confirmed}</td><td>{s.waiting}</td></tr
            >{/each}{#if !list.length}<tr><td colspan="6">No sessions match your search.</td></tr
            >{/if}</tbody
        >
      </table>
    </div>
  </section>
  <section class="admin-section">
    <div class="admin-toolbar">
      <h2 style="margin:0">Registered attendees</h2>
      <div>
        <label for="attendee-query">Search attendees</label><input
          id="attendee-query"
          type="search"
          placeholder="Name, email, or reference"
          bind:value={attendeeQuery}
        />
      </div>
    </div>
    <div class="table-scroll">
      <table>
        <caption>Registered attendees and their confirmed schedules</caption><thead
          ><tr
            ><th>Attendee</th><th>Category</th><th>Registration</th><th>Event check-in</th><th
              >Confirmed schedule</th
            ></tr
          ></thead
        ><tbody
          >{#each attendees as a}<tr
              ><td
                ><strong>{a.name}</strong>
                <p style="font-size:11px;margin-top:5px">{a.email}</p></td
              ><td style="text-transform:capitalize">{a.category}</td><td
                ><span class="badge success">Registered</span>
                <p style="font-family:monospace;font-size:10px;margin-top:5px">{a.reference}</p></td
              ><td>{a.checked_at ? 'Checked in' : 'Not checked in'}</td><td
                ><details>
                  <summary style="font-size:12px"
                    >{data.reservations.filter((r) => r.user_id === a.id).length} reserved sessions</summary
                  >{#each data.reservations.filter((r) => r.user_id === a.id) as r}<p
                      style="font-size:11px;margin:10px 0"
                    >
                      {day(r.start)} · {time(r.start)}–{time(r.end)}<br />{r.title}
                    </p>{/each}
                </details></td
              ></tr
            >{/each}{#if !attendees.length}<tr
              ><td colspan="5">No attendees match your search.</td></tr
            >{/if}</tbody
        >
      </table>
    </div>
  </section>
  <section class="admin-section">
    <h2>Recent reservation activity</h2>
    <div class="activity">
      {#each data.transitions as t}<div>
          <span><strong>{t.name}</strong> · {t.kind}<br /><span class="muted">{t.title}</span></span
          ><small
            >{new Intl.DateTimeFormat('en-US', {
              timeZone: 'America/New_York',
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            }).format(new Date(t.created))} ET</small
          >
        </div>{/each}
    </div>
  </section>
</div>
