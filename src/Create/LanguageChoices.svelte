<script>
  import { fly } from 'svelte/transition';
  export let languagesChosen, srcLang, srcLangHandler, targLang, targLangHandler;

  const languages = {
    'English':'🇬🇧',
    'German':'🇩🇪',
    'Spanish':'🇪🇸',
    'French':'🇫🇷',
    'Italian':'🇮🇹',
    'Polish':'🇵🇱',
    'Russian':'🇷🇺',
    'Portuguese':'🇵🇹',
    'Japanese':'🇯🇵',
    'Chinese':'🇨🇳'
  }

</script>

  <div class="lang-container">
    <div class="src-lang-list">
      <h3>Source:</h3>
      {#each Object.entries(languages) as [language, emoji]}
        <button class='animated-button language-choice' in:fly={{x: -100, duration: 1000}} 
                on:click={() => srcLangHandler(language, emoji)}>
                {emoji}{language}
        </button>
      {/each}
    </div>
    <div class="targ-lang-list">
      <h3>Target:</h3>
      {#each Object.entries(languages) as [language, emoji]}
      <button class='animated-button language-choice' in:fly={{x: 100, duration: 1000}} 
              on:click={() => targLangHandler(language, emoji)}>
              {emoji}{language}
      </button>
      {/each}
    </div>
  </div>

  <h2>Chosen languages:</h2>
  {#if !srcLang}
    <h3>No source language selected</h3>
  {:else}
    <h3>Source: {languages[srcLang]} {srcLang}</h3>
  {/if}
  {#if !targLang}
    <h3>No target language selected</h3>
  {:else}
    <h3>Target: {languages[targLang]} {targLang}</h3>
  {/if}

  <button class='animated-button language-choice' on:click={() => {
    if (srcLang && targLang) languagesChosen = true
    if (srcLang === targLang) languagesChosen = false
  }}>Next
  </button>

<style>
  button {
    margin: 5px;
  }

  h3 {
    margin-bottom: 5px;
  }

  .language-choice {
    z-index: 2;
    width: 120px;
    transition: all 0.15s ease;
    overflow: hidden;
  }
  .language-choice:after {
    position: absolute;
    content: " ";
    z-index: -1;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: all 0.15s ease;
  }
  .language-choice:hover {
    color: #000;
  }
  .language-choice:hover:after {
    -webkit-transform: scale(1) rotate(180deg);
    transform: scale(1) rotate(180deg);
    background: #FFF;
  }
</style>