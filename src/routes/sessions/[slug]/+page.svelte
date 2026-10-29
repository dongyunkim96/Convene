<script lang="ts">
  import { page } from '$app/state';
  import { ArrowLeft, CalendarDays, Clock, MapPin, LockKeyhole, Check } from '@lucide/svelte';
  import { time, day, trackClass } from '#lib/event.ts';
  import Booking from '#lib/components/Booking.svelte';
  let { data }: import('./$types').PageProps = $props();
  const s = $derived(data.session);
  const from = $derived(page.url.searchParams.get('from'));
  const back = $derived(from && /^\/sessions(?:\?|$)/.test(from) ? from : '/sessions');
</script>

<svelte:head><title>{s.title} · CONVENE</title></svelte:head>
<div class="wrap" style="padding-top:30px">
  <a class="back-link" href={back}><ArrowLeft size={14} />Back to sessions</a>
  <div class="session-detail">
    <div class="detail-content">
      <span class={'badge ' + trackClass(s.track)}>{s.track}</span>
      <h1>{s.title}</h1>
      <div class="detail-meta">
        <span><CalendarDays size={16} />{day(s.start)}, 2027</span><span
          ><Clock size={16} />{time(s.start)}–{time(s.end)} EDT</span
        ><span><MapPin size={16} />{s.room}</span>
      </div>
      <p class="detail-intro">{s.description}</p>
      <section class="detail-block">
        <h2>What you’ll take away</h2>
        <ul>
          {#each JSON.parse(s.outcomes) as outcome}<li>{outcome}</li>{/each}
        </ul>
      </section>
      <section class="detail-block">
        <h2>Your speaker</h2>
        <a class="speaker-line panel" href={'/speakers#speaker-' + s.speakerId}
          ><span
            class="avatar"
            style:background={s.color}
            style="width:58px;height:58px;font-size:18px">{s.initials}</span
          >
          <div>
            <strong style="font-size:17px">{s.speaker}</strong><small style="font-size:13px"
              >{s.speakerTitle}</small
            ><span class="text-link small" style="margin-top:5px">Meet the speaker →</span>
          </div></a
        >
      </section>
    </div>
    <aside class="panel booking-panel" aria-label="Session reservation">
      <div class="eyebrow">MAKE IT PART OF YOUR DAY</div>
      <h2>
        {s.state === 'reserved'
          ? 'Your place is saved.'
          : s.state === 'waitlisted'
            ? 'You’re on the list.'
            : s.confirmed >= s.capacity
              ? 'Full, but not out of reach.'
              : 'A seat for your curiosity.'}
      </h2>
      <p>
        {s.state === 'waitlisted'
          ? `You’re #${s.position} on the waitlist. This is not a confirmed seat.`
          : `${Math.max(0, s.capacity - s.confirmed)} of ${s.capacity} seats available`}
      </p>
      <dl class="detail-facts">
        <div>
          <dt>Format</dt>
          <dd>{s.format}</dd>
        </div>
        <div>
          <dt>Experience</dt>
          <dd>{s.level}</dd>
        </div>
        <div>
          <dt>Access</dt>
          <dd>{s.access === 'vip' ? 'Invited VIP attendees' : 'All attendees'}</dd>
        </div>
        <div>
          <dt>Timezone</dt>
          <dd>New York · EDT</dd>
        </div>
      </dl>
      {#if data.conflict && s.state !== 'reserved'}<div class="notice">
          <strong>A little overlap.</strong>
          <p>
            This overlaps with <a href={'/sessions/' + data.conflict.slug}>{data.conflict.title}</a
            >. Cancel that reservation before reserving this seat. You may still join a full
            session’s waitlist.
          </p>
        </div>{/if}<Booking session={s} user={data.user} />
      <p style="font-size:11px;margin-top:18px">
        Plans change. Cancel anytime to make room for someone else.
      </p>
      {#if s.confirmed >= s.capacity || s.state === 'waitlisted'}<details style="margin-top:16px">
          <summary style="font-size:12px">How the waitlist works</summary>
          <p style="margin-top:10px;font-size:12px">
            Places go to the earliest eligible attendee with no confirmed schedule conflict.
            Conflicting attendees keep their position but may be skipped. Check My Schedule for
            in-app promotion updates.
          </p>
        </details>{/if}
    </aside>
  </div>
</div>
