<script>
  import { fade, fly } from 'svelte/transition';
  export let languagesChosen, srcLang, srcLangHandler, targLang, targLangHandler;
  let readyToRenderSrc = true;
  let readyToRenderTarg = true;

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

<main>
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

    <div id='chosen-languages-container'>
      <h2>Chosen languages:</h2>
      <div id='selected-languages'>
        {#if !srcLang}
        <h3 transition:fade on:outrostart={() => readyToRenderSrc = false} on:outroend={() => readyToRenderSrc = true}>No source language selected</h3>
        {:else if readyToRenderSrc}
        <h3>{languages[srcLang]} {srcLang}</h3>
        {/if}
        <h4>↓</h4>
        {#if !targLang}
        <h3 transition:fade on:outrostart={() => readyToRenderTarg = false} on:outroend={() => readyToRenderTarg = true}>No target language selected</h3>
        {:else if readyToRenderTarg} 
        <h3>{languages[targLang]} {targLang}</h3>
        {/if}
      </div>
    </div>
        <button class='animated-button language-choice' on:click={() => {
          if (srcLang && targLang) languagesChosen = true
          if (srcLang === targLang) languagesChosen = false
        }}>Next
        </button>
</main>

<style>
  main {
    margin-top: 50px;
  }

  button {
    margin: 5px;
  }
  h2 {
    margin-left: 40px;
  }
  h3 {
    height: 30px;
    margin-bottom: 5px;
  }
  h4 {
    margin: 5px 50px;
  }
  #chosen-languages-container {
    margin: 50px 0 0 0;
    display: flex;
    justify-content: center;
    align-items: center;
    padding-bottom: 10px;
  }
  #selected-languages {
    display: flex;
    flex-direction: column;
    text-align: left;
    width: 260px;
    margin: 0 25px;
  }
  .language-choice {
    z-index: 2;
    border-radius: 20px;
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