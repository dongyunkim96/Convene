<script lang="ts">
  import { enhance } from '$app/forms';
  import { Save, Ticket, LogOut } from '@lucide/svelte';
  let { data, form }: import('./$types').PageProps = $props();
  let pending = $state(false);
</script>

<svelte:head><title>Profile · CONVENE</title></svelte:head>
<div class="wrap">
  <div class="page-head">
    <div class="eyebrow">MAKE YOURSELF AT HOME</div>
    <h1>Your details.</h1>
    <p>A few things that make your conference experience yours.</p>
  </div>
  <div class="profile-grid">
    <aside class="panel profile-info" style="height:max-content">
      <div class="avatar" style="width:64px;height:64px;font-size:20px;background:#e4def4">
        {data.user?.name
          .split(' ')
          .map((n) => n[0])
          .join('')}
      </div>
      <h2>{data.user?.name}</h2>
      <p>{data.user?.email}</p>
      <span class="badge neutral" style="text-transform:capitalize"
        >{data.user?.category} attendee</span
      >
      <p style="font-family:monospace;margin-top:18px">{data.user?.reference}</p>
      <a class="text-link small" href="/my-pass" style="margin:10px 0 24px"
        ><Ticket size={15} />View your pass</a
      >{#if data.user?.role === 'organizer'}<p>
          <a class="text-link" href="/admin">Organizer dashboard →</a>
        </p>{/if}
      <form method="POST" action="/logout">
        <button class="btn full"><LogOut size={15} />Sign out</button>
      </form>
    </aside>
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
      <h2 style="font-size:27px;margin-bottom:25px">A little about your work.</h2>
      {#if form?.message}<div class="notice" role="status">{form.message}</div>{/if}
      <div class="field-grid">
        <div class="field">
          <label for="company">Company (optional)</label><input
            id="company"
            name="company"
            autocomplete="organization"
            value={data.user?.company}
            maxlength="120"
          />
        </div>
        <div class="field">
          <label for="title">Job title (optional)</label><input
            id="title"
            name="title"
            autocomplete="organization-title"
            value={data.user?.title}
            maxlength="120"
          />
        </div>
      </div>
      <div class="field" style="margin-top:25px">
        <label for="interests">Topics of interest (optional)</label><input
          id="interests"
          name="interests"
          value={data.user?.interests}
          maxlength="300"
        />
        <p class="small muted" style="margin-top:7px">
          Engineering, AI & Data, Design & Product, Leadership — or something in between.
        </p>
      </div>
      <div class="field">
        <label for="preferences">Dietary & accessibility preferences (optional)</label><textarea
          id="preferences"
          name="preferences"
          maxlength="1000">{data.user?.preferences}</textarea
        >
        <p class="small muted">These details stay private to your account.</p>
      </div>
      <button class="btn primary" disabled={pending}
        ><Save size={16} />{pending ? 'Saving…' : 'Save changes'}</button
      >
    </form>
  </div>
</div>
