<script>
  export let cardIndex, data;
  let frontSide = true;
  const flip = ({delay = 0, duration = 500}) => {
    return {
      delay,
      duration,
      css: (u) => `transform: rotateY(${1 - (u * 180)}deg);
      opacity: ${1 - u};`
    };
  }

</script>

<div class='flashcard-container' on:click={() => frontSide = !frontSide}>
  <div class='flashcard'>
    {#if frontSide}
    <div transition:flip class='side'>
      <h1>Card {cardIndex+1}/5</h1>
      <h3>Source: {data[cardIndex].srcLang}</h3>
      <h4>{data[cardIndex].srcSentence}</h4>
    </div>
    {:else}
    <div transition:flip class='side back'>
      <h1>Card {cardIndex+1}/5</h1>
      <h3>Target: {data[cardIndex].targLang}</h3>
      <h4>{data[cardIndex].targSentence}</h4>
    </div>
    {/if}
  </div>
</div>

<style>
  .flashcard-container {
    position: relative;
    margin: 50px;
    width: 600px;
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
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
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