<script lang="ts">
  import { Clock, MapPin, ArrowUpRight } from '@lucide/svelte';
  import { time, day, trackClass } from '../event.ts';
  import type { Session, User } from '../types.ts';
  import Booking from './Booking.svelte';
  let {
    session: s,
    user,
    bookable = false,
    returnTo = '',
  }: { session: Session; user?: User | null; bookable?: boolean; returnTo?: string } = $props();
</script>

<article class="session-card">
  <div class="card-top">
    <span class={'badge ' + trackClass(s.track)}>{s.track}</span><span class="card-time"
      ><Clock size={12} />{Math.round((+new Date(s.end) - +new Date(s.start)) / 60000)} min · {s.format}</span
    >
  </div>
  <div class="card-time" style="margin-bottom:10px">
    {day(s.start)} · {time(s.start)}–{time(s.end)}
  </div>
  <h3>
    <a href={'/sessions/' + s.slug + (returnTo ? '?from=' + encodeURIComponent(returnTo) : '')}
      >{s.title}</a
    >
  </h3>
  <p class="description">{s.description}</p>
  <div class="speaker-line">
    <span class="avatar" style:background={s.color}>{s.initials}</span>
    <div><strong>{s.speaker}</strong><small>{s.speakerTitle}</small></div>
  </div>
  <div class="card-bottom">
    <span style="display:flex;align-items:center;gap:5px"><MapPin size={12} />{s.room}</span
    >{#if s.state === 'reserved'}<span class="badge success">Reserved</span
      >{:else if s.state === 'waitlisted'}<span class="badge warning">Waitlist #{s.position}</span
      >{:else if s.access === 'vip'}<span class="badge warning">VIP access</span
      >{:else if s.confirmed >= s.capacity}<span class="badge warning">Full · waitlist open</span
      >{:else}<span style:color={s.capacity - s.confirmed <= 5 ? 'var(--amber)' : 'var(--teal)'}
        >{s.capacity - s.confirmed <= 5
          ? `${s.capacity - s.confirmed} seats left`
          : 'Seats available'}</span
      >{/if}
  </div>
  {#if bookable}<div class="card-footer-action"><Booking session={s} {user} /></div>{:else}<a
      class="text-link"
      style="margin-top:19px;font-size:12px;text-decoration:none"
      href={'/sessions/' + s.slug}>Explore session <ArrowUpRight size={14} /></a
    >{/if}
</article>
