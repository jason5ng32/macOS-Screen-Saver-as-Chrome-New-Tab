<script>
  import {
    settings,
    updateSetting,
    bindSetting,
  } from '../../lib/settings.svelte.js';
  import { t, resolveLanguage } from '../../lib/i18n.svelte.js';
  import {
    SHUFFLE_SCOPE_OPTIONS,
    primaryShuffleScope,
  } from '../../lib/shuffle-scope.js';
  import { categoryName } from '../../lib/video-i18n.js';
  import SettingsCard from './SettingsCard.svelte';
  import VideoSetupHelp from '../VideoSetupHelp.svelte';

  const selectedScope = $derived(primaryShuffleScope(settings.shuffleScopes));
  const lang = $derived(resolveLanguage(settings.userLanguage));

  function setShuffleScope(event) {
    return updateSetting('shuffleScopes', [event.currentTarget.value]);
  }

  function scopeLabel(scope) {
    if (scope.category) return categoryName(scope.category, lang);
    return t(scope.labelKey);
  }
</script>

<SettingsCard emoji="📺" title={t('options_video_section')}>
  <div class="space-y-3">
    <label class="flex items-center justify-between gap-4">
      <span class="text-sm text-slate-700">
        {t('options_video_source')}
      </span>
      <select
        class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
        value={settings.videoSrc}
        onchange={bindSetting('videoSrc')}
      >
        <option value="apple">{t('options_video_source_apple')}</option>
        <option value="local">{t('options_video_source_local')}</option>
      </select>
    </label>

    <label class="flex items-center justify-between gap-4">
      <span class="text-sm text-slate-700">
        {t('options_video_shuffle_scope')}
      </span>
      <select
        class="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
        value={selectedScope}
        onchange={setShuffleScope}
      >
        {#each SHUFFLE_SCOPE_OPTIONS as scope}
          <option value={scope.value}>{scopeLabel(scope)}</option>
        {/each}
      </select>
    </label>
    <p class="text-xs leading-relaxed text-slate-500">
      {t('options_video_shuffle_scope_hint')}
    </p>

    <label class="flex items-center justify-between gap-4">
      <span class="text-sm text-slate-700">
        {t('options_video_repeat_current')}
      </span>
      <input
        type="checkbox"
        class="h-4 w-4 cursor-pointer accent-blue-600"
        checked={settings.repeatCurrentVideo}
        onchange={bindSetting('repeatCurrentVideo')}
      />
    </label>

    {#if settings.videoSrc === 'apple'}
      <label class="flex items-center justify-between gap-4">
        <span class="text-sm text-slate-700">
          {t('options_video_reverse_proxy')}
        </span>
        <input
          type="checkbox"
          class="h-4 w-4 cursor-pointer accent-blue-600"
          checked={settings.reverseProxy}
          onchange={bindSetting('reverseProxy')}
        />
      </label>
      {#if settings.reverseProxy}
        <p
          class="rounded-md bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200"
        >
          {t('options_video_reverse_proxy_warning')}
        </p>
      {/if}
    {:else}
      <label class="flex items-center gap-3">
        <span class="text-sm whitespace-nowrap text-slate-700">
          {t('options_video_local_url')}
        </span>
        <input
          type="text"
          class="flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          value={settings.videoSourceUrl}
          onchange={bindSetting('videoSourceUrl')}
        />
      </label>
    {/if}

    <VideoSetupHelp />
  </div>
</SettingsCard>
