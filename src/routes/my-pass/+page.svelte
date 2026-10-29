<script lang="ts">
  import { Ticket, Download, Printer, Check, ArrowRight } from '@lucide/svelte';
  let { data }: import('./$types').PageProps = $props();
</script>

<svelte:head><title>My Pass · CONVENE</title></svelte:head>
<div class="wrap pass-page">
  <div class="page-head">
    <div class="eyebrow">ONE LESS THING TO THINK ABOUT</div>
    <h1>You’re in good company.</h1>
    <p>Your conference pass, ready to go. Show this QR code at the welcome desk.</p>
  </div>
  <div class="pass-layout">
    <article class="pass-card" aria-label="Your conference pass">
      <div class="pass-top">
        <div class="wordmark">
          CONVENE ↗ <span
            style="margin-left:auto;font-size:14px;letter-spacing:.06em;font-weight:400">2027</span
          >
        </div>
        <p class="small">A MEETING OF CURIOUS MINDS<br />MAY 20–21 · BROOKLYN, NEW YORK</p>
      </div>
      <div class="pass-body">
        <div class="eyebrow" style="justify-content:center;margin-bottom:12px">CONFERENCE PASS</div>
        <h2 class="pass-name">{data.user?.name}</h2>
        <span class="badge neutral" style="text-transform:capitalize"
          >{data.user?.category} attendee</span
        ><img
          class="qr"
          src={data.qr}
          alt={'Scannable conference pass for ' +
            data.user?.name +
            '. Registration reference ' +
            data.user?.reference}
        />
        <div class="pass-reference">{data.user?.reference}</div>
        <p class="small" style="margin-top:10px">
          {data.checked
            ? 'Checked in · Welcome to CONVENE'
            : 'Valid registration · Ready for check-in'}
        </p>
      </div>
      <div class="pass-footer">
        <span>THE FOUNDRY · BROOKLYN</span><span>ADMIT ONE / TWO DAYS</span>
      </div>
    </article>
    <section class="pass-info">
      <h2>Less searching.<br />More showing up.</h2>
      <p>
        Your pass confirms your conference registration. Session seats are reserved separately in
        your personal agenda.
      </p>
      <div class="actions no-print">
        <a class="btn primary" href={data.qr} download="convene-pass-qr.png"
          ><Download size={16} />Download QR</a
        ><button class="btn" onclick={() => window.print()}><Printer size={16} />Print pass</button>
      </div>
      <div class="notice">
        <strong>Keep your pass private.</strong>
        <p>
          The QR contains an opaque token, not your personal details. An authorized organizer
          validates it at the welcome desk.
        </p>
      </div>
      <details class="no-print">
        <summary style="font-size:12px">Manual verification fallback</summary>
        <p class="small" style="margin-top:10px">
          If scanning isn’t available, show your registration reference and this token to an
          organizer. The organizer can paste it into the verification screen.
        </p>
        <div class="token-text" style="margin-top:12px" data-testid="pass-token">{data.token}</div>
      </details>
      <a class="text-link no-print" href="/my-schedule" style="margin-top:25px;font-size:13px"
        >Your personal schedule<ArrowRight size={15} /></a
      >
    </section>
  </div>
</div>
