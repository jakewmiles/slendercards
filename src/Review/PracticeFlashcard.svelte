<script>
  import Flashcard from "./Flashcard.svelte";
  import ReactionButtons from "./ReactionButtons.svelte";
  export let promisedData;
  let cardIndex = 0;
  let frontSide = true;
</script>

<main>
  {#await promisedData}
  <p>awaiting data...</p>
  {:then data}
    {#if !data.length}
      <p>No cards to display! Create some cards fast!</p>
    {/if}
    {#if data.length}
      {#if cardIndex < 5}
        {#key cardIndex}
        <h2>Card {cardIndex+1}/5</h2>
        <Flashcard {data} {cardIndex}/>
        {/key}
        <ReactionButtons {data} bind:cardIndex={cardIndex} bind:frontSide={frontSide}/>
      {/if}
    {/if}
  {#if cardIndex > 4}
    <h1>Round of cards finished!</h1>
  {/if}
  {:catch error}
  <p>Error!</p>
  {/await}
</main>

<style>
  main {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 1em;
    max-width: 500px;
    margin: 0 auto;
  }
</style>