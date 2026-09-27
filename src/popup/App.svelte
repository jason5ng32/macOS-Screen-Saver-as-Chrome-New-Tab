<script>
  import { settings } from "../lib/settings.svelte.js";
  import { loadLanguage, resolveLanguage } from "../lib/i18n.svelte.js";
  import { zen } from "../lib/zen.svelte.js";
  import Clock from "../components/Clock.svelte";
  import SkyArc from "../components/SkyArc.svelte";
  import VideoBackground from "../components/VideoBackground.svelte";
  import VideoMetadata from "../components/VideoMetadata.svelte";
  import Weather from "../components/Weather.svelte";
  import TopSites from "../components/TopSites.svelte";
  import ZenMode from "../components/ZenMode.svelte";
  import RefreshButton from "../components/RefreshButton.svelte";
  import Motto from "../components/Motto.svelte";
  import PillStack from "../components/PillStack.svelte";
  import BreathingGuide from "../components/BreathingGuide.svelte";

  const CURSOR_IDLE_MS = 2000;
  let zenStage = $state();
  let cursorHidden = $state(false);

  $effect(() => {
    loadLanguage(resolveLanguage(settings.userLanguage));
  });

  $effect(() => {
    if (!zen.active || !zenStage || document.fullscreenElement !== zenStage) return;

    const stage = zenStage;
    let idleTimer;

    function showCursor() {
      clearTimeout(idleTimer);
      cursorHidden = false;
      idleTimer = setTimeout(() => {
        cursorHidden = true;
      }, CURSOR_IDLE_MS);
    }

    function cleanup() {
      clearTimeout(idleTimer);
      cursorHidden = false;
      stage.removeEventListener('pointermove', showCursor);
      stage.removeEventListener('pointerdown', showCursor);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }

    function handleFullscreenChange() {
      if (document.fullscreenElement !== stage) cleanup();
    }

    stage.addEventListener('pointermove', showCursor);
    stage.addEventListener('pointerdown', showCursor);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    // Start the countdown even if the mouse never moves after entering Zen.
    showCursor();
    return cleanup;
  });
</script>

<!-- Zen stage: the element fullscreened on entering Zen. Wrapping the
     video lets sibling overlays (BreathingGuide) appear inside the
     fullscreen view rather than being hidden by it. -->
<div id="zen-stage" bind:this={zenStage} class:cursor-hidden={cursorHidden}>
  <VideoBackground />
  {#if zen.active && settings.zenBreathingPattern !== 'off'}
    <BreathingGuide />
  {/if}
</div>

<VideoMetadata />
<Weather />
<PillStack />

<!-- Bottom-left button stack. flex-col-reverse anchors the first DOM
     child at the bottom; subsequent buttons appear above it. -->
<div
  class="fixed bottom-6 left-6 z-40 flex flex-col-reverse items-center gap-3"
>
  <ZenMode />
</div>

<!-- Bottom-right button stack. Same convention: first child = bottom. -->
<div
  class="fixed bottom-6 right-6 z-40 flex flex-col-reverse items-center gap-3"
>
  <RefreshButton />
  <TopSites />
</div>

<!-- Time slot anchored at fixed viewport position. Clock and SkyArc
     each render based on settings.timeDisplay; only one is visible at
     a time (or neither, if 'off'). Motto is below the time. -->
<div
  class="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center flex flex-col items-center justify-center min-h-[240px] h-[240px] gap-4"
>
  <div>
    <Clock class="min-h-[120px] h-[120px]" />
    <SkyArc />
  </div>
  <div class="min-h-[120px] h-[120px]">
    <Motto />
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    background: #000;
    color: #eee;
    font-family: system-ui, sans-serif;
    overflow: hidden;
  }
  /* Stage is purely a fullscreen anchor — no layout impact when not in
     fullscreen. Background restores black so the fullscreen container
     itself isn't transparent during the brief moment before <video>
     paints. */
  #zen-stage {
    background: #000;
  }
  #zen-stage:fullscreen.cursor-hidden,
  #zen-stage:fullscreen.cursor-hidden :global(*) {
    cursor: none;
  }
</style>
