<script>
  import { fly } from 'svelte/transition';
  export let languagesChosen, srcLang, srcLangHandler, targLang, targLangHandler;

  const languages = {'English':'🇬🇧', 'German':'🇩🇪','Spanish':'🇪🇸', 'French':'🇫🇷', 'Italian':'🇮🇹', 'Polish':'🇵🇱', 'Russian':'🇷🇺'}

</script>

  <div class="lang-container">
    <div class="src-lang-list">
      <h3>Source:</h3>
      {#each Object.entries(languages) as [language, emoji]}
        <button in:fly={{x: -100, duration: 1000}} 
                on:click={() => srcLangHandler(language, emoji)}>
                {emoji}{language}
        </button>
      {/each}
    </div>
    <div class="targ-lang-list">
      <h3>Target:</h3>
      {#each Object.entries(languages) as [language, emoji]}
      <button in:fly={{x: 100, duration: 1000}} 
              on:click={() => targLangHandler(language, emoji)}>
              {emoji}{language}
      </button>
      {/each}
    </div>
  </div>

  <h1>Chosen languages:</h1>
  {#if !srcLang}
    <p>No L1 selected</p>
  {:else}
    <p>Source: {srcLang}</p>
  {/if}
  {#if !targLang}
    <p>No L2 selected</p>
  {:else}
    <p>Target: {targLang}</p>
  {/if}

  <button on:click={() => {
    if (srcLang && targLang) languagesChosen = true
    if (srcLang === targLang) languagesChosen = false
  }}>NEXT
  </button>