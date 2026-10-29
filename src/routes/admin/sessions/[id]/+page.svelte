<script lang="ts">
  import { enhance } from '$app/forms';
  import { ArrowLeft, Save } from '@lucide/svelte';
  import { day, time } from '#lib/event.ts';
  let { data, form }: import('./$types').PageProps = $props();
  let pending = $state(false);
</script>

<svelte:head><title>Manage session · CONVENE</title></svelte:head>
<div class="wrap">
  <div class="page-head">
    <a class="back-link" href="/admin"><ArrowLeft size={14} />Organizer dashboard</a>
    <h1 style="font-size:40px">{data.session.title}</h1>
    <p>
      {day(data.session.start)} · {time(data.session.start)}–{time(data.session.end)} EDT · {data
        .session.room}
    </p>
  </div>
  <div class="admin-metrics">
    {#each [['Capacity', data.session.capacity], ['Confirmed', data.session.confirmed], ['Remaining seats', data.session.capacity - data.session.confirmed], ['Waitlist', data.session.waiting]] as [label, value]}<div
        class="panel metric"
      >
        <p>{label}</p>
        <strong>{value}</strong>
      </div>{/each}
  </div>
  <form
    class="panel"
    method="POST"
    use:enhance={() => {
      pending = true;
      return async ({ update }) => {
        await update({ reset: false });
        pending = false;
      };
    }}
  >
    <h2 style="font-size:25px;margin-bottom:15px">Adjust capacity</h2>
    <p class="small" style="margin-bottom:20px">
      Increasing capacity promotes eligible waitlisted attendees. Capacity cannot be lower than the
      confirmed count.
    </p>
    <div class="actions" style="align-items:flex-end">
      <div>
        <label for="capacity">Session capacity</label><input
          id="capacity"
          type="number"
          min="0"
          max="10000"
          step="1"
          required
          name="capacity"
          value={data.session.capacity}
          style="max-width:170px"
        />
      </div>
      <button class="btn primary" disabled={pending}
        ><Save size={15} />{pending ? 'Saving…' : 'Save capacity'}</button
      >
    </div>
    {#if form?.message}<div class="notice" role="status">{form.message}</div>{/if}
  </form>
  <section class="admin-section">
    <h2>Reservation & waitlist records</h2>
    <div class="table-scroll">
      <table>
        <caption>Confirmed and waitlisted attendees for this session</caption><thead
          ><tr><th>Attendee</th><th>Email</th><th>Status</th><th>Waitlist order</th></tr></thead
        ><tbody
          >{#each data.records as record}<tr
              ><td>{record.name}</td><td>{record.email}</td><td
                ><span class={'badge ' + (record.kind === 'Confirmed' ? 'success' : 'warning')}
                  >{record.kind}</span
                ></td
              ><td
                >{record.kind === 'Waitlisted'
                  ? data.records
                      .filter((r) => r.kind === 'Waitlisted')
                      .findIndex((r) => r.id === record.id) + 1
                  : '—'}</td
              ></tr
            >{/each}{#if !data.records.length}<tr
              ><td colspan="4">No reservations or waitlist entries yet.</td></tr
            >{/if}</tbody
        >
      </table>
    </div>
  </section>
</div>
