<script lang="ts">
  import { ArrowUpRight, ArrowRight, CalendarDays, MapPin, Check, Ticket } from '@lucide/svelte';
  import SessionCard from '#lib/components/SessionCard.svelte';
  import { tracks, time } from '#lib/event.ts';
  let { data }: import('./$types').PageProps = $props();
  const trackCopy = [
    'Build resilient systems. Sweat the details. Ship with confidence.',
    'Move beyond the hype. Make data and intelligence useful.',
    'Connect thoughtful design with products people need.',
    'Create the conditions for people and ideas to thrive.',
  ];
</script>

<div class="wrap">
  <section class="hero">
    <div class="hero-layout">
      <div class="hero-copy">
        <div class="eyebrow"><span class="dot"></span>CONVENE 2027 · THE TECHNOLOGY GATHERING</div>
        <h1>Different minds.<br />Shared <em>possibilities.</em></h1>
        <p>
          Two days for the people building what comes next. Fresh perspectives, practical ideas, and
          conversations worth having.
        </p>
        <div class="actions">
          <a class="btn primary large" href="/sessions"
            >Explore Sessions <ArrowUpRight size={17} /></a
          ><a class="btn large" href={data.user ? '/my-schedule' : '/register'}
            >{data.user ? 'My Schedule' : 'Join us in Brooklyn'} <ArrowRight size={16} /></a
          >
        </div>
        <div class="hero-meta">
          <span><CalendarDays size={15} />May 20–21, 2027</span><span
            ><MapPin size={15} />Brooklyn, New York</span
          >
        </div>
      </div>
      <div class="hero-art" aria-hidden="true">
        <span class="art-top">IDEAS TAKE SHAPE HERE.</span><span class="art-plus">+</span>
        <div class="orb"></div>
        <div class="orb-square"></div>
        <div class="art-caption">
          <span>IN GOOD COMPANY / 2027</span><span>40.6940° N · 73.9865° W</span>
        </div>
      </div>
    </div>
    <div class="hero-bottom">
      <p class="intro">A little space to think bigger.<br />A lot to take back with you.</p>
      <div>
        <strong>2 days</strong>
        <p>Room for real conversations</p>
      </div>
      <div>
        <strong>24 sessions</strong>
        <p>Ideas you can put to work</p>
      </div>
      <div>
        <strong>12 voices</strong>
        <p>Perspectives worth sharing</p>
      </div>
    </div>
  </section>
  {#if data.user}<section class="personal-banner" aria-label="Your conference summary">
      <div>
        <div class="eyebrow">YOUR CONVENE</div>
        <h2 style="margin-top:8px">Welcome back, {data.user.name.split(' ')[0]}.</h2>
        <p>
          {data.reserved.length} reserved {data.reserved.length === 1
            ? 'session'
            : 'sessions'}{#if data.reserved[0]}
            · First up: {data.reserved[0].title} at {time(data.reserved[0].start)}{/if}
        </p>
      </div>
      <a class="btn" href="/my-pass"><Ticket size={17} />Open my pass</a>
    </section>{/if}
  <section class="section">
    <div class="section-heading">
      <div>
        <div class="eyebrow">MAKE ROOM FOR A NEW PERSPECTIVE</div>
        <h2>A few sessions to spark something.</h2>
      </div>
      <a class="text-link" href="/sessions">View all sessions <ArrowUpRight size={15} /></a>
    </div>
    <div class="session-grid">
      {#each data.featured as session}<SessionCard {session} />{/each}
    </div>
  </section>
  <section class="section">
    <div class="section-heading">
      <div>
        <div class="eyebrow">FOLLOW YOUR CURIOSITY</div>
        <h2>Four tracks. Plenty of overlap.</h2>
      </div>
      <p>Follow what you know, or find something new. The best ideas often live in between.</p>
    </div>
    <div class="track-grid">
      {#each tracks as track, i}<a
          class="track-tile"
          href={'/sessions?track=' + encodeURIComponent(track)}
          ><span class="track-number">0{i + 1} /</span>
          <h3>{track}<ArrowUpRight size={16} /></h3>
          <p>{trackCopy[i]}</p></a
        >{/each}
    </div>
  </section>
  <section class="section">
    <div class="section-heading">
      <div>
        <div class="eyebrow">PRACTITIONERS, NOT PEDESTALS</div>
        <h2>Meet a few of the minds.</h2>
      </div>
      <a class="text-link" href="/speakers">All speakers <ArrowUpRight size={15} /></a>
    </div>
    <div class="speaker-grid">
      {#each data.speakers as speaker}<a
          class="speaker-card"
          href={'/speakers#speaker-' + speaker.id}
          ><div class="speaker-portrait" style={'--portrait:' + speaker.color} aria-hidden="true">
            <span class="portrait-letters">{speaker.initials}</span>
          </div>
          <h3>{speaker.name}</h3>
          <p>{speaker.title} · {speaker.company}</p></a
        >{/each}
    </div>
  </section>
  <section class="section home-lower">
    <div>
      <div class="eyebrow">YOUR CONFERENCE, YOUR WAY</div>
      <h2 style="margin-top:12px">Less logistics.<br />More possibilities.</h2>
      <div class="steps">
        {#each [['Make it official', 'Register once. Tell us a little about yourself and what you’re interested in.'], ['Find your people and ideas', 'Explore the sessions and reserve your place. We’ll help you avoid schedule clashes.'], ['Show up, ready', 'Your personal agenda and conference pass stay together, right here.']] as step, i}<div
            class="step-item"
          >
            <span class="step-number">0{i + 1}</span>
            <div>
              <h3>{step[0]}</h3>
              <p>{step[1]}</p>
            </div>
          </div>{/each}
      </div>
    </div>
    <div class="venue">
      <div>
        <div class="eyebrow" style="color:var(--teal)">GOOD IDEAS NEED A PLACE</div>
        <div class="venue-graphic" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      </div>
      <div>
        <h3>See you in Brooklyn.</h3>
        <p>
          The Foundry · A fictional conference venue<br />Brooklyn, New York · America/New_York
          (EDT)
        </p>
        <p style="margin-top:15px">
          Doors open at 8:00 AM each day. Step-free access, quiet spaces, and dietary accommodations
          are part of the plan. Share your preferences when registering.
        </p>
      </div>
    </div>
  </section>
  <section class="section faq">
    <div>
      <div class="eyebrow">A FEW PRACTICAL THINGS</div>
      <h2 style="margin-top:12px">Good questions.<br />Clear answers.</h2>
    </div>
    <div>
      <details>
        <summary>Who is CONVENE for?</summary>
        <p>
          Engineers, designers, product thinkers, data practitioners, and team leaders. Sessions
          span foundational to advanced topics, with room to explore beyond your specialty.
        </p>
      </details>
      <details>
        <summary>Does registration reserve my session seats?</summary>
        <p>
          Conference registration gives you access to the portal. Reserve each session separately to
          secure a seat. VIP sessions require an invited VIP registration.
        </p>
      </details>
      <details>
        <summary>What happens if a session is full?</summary>
        <p>
          Join its waitlist. When a place opens, we offer it to the earliest eligible attendee whose
          confirmed agenda has no time conflict. Conflicting attendees keep their waitlist place but
          may be skipped. Waitlists do not reserve seats.
        </p>
      </details>
      <details>
        <summary>Can I change my plans?</summary>
        <p>
          Yes. Cancel a reservation from your schedule or the session page. Your seat may be offered
          to someone on the waitlist. Back-to-back sessions are allowed; overlapping confirmed
          reservations are blocked.
        </p>
      </details>
      <details>
        <summary>Is this a real event?</summary>
        <p>
          No. CONVENE is a fictional portfolio project with fictional speakers and content. No
          payments are collected and no emails are sent. Demo accounts are available from the
          sign-in page.
        </p>
      </details>
    </div>
  </section>
  <section class="section">
    <div class="cta-band">
      <div>
        <div class="eyebrow" style="color:#c4bbff">BRING YOUR CURIOSITY.</div>
        <h2 style="margin-top:12px">Leave with a little more possibility.</h2>
        <p>Your next good idea might start with a conversation.</p>
      </div>
      <a class="btn primary large" href={data.user ? '/sessions' : '/register'}
        >{data.user ? 'Build your schedule' : 'Register for CONVENE'}<ArrowUpRight size={18} /></a
      >
    </div>
  </section>
</div>
