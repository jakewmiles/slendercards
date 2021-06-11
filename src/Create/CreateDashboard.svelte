<script>
  import LanguageChoices from './LanguageChoices.svelte';
  import ContextCards from './ContextCards.svelte';
  
  let languagesChosen = false;

  let srcLang = '';
  let srcEmoji = '';
  const srcLangHandler = (language, emoji) => {
    srcLang = language;
    srcEmoji = emoji;
  }

  let targLang = '';
  let targEmoji = '';
  const targLangHandler = (language, emoji) => {
    targLang = language;
    targEmoji = emoji;
  }
</script>

<main>
  {#if !languagesChosen || !srcLang || !targLang}
    <LanguageChoices bind:languagesChosen={languagesChosen} bind:srcLang={srcLang} bind:targLang={targLang} {srcLangHandler} {targLangHandler}/>
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
</style>