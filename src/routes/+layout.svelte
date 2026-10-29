<script lang="ts">
  import '../app.css';
  import { page } from '$app/state';
  import {
    CalendarDays,
    Ticket,
    Compass,
    ArrowUpRight,
    CircleUserRound,
    MapPin,
  } from '@lucide/svelte';
  let { data, children }: import('./$types').LayoutProps = $props();
</script>

<svelte:head
  ><title>CONVENE — A meeting of curious minds</title><meta
    name="description"
    content="Two days of thoughtful technology, practical ideas, and new connections. Explore the fictional CONVENE 2027 conference and build your personal agenda."
  /></svelte:head
>
<a class="skip" href="#main">Skip to content</a>
<div class="top-strip">
  <div class="wrap">
    <span><span class="live-dot"></span> A MEETING OF CURIOUS MINDS</span><span>
      MAY 20–21, 2027 <span class="strip-extra">· BROOKLYN, NEW YORK</span></span
    >
  </div>
</div>
<header class="header">
  <div class="wrap header-inner">
    <a class="wordmark" href="/" aria-label="Convene home"
      ><span class="brand-icon" aria-hidden="true"
        ><svg width="27" height="27" viewBox="0 0 30 30"
          ><path
            d="M25 6a13 13 0 1 0 0 18M21 11a6 6 0 1 0 0 8"
            fill="none"
            stroke="currentColor"
            stroke-width="3.5"
          /></svg
        ></span
      >CONVENE<span style="font-size:10px;letter-spacing:0;align-self:flex-start;margin-top:3px"
        >®</span
      ></a
    >
    <nav aria-label="Main navigation">
      <a
        href="/"
        class:active={page.url.pathname === '/'}
        aria-current={page.url.pathname === '/' ? 'page' : undefined}>Overview</a
      ><a
        href="/sessions"
        class:active={page.url.pathname.startsWith('/sessions')}
        aria-current={page.url.pathname === '/sessions' ? 'page' : undefined}>Sessions</a
      ><a
        href="/speakers"
        class="speakers-link"
        class:active={page.url.pathname === '/speakers'}
        aria-current={page.url.pathname === '/speakers' ? 'page' : undefined}>Speakers</a
      >
    </nav>
    <div class="header-account">
      {#if data.user}<a class="account-schedule" href="/my-schedule">My Schedule</a><a
          class="btn"
          href="/profile"
          aria-label="Your profile"
          ><CircleUserRound size={17} /><span>{data.user.name.split(' ')[0]}</span></a
        >{:else}<a class="login-link" href="/login">Sign in</a><a
          class="btn primary"
          href="/register">Register <ArrowUpRight size={15} /></a
        >{/if}
    </div>
  </div>
</header>
<main id="main" tabindex="-1">{@render children()}</main>
<footer class="footer">
  <div class="wrap">
    <div class="footer-main">
      <div>
        <a class="wordmark" href="/">CONVENE<span style="color:var(--primary)">↗</span></a>
        <p class="small" style="margin-top:12px">Good ideas happen together.</p>
      </div>
      <nav class="footer-links" aria-label="Footer">
        <a href="/sessions">Sessions</a><a href="/speakers">Speakers</a><a href="/my-schedule"
          >My Schedule</a
        ><a href="/my-pass">My Pass</a><a href="/admin">Organizer</a><a href="/login"
          >Demo accounts</a
        >
      </nav>
    </div>
    <div class="footer-bottom">
      <span>© 2027 CONVENE. A fictional conference & portfolio project.</span><span
        >May 20–21 · Brooklyn, NY · America/New_York (EDT)</span
      >
    </div>
  </div>
</footer>
<nav class="mobile-nav" aria-label="Your conference">
  <a href="/sessions" class:active={page.url.pathname.startsWith('/sessions')}
    ><Compass size={19} />Sessions</a
  ><a href="/my-schedule" class:active={page.url.pathname === '/my-schedule'}
    ><CalendarDays size={19} />My Schedule</a
  ><a href="/my-pass" class:active={page.url.pathname === '/my-pass'}><Ticket size={19} />My Pass</a
  >
</nav>
