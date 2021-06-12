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
    'Japanese':'🇯🇵'
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

  <h1>Chosen languages:</h1>
  {#if !srcLang}
    <h3>No L1 selected</h3>
  {:else}
    <h3>Source: {languages[srcLang]} {srcLang}</h3>
  {/if}
  {#if !targLang}
    <h3>No L2 selected</h3>
  {:else}
    <h3>Target: {languages[targLang]} {targLang}</h3>
  {/if}

  <button on:click={() => {
    if (srcLang && targLang) languagesChosen = true
    if (srcLang === targLang) languagesChosen = false
  }}>NEXT
  </button>

<style>
  button {
    margin: 5px;
  }
  .animated-button {
    color: white;
    width: 130px;
    height: 40px;
    background: transparent;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    display: inline-block;
  }
  .language-choice {
    z-index: 2;
    transition: all 0.3s ease;
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
    transition: all 0.3s ease;
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