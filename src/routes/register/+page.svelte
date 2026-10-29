<script lang="ts">
  import { enhance } from '$app/forms';
  import { tick, onMount } from 'svelte';
  import { CalendarDays, MapPin, ArrowRight, ArrowLeft, Check, Ticket } from '@lucide/svelte';
  import { tracks } from '#lib/event.ts';
  import { registrationSchema } from '#lib/validation.ts';
  let { form }: import('./$types').PageProps = $props();
  let step = $state(0),
    pending = $state(false),
    ready = $state(false);
  onMount(() => {
    ready = true;
  });
  let v = $state({
    category: 'general',
    code: '',
    first: '',
    last: '',
    email: '',
    password: '',
    company: '',
    title: '',
    preferences: '',
    consent: false,
  });
  let interests = $state<string[]>([]),
    errors = $state<{ field: string; message: string }[]>([]);
  let summary = $state<HTMLDivElement>();
  const fieldError = (name: string) => errors.find((e) => e.field === name)?.message;
  async function next() {
    const parsed = registrationSchema.safeParse({
      ...v,
      interests: interests.join(', '),
      consent: v.consent ? 'on' : '',
    });
    const fields =
      step === 0
        ? ['category']
        : step === 1
          ? ['first', 'last', 'email', 'password', 'company', 'title']
          : ['preferences'];
    errors = parsed.success
      ? []
      : parsed.error.issues
          .filter((e) => fields.includes(String(e.path[0])))
          .map((e) => ({ field: String(e.path[0]), message: e.message }));
    if (step === 0 && v.category !== 'general' && !v.code)
      errors.push({ field: 'code', message: 'Enter your invitation code.' });
    if (errors.length) {
      await tick();
      summary?.focus();
      return;
    }
    step++;
    await tick();
    document.getElementById('registration-step-' + step)?.focus();
  }
</script>

<svelte:head><title>Register · CONVENE 2027</title></svelte:head>
<div class="wrap registration-layout">
  <aside class="registration-aside">
    <div class="eyebrow">YOUR NEXT GOOD CONVERSATION STARTS HERE</div>
    <h1>Bring your<br />curiosity.</h1>
    <p>Make room for two days of useful ideas, new connections, and a fresh perspective.</p>
    <div class="event-info">
      <span><CalendarDays size={17} />May 20–21, 2027</span><span
        ><MapPin size={17} />The Foundry · Brooklyn, New York</span
      ><span><Ticket size={17} />Conference registration · Free demo</span>
    </div>
    <div class="notice" style="margin-top:28px">
      This is a fictional event. No payment is required and no email will be sent. Already
      registered? <a href="/login">Sign in</a>.
    </div>
  </aside>
  <form
    class="panel registration-form"
    method="POST"
    novalidate
    use:enhance={() => {
      pending = true;
      errors = [];
      return async ({ result, update }) => {
        pending = false;
        await update({ reset: false });
        if (result.type === 'failure') {
          errors = (result.data?.errors ?? []) as typeof errors;
          await tick();
          summary?.focus();
        }
      };
    }}
  >
    <div class="eyebrow">LET’S MAKE IT OFFICIAL</div>
    <div class="progress" aria-label="Registration progress">
      {#each ['Your pass', 'Your details', 'Your interests', 'Review'] as name, i}<span
          class:active={step === i}
          aria-current={step === i ? 'step' : undefined}>0{i + 1} {name}</span
        >{/each}
    </div>
    {#if errors.length}<div class="notice error" role="alert" tabindex="-1" bind:this={summary}>
        <strong>Let’s check a few things.</strong>
        <ul>
          {#each errors as e}<li>
              <a
                href={'#' + e.field}
                onclick={() => {
                  step = ['category', 'code'].includes(e.field)
                    ? 0
                    : ['first', 'last', 'email', 'password', 'company', 'title'].includes(e.field)
                      ? 1
                      : e.field === 'consent'
                        ? 3
                        : 2;
                }}>{e.message}</a
              >
            </li>{/each}
        </ul>
      </div>{/if}
    <div hidden={step !== 0}>
      <h2 id="registration-step-0" tabindex="-1">Choose your conference pass.</h2>
      <p class="small muted" style="margin-top:10px">
        All passes include session discovery, your agenda, and a digital pass.
      </p>
      <fieldset class="category-options">
        <legend class="sr-only">Attendee category</legend
        >{#each [['general', 'General attendee', 'For curious minds across technology.'], ['vip', 'VIP attendee', 'Invitation required. Includes exclusive VIP sessions.'], ['speaker', 'Speaker', 'Invitation required. For the voices on our stages.']] as [value, label, copy]}<label
            class="category-option"
            ><input type="radio" name="category" {value} bind:group={v.category} /><span
              ><strong>{label}</strong><small>{copy}</small></span
            ></label
          >{/each}
      </fieldset>
      {#if v.category !== 'general'}<div class="field">
          <label for="code">Invitation code</label><input
            id="code"
            name="code"
            bind:value={v.code}
            aria-invalid={!!fieldError('code')}
            aria-describedby={fieldError('code') ? 'code-help code-error' : 'code-help'}
          />
          <p id="code-help" class="small muted" style="margin-top:7px">
            Demo code: {v.category === 'vip' ? 'CONVENE-VIP' : 'CONVENE-SPEAKER'}. Validated on the
            server.
          </p>
          {#if fieldError('code')}<p class="field-error" id="code-error">
              {fieldError('code')}
            </p>{/if}
        </div>{:else}<input type="hidden" name="code" value="" />{/if}
    </div>
    <div hidden={step !== 1}>
      <h2 id="registration-step-1" tabindex="-1">A little about you.</h2>
      <p class="small muted" style="margin:10px 0 24px">
        Your name will appear on your conference pass. Fields marked * are required.
      </p>
      <div class="field-grid">
        {#each [['first', 'First name', 'given-name'], ['last', 'Last name', 'family-name']] as const as [name, label, autocomplete]}<div
            class="field"
          >
            <label for={name}>{label} *</label><input
              id={name}
              {name}
              {autocomplete}
              bind:value={v[name as 'first' | 'last']}
              aria-invalid={!!fieldError(name)}
              aria-describedby={fieldError(name) ? name + '-error' : undefined}
            />{#if fieldError(name)}<p class="field-error" id={name + '-error'}>
                {fieldError(name)}
              </p>{/if}
          </div>{/each}
      </div>
      <div class="field" style="margin-top:20px">
        <label for="email">Email address *</label><input
          id="email"
          name="email"
          type="email"
          autocomplete="email"
          bind:value={v.email}
          aria-invalid={!!fieldError('email')}
          aria-describedby={fieldError('email') ? 'email-error' : undefined}
        />{#if fieldError('email')}<p id="email-error" class="field-error">
            {fieldError('email')}
          </p>{/if}
      </div>
      <div class="field">
        <label for="password">Create a password *</label><input
          id="password"
          name="password"
          type="password"
          autocomplete="new-password"
          bind:value={v.password}
          aria-invalid={!!fieldError('password')}
          aria-describedby={fieldError('password')
            ? 'password-help password-error'
            : 'password-help'}
        />
        <p id="password-help" class="small muted" style="margin-top:6px">
          At least 12 characters. You’ll use this to sign back in.
        </p>
        {#if fieldError('password')}<p id="password-error" class="field-error">
            {fieldError('password')}
          </p>{/if}
      </div>
      <div class="field-grid">
        <div class="field">
          <label for="company">Company <span class="muted">(optional)</span></label><input
            id="company"
            name="company"
            autocomplete="organization"
            bind:value={v.company}
          />
        </div>
        <div class="field">
          <label for="title">Job title <span class="muted">(optional)</span></label><input
            id="title"
            name="title"
            autocomplete="organization-title"
            bind:value={v.title}
          />
        </div>
      </div>
    </div>
    <div hidden={step !== 2}>
      <h2 id="registration-step-2" tabindex="-1">What sparks your curiosity?</h2>
      <p class="small muted" style="margin:10px 0 24px">
        These optional preferences help you plan your experience.
      </p>
      <fieldset>
        <legend>Topics of interest</legend>{#each tracks as track}<label class="checkbox-label"
            ><input type="checkbox" value={track} bind:group={interests} />{track}</label
          >{/each}
      </fieldset>
      <input type="hidden" name="interests" value={interests.join(', ')} />
      <div class="field" style="margin-top:25px">
        <label for="preferences"
          >Dietary & accessibility preferences <span class="muted">(optional)</span></label
        ><textarea
          id="preferences"
          name="preferences"
          bind:value={v.preferences}
          placeholder="Tell us what would help you feel welcome."
          maxlength="1000"></textarea>
        <p class="small muted" style="margin-top:7px">
          Share only what you’re comfortable sharing. These details are private.
        </p>
      </div>
    </div>
    <div hidden={step !== 3}>
      <h2 id="registration-step-3" tabindex="-1">Everything look right?</h2>
      <p class="small muted" style="margin-top:10px">
        Review your details before creating your registration.
      </p>
      <dl class="review-list">
        <div>
          <dt>Attendee</dt>
          <dd>{v.first} {v.last}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{v.email}</dd>
        </div>
        <div>
          <dt>Pass type</dt>
          <dd style="text-transform:capitalize">{v.category} attendee</dd>
        </div>
        <div>
          <dt>Company & title</dt>
          <dd>{[v.company, v.title].filter(Boolean).join(' · ') || 'Not provided'}</dd>
        </div>
        <div>
          <dt>Topics of interest</dt>
          <dd>{interests.join(', ') || 'Open to discovery'}</dd>
        </div>
        <div>
          <dt>Preferences</dt>
          <dd>{v.preferences || 'None provided'}</dd>
        </div>
      </dl>
      <label class="checkbox-label" for="consent"
        ><input
          id="consent"
          name="consent"
          type="checkbox"
          bind:checked={v.consent}
          aria-invalid={!!fieldError('consent')}
          aria-describedby={fieldError('consent') ? 'consent-error' : undefined}
        /><span
          >I understand this is a fictional demo and agree to have my registration stored in this
          local application. *</span
        ></label
      >{#if fieldError('consent')}<p class="field-error" id="consent-error">
          {fieldError('consent')}
        </p>{/if}
    </div>
    <div class="form-actions">
      {#if step > 0}<button
          class="btn"
          type="button"
          onclick={() => {
            step--;
            errors = [];
          }}><ArrowLeft size={15} />Back</button
        >{:else}<a class="btn ghost" href="/">Back to overview</a>{/if}{#if step < 3}<button
          class="btn primary"
          type="button"
          disabled={!ready}
          onclick={next}>Continue<ArrowRight size={15} /></button
        >{:else}<button class="btn primary" type="submit" disabled={pending}
          >{pending ? 'Creating your pass…' : 'Confirm registration'}<Check size={15} /></button
        >{/if}
    </div>
  </form>
</div>
