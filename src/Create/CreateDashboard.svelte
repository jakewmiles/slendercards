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
    <button class='animated-button return-button' on:click={() => {
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

	.return-button {
    z-index: 2;
    transition: all 0.15s ease;
    overflow: hidden;
  }
  .return-button:after {
    position: absolute;
    content: " ";
    z-index: -1;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: all 0.15s ease;
  }
  .return-button:hover {
    color: #000;
  }
  .return-button:hover:after {
    -webkit-transform: scale(1) rotate(180deg);
    transform: scale(1) rotate(180deg);
    background: #FFF;
  }
</style>