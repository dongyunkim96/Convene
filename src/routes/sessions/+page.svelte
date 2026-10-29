<script lang="ts">
  import { page } from '$app/state';
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { Search, SlidersHorizontal, X, ArrowUpRight } from '@lucide/svelte';
  import { tracks, day } from '#lib/event.ts';
  import SessionCard from '#lib/components/SessionCard.svelte';
  let { data }: import('./$types').PageProps = $props();
  let search = $state(''),
    track = $state(''),
    date = $state(''),
    availability = $state(''),
    speaker = $state(''),
    level = $state(''),
    ready = $state(false);
  onMount(() => {
    ready = true;
  });
  let filterDialog: HTMLDialogElement;
  $effect(() => {
    search = page.url.searchParams.get('q') ?? '';
    track = page.url.searchParams.get('track') ?? '';
    date = page.url.searchParams.get('date') ?? '';
    availability = page.url.searchParams.get('availability') ?? '';
    speaker = page.url.searchParams.get('speaker') ?? '';
    level = page.url.searchParams.get('level') ?? '';
  });
  const filtered = $derived(
    data.sessions.filter(
      (s) =>
        (!search ||
          `${s.title} ${s.description} ${s.speaker}`
            .toLowerCase()
            .includes(search.toLowerCase())) &&
        (!track || s.track === track) &&
        (!date || s.start.startsWith(date)) &&
        (!availability ||
          (availability === 'available' ? s.confirmed < s.capacity : s.confirmed >= s.capacity)) &&
        (!speaker || String(s.speakerId) === speaker) &&
        (!level || s.level === level),
    ),
  );
  const active = $derived(
    [
      ['q', search],
      ['track', track],
      ['date', date],
      ['availability', availability],
      ['speaker', speaker],
      ['level', level],
    ].filter(([, v]) => v),
  );
  async function apply() {
    const p = new URLSearchParams();
    for (const [k, v] of [
      ['q', search],
      ['track', track],
      ['date', date],
      ['availability', availability],
      ['speaker', speaker],
      ['level', level],
    ])
      if (v) p.set(k, v);
    await goto('/sessions' + (p.size ? '?' + p.toString() : ''), { replace: true, reset: false });
  }
  function clear() {
    search = '';
    track = '';
    date = '';
    availability = '';
    speaker = '';
    level = '';
    apply();
  }
  function remove(key: string) {
    if (key === 'q') search = '';
    if (key === 'track') track = '';
    if (key === 'date') date = '';
    if (key === 'availability') availability = '';
    if (key === 'speaker') speaker = '';
    if (key === 'level') level = '';
    apply();
  }
  let searchTimer: ReturnType<typeof setTimeout>;
  onDestroy(() => clearTimeout(searchTimer));
  const currentUrl = $derived(
    '/sessions' + (active.length ? '?' + new URLSearchParams(active).toString() : ''),
  );
  function searchChanged() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(apply, 250);
  }
  let draft = $state({ track: '', date: '', availability: '', speaker: '', level: '' });
  function openFilters() {
    draft = { track, date, availability, speaker, level };
    filterDialog.showModal();
  }
</script>

<svelte:head><title>Sessions · CONVENE 2027</title></svelte:head>
<div class="wrap">
  <div class="page-head">
    <div class="eyebrow">FOLLOW YOUR CURIOSITY</div>
    <div class="head-row">
      <div>
        <h1>Find your next good idea.</h1>
        <p>
          24 sessions. Four tracks. One agenda that’s entirely yours.<br />Explore practical ideas
          from people doing the work.
        </p>
      </div>
      <span class="small muted">All times in New York · EDT (UTC−4)</span>
    </div>
  </div>
  <div class="filters">
    <div>
      <label for="search">Search sessions</label>
      <div style="position:relative">
        <Search size={17} style="position:absolute;left:12px;top:14px;color:var(--muted)" /><input
          disabled={!ready}
          id="search"
          type="search"
          placeholder="Topics, sessions, or speakers…"
          style="padding-left:38px"
          bind:value={search}
          oninput={searchChanged}
        />
      </div>
    </div>
    <div class="filter-fields">
      <div>
        <label for="track">Track</label><select
          disabled={!ready}
          id="track"
          bind:value={track}
          onchange={apply}
          ><option value="">All tracks</option>{#each tracks as t}<option>{t}</option
            >{/each}</select
        >
      </div>
      <div>
        <label for="date">Day</label><select
          disabled={!ready}
          id="date"
          bind:value={date}
          onchange={apply}
          ><option value="">Both days</option><option value="2027-05-20">Thu, May 20</option><option
            value="2027-05-21">Fri, May 21</option
          ></select
        >
      </div>
      <div>
        <label for="availability">Availability</label><select
          disabled={!ready}
          id="availability"
          bind:value={availability}
          onchange={apply}
          ><option value="">All sessions</option><option value="available">Seats available</option
          ><option value="full">Waitlist open</option></select
        >
      </div>
    </div>
    <button class="btn filter-toggle" onclick={openFilters} aria-haspopup="dialog"
      ><SlidersHorizontal size={16} />Filters</button
    >
  </div>
  <div class="filters-meta">
    <div role="status" aria-live="polite">
      <strong>{filtered.length}</strong>
      {filtered.length === 1 ? 'session' : 'sessions'} to explore
    </div>
    <div class="filter-chips">
      {#each active as [key, value]}<button
          class="filter-chip"
          onclick={() => remove(key)}
          aria-label={'Remove ' + key + ' filter'}
          >{key === 'speaker'
            ? data.speakers.find((s) => String(s.id) === value)?.name
            : key === 'date'
              ? day(value + 'T13:00:00Z')
              : value}<X size={12} /></button
        >{/each}{#if active.length}<button
          class="btn ghost"
          style="padding:0 7px;min-height:32px;font-size:11px"
          onclick={clear}>Clear all</button
        >{/if}
    </div>
    <div class="actions no-print">
      <label for="speaker-filter" style="margin:0;font-size:11px">Speaker</label><select
        id="speaker-filter"
        style="width:155px;min-height:36px;padding:5px;font-size:11px"
        bind:value={speaker}
        onchange={apply}
        ><option value="">All speakers</option>{#each data.speakers as s}<option value={s.id}
            >{s.name}</option
          >{/each}</select
      ><label for="level-filter" style="margin:0;font-size:11px">Level</label><select
        id="level-filter"
        style="width:125px;min-height:36px;padding:5px;font-size:11px"
        bind:value={level}
        onchange={apply}
        ><option value="">All levels</option><option>Foundational</option><option
          >Intermediate</option
        ><option>Advanced</option></select
      >
    </div>
  </div>
  {#if filtered.length}{#each ['2027-05-20', '2027-05-21'] as d}{@const list = filtered.filter(
        (s) => s.start.startsWith(d),
      )}{#if list.length}<div class="day-heading">
          <h2>{d.endsWith('20') ? 'Thursday, May 20' : 'Friday, May 21'}</h2>
          <span>Day {d.endsWith('20') ? '01' : '02'}</span>
        </div>
        <div class="session-grid">
          {#each list as session (session.id)}<SessionCard
              {session}
              user={data.user}
              bookable
              returnTo={currentUrl}
            />{/each}
        </div>{/if}{/each}{:else}<div class="empty">
      <Search size={28} style="margin:auto;color:var(--primary)" />
      <h2>No sessions found. Still plenty to discover.</h2>
      <p>Try a broader search or clear a filter to find something that sparks your curiosity.</p>
      <button class="btn primary" onclick={clear}
        >Clear all filters <ArrowUpRight size={16} /></button
      >
    </div>{/if}
</div>
<dialog class="mobile-filters-dialog" bind:this={filterDialog} aria-labelledby="filter-title">
  <div style="display:flex;justify-content:space-between">
    <h2 id="filter-title">Find your sessions</h2>
    <button class="btn ghost" onclick={() => filterDialog.close()} aria-label="Close filters"
      ><X size={20} /></button
    >
  </div>
  <div class="filter-fields">
    <div>
      <label for="mobile-track">Track</label><select id="mobile-track" bind:value={draft.track}
        ><option value="">All tracks</option>{#each tracks as t}<option>{t}</option>{/each}</select
      >
    </div>
    <div>
      <label for="mobile-date">Day</label><select id="mobile-date" bind:value={draft.date}
        ><option value="">Both days</option><option value="2027-05-20">Thu, May 20</option><option
          value="2027-05-21">Fri, May 21</option
        ></select
      >
    </div>
    <div>
      <label for="mobile-availability">Availability</label><select
        id="mobile-availability"
        bind:value={draft.availability}
        ><option value="">All sessions</option><option value="available">Seats available</option
        ><option value="full">Waitlist open</option></select
      >
    </div>
    <div>
      <label for="mobile-speaker">Speaker</label><select
        id="mobile-speaker"
        bind:value={draft.speaker}
        ><option value="">All speakers</option>{#each data.speakers as s}<option
            value={String(s.id)}>{s.name}</option
          >{/each}</select
      >
    </div>
    <div>
      <label for="mobile-level">Level</label><select id="mobile-level" bind:value={draft.level}
        ><option value="">All levels</option><option>Foundational</option><option
          >Intermediate</option
        ><option>Advanced</option></select
      >
    </div>
  </div>
  <div class="form-actions">
    <button
      class="btn"
      onclick={() => {
        draft = { track: '', date: '', availability: '', speaker: '', level: '' };
      }}>Reset</button
    ><button
      class="btn primary"
      onclick={() => {
        ({ track, date, availability, speaker, level } = draft);
        apply();
        filterDialog.close();
      }}>Apply filters</button
    >
  </div>
</dialog>
