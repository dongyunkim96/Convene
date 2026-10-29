<script lang="ts">
  import { page } from '$app/state';
</script>

<svelte:head><title>{page.status} · CONVENE</title></svelte:head>
<div class="wrap">
  <section class="empty" style="margin-top:50px">
    <div class="eyebrow" style="justify-content:center">CONVENE · {page.status}</div>
    <h1 style="font-size:38px;margin:20px 0">
      {page.status === 403
        ? 'This space is for organizers.'
        : page.status === 404
          ? 'A little off the agenda.'
          : 'Something interrupted your plans.'}
    </h1>
    <p>{page.error?.message}</p>
    <div class="actions" style="justify-content:center">
      <a class="btn primary" href="/sessions">Explore sessions</a><a class="btn" href="/login"
        >Sign in</a
      >
    </div>
  </section>
</div>
