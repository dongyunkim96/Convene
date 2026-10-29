<script lang="ts">
  import { refreshAll } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { Session, User } from '../types.ts';
  import { Check, Plus, Clock, LockKeyhole } from '@lucide/svelte';
  let { session, user }: { session: Session; user?: User | null } = $props();
  let pending = $state(false),
    message = $state(''),
    failed = $state(false),
    conflictSlug = $state(''),
    ready = $state(false);
  onMount(() => {
    ready = true;
  });
  let dialog: HTMLDialogElement;
  const restricted = $derived(session.access === 'vip' && user?.category !== 'vip');
  async function mutate(action: 'book' | 'cancel') {
    pending = true;
    message = '';
    conflictSlug = '';
    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: session.id, action }),
      });
      const result = await response.json();
      failed = !response.ok;
      message = result.message;
      conflictSlug = result.conflictSlug ?? '';
      await refreshAll();
    } catch {
      failed = true;
      message = 'Connection interrupted. Refresh to check your reservation, then try again.';
    } finally {
      pending = false;
    }
  }
</script>

<div class="booking">
  {#if !user}<a class="btn primary" href="/login">Sign in to reserve <Plus size={15} /></a>
  {:else if session.state}<div class="actions">
      <span class="badge success"
        >{#if session.state === 'reserved'}<Check size={13} />Reserved{:else}<Clock size={13} />On
          waitlist · #{session.position}{/if}</span
      ><button class="btn" disabled={pending || !ready} onclick={() => dialog.showModal()}
        >{session.state === 'reserved' ? 'Cancel reservation' : 'Leave waitlist'}</button
      >
    </div>
  {:else if restricted}<span class="badge warning"
      ><LockKeyhole size={13} />VIP access required</span
    >
  {:else}<button class="btn primary" disabled={pending || !ready} onclick={() => mutate('book')}
      >{#if pending}Updating…{:else if session.confirmed >= session.capacity}<Clock size={15} />Join
        waitlist{:else}<Plus size={15} />Reserve seat{/if}</button
    >{/if}
  {#if message}<div
      class="booking-status"
      class:error={failed}
      class:success={!failed}
      role={failed ? 'alert' : 'status'}
    >
      {message}{#if conflictSlug}<a href={'/sessions/' + conflictSlug}
          >Review conflicting reservation →</a
        >{/if}
    </div>{/if}
</div>
<dialog bind:this={dialog} aria-labelledby={'cancel-title-' + session.id}>
  <h2 id={'cancel-title-' + session.id}>
    {session.state === 'reserved' ? 'Cancel your reservation?' : 'Leave this waitlist?'}
  </h2>
  <p>
    {session.state === 'reserved'
      ? 'Your seat may be offered to someone on the waitlist. You can reserve again if a seat remains available.'
      : 'You will lose your place in line. You can join again at the end of the waitlist.'}
  </p>
  <p><strong>{session.title}</strong></p>
  <div class="actions">
    <button class="btn" onclick={() => dialog.close()}>Keep my place</button><button
      class="btn danger"
      onclick={() => {
        dialog.close();
        mutate('cancel');
      }}>Confirm cancellation</button
    >
  </div>
</dialog>
