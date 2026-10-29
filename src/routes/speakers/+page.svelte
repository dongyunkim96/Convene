<script lang="ts">
  import { ArrowUpRight } from '@lucide/svelte';
  let { data }: import('./$types').PageProps = $props();
</script>

<svelte:head><title>Speakers · CONVENE 2027</title></svelte:head>
<div class="wrap">
  <div class="page-head">
    <div class="eyebrow">PRACTITIONERS, NOT PEDESTALS</div>
    <h1>Good company. Fresh perspectives.</h1>
    <p>
      Twelve fictional voices from across technology, design, and leadership. People who make
      things, ask questions, and share what they learn.
    </p>
  </div>
  <div class="speaker-grid">
    {#each data.speakers as speaker}<article class="speaker-card" id={'speaker-' + speaker.id}>
        <div class="speaker-portrait" style={'--portrait:' + speaker.color} aria-hidden="true">
          <span class="portrait-letters">{speaker.initials}</span>
        </div>
        <h2 style="font-size:23px;margin-top:17px">{speaker.name}</h2>
        <p>{speaker.title} · {speaker.company}</p>
        <div class="speaker-bio muted">{speaker.bio}</div>
        <div style="display:grid;gap:8px;margin-top:16px">
          {#each data.sessions.filter((s) => s.speakerId === speaker.id) as session}<a
              class="text-link"
              style="font-size:12px"
              href={'/sessions/' + session.slug}>{session.title}<ArrowUpRight size={13} /></a
            >{/each}
        </div>
      </article>{/each}
  </div>
</div>
