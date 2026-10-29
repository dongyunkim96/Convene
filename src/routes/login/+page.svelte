<script lang="ts">
  import { enhance } from '$app/forms';
  import { ArrowRight } from '@lucide/svelte';
  let { form }: import('./$types').PageProps = $props();
  let email = $state(''),
    password = $state(''),
    pending = $state(false);
  const accounts = [
    ['General attendee', 'alex@convene.demo'],
    ['VIP attendee', 'vip@convene.demo'],
    ['Speaker', 'speaker@convene.demo'],
    ['Organizer', 'organizer@convene.demo'],
    ['Seat holder (waitlist demo)', 'casey@convene.demo'],
  ];
</script>

<svelte:head><title>Sign in · CONVENE</title></svelte:head>
<div class="wrap">
  <div class="narrow panel">
    <div class="eyebrow">YOUR CONFERENCE IS RIGHT HERE</div>
    <h1>Welcome back.</h1>
    <p class="small">Sign in to your agenda, saved seats, and conference pass.</p>
    <form
      method="POST"
      use:enhance={() => {
        pending = true;
        return async ({ update }) => {
          await update({ reset: false });
          pending = false;
        };
      }}
    >
      {#if form?.message}<div class="notice error" role="alert">{form.message}</div>{/if}
      <div class="field">
        <label for="email">Email address</label><input
          id="email"
          name="email"
          type="email"
          autocomplete="email"
          required
          bind:value={email}
        />
      </div>
      <div class="field">
        <label for="password">Password</label><input
          id="password"
          name="password"
          type="password"
          autocomplete="current-password"
          required
          bind:value={password}
        />
      </div>
      <button class="btn primary full" disabled={pending}
        >{pending ? 'Signing in…' : 'Sign in'}<ArrowRight size={16} /></button
      >
    </form>
    <p class="small" style="margin-top:20px">
      New here? <a class="text-link" href="/register">Create your registration</a>
    </p>
    <section class="demo-box">
      <h2>Take a look around.</h2>
      <p class="small">
        Demo accounts · Click to fill, then sign in.<br />Password for each:
        <strong>Convene2027!</strong>
      </p>
      {#each accounts as [label, address]}<div class="demo-account">
          <button
            onclick={() => {
              email = address;
              password = 'Convene2027!';
            }}>{label}</button
          ><span>{address}</span>
        </div>{/each}
      <p class="small" style="margin-top:15px">
        For new VIP or speaker registrations, use <strong>CONVENE-VIP</strong> or
        <strong>CONVENE-SPEAKER</strong> as your demo invitation code.
      </p>
    </section>
  </div>
</div>
