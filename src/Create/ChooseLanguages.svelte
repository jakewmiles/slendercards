<script>
import ContextCards from "./ContextCards.svelte";

  const languages = {
    'English':'🇬🇧', 'Russian':'🇷🇺', 'German':'🇩🇪','Spanish':'🇪🇸', 'French':'🇫🇷', 'Italian':'🇮🇹', 'Polish':'🇵🇱'
  }

  let srcLang = '';
  let targLang = '';
  let srcEmoji = '';
  let targEmoji = '';

  const srcLangHandler = (language, emoji) => {
    srcLang = language;
    srcEmoji = emoji;
  }

  const targLangHandler = (language, emoji) => {
    targLang = language;
    targEmoji = emoji;
  }

  let languagesChosen = false;
</script>

<main>
  {#if !languagesChosen || !srcLang || !targLang}
  <h1>Choose languages</h1>
    <div class="lang-container">
      <div class="src-lang-list">
        <h3>Source language</h3>
        {#each Object.entries(languages) as [language, emoji]}
          <button on:click={() => srcLangHandler(language, emoji)}>{emoji}{language}</button>
        {/each}
      </div>
      <div class="targ-lang-list">
        <h3>Target language</h3>
        {#each Object.entries(languages) as [language, emoji]}
        <button on:click={() => targLangHandler(language, emoji)}>{emoji}{language}</button>
        {/each}
      </div>
    </div>
  <h1>Chosen languages:</h1>
  {#if !srcLang}
    <p>No L1 selected</p>
    {:else}
    <p>{srcLang}</p>
  {/if}
  {#if !targLang}
    <p>No L2 selected</p>
    {:else}
    <p>{targLang}</p>
  {/if}
  <a href='/#/'>GO BACK</a>
  <button on:click={() => {
    if (srcLang && targLang) languagesChosen = true
    if (srcLang === targLang) languagesChosen = false
    }}>NEXT</button>
  {/if}

  {#if languagesChosen && srcLang && targLang}
  <ContextCards {srcLang}{srcEmoji} {targLang}{targEmoji}/>
  <button on:click={() => {
    languagesChosen = !languagesChosen
    srcLang = !srcLang
    targLang = !targLang
  }}>Go back!</button>
  {/if}

</main>

<style>
  main {
    text-align: center;
    padding: 0;
    max-width: 800px;
    margin: 0 auto;
  }

  h1 {
    margin: 0;
  }

  .lang-container {
    display: flex;
    justify-content: space-around;
  }

  .src-lang-list {
    display: flex;
    flex-direction: column;
  }

  .targ-lang-list {
    display: flex;
    flex-direction: column;
  }
</style>