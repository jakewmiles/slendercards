<script>
  export let cardIndex, data, flipped;
  let frontSide = true;
  const flip = ({delay = 0, duration = 500}) => {
    return {
      delay,
      duration,
      css: (u) => `transform: rotateY(${1 - (u * 180)}deg);
      opacity: ${1 - u};`
    };
  }
  const languages = {'English':'🇬🇧', 'German':'🇩🇪','Spanish':'🇪🇸', 'French':'🇫🇷', 'Italian':'🇮🇹', 'Polish':'🇵🇱', 'Russian':'🇷🇺'}
</script>

<div class='flashcard-container' on:click={() => {
    frontSide = !frontSide
    flipped = true;
  }}>
  <div class='flashcard'>
    {#if frontSide}
    <div transition:flip class='side'>
      <h1>{languages[data[cardIndex].srcLang]}</h1>
      <h2>{data[cardIndex].srcSentence}</h2>
    </div>
    {:else}
    <div transition:flip class='side back'>
      <h1>{languages[data[cardIndex].targLang]}</h1>
      <h2>{data[cardIndex].targSentence}</h2>
    </div>
    {/if}
  </div>
</div>

<style>
  h1 {
    font-size: 60px;
    margin: 0;
  }

  h2 {
    font-size: 30px;
    margin: 0;
  }

  .flashcard-container {
    position: relative;
    margin: 50px;
    min-width: 300px;
    max-width: 300px;
    height: 400px;
    perspective: 600;
  }

  .flashcard {
    width: 100%;
    height: 100%;
    position: absolute;
    perspective: 600;
  }

  .side {
    position: absolute;
    padding: 0 10px 0 10px;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: #d2661e;
    color: #000000;
    border-radius: 0.5rem;
    border-left: 0.4rem solid #000000;
  }

  .back {
    background-color: #000000;
    color: #d2661e;
    border-right: 0.4rem solid #d2661e;
  }
</style>