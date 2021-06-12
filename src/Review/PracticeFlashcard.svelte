<script>
  import Flashcard from "./Flashcard.svelte";
  import ReactionButtons from "./ReactionButtons.svelte";
  export let promisedData, numberOfCards;
  let cardIndex = 0;
  let frontSide = true;
  let flipped = false;
  

</script>

<main>
  {#await promisedData}
  <p>awaiting data...</p>
  {:then data}
    {#if !data.length}
      <p>No cards to display! Create some cards fast!</p>
    {/if}
    {#if data.length}
      {#if cardIndex < (numberOfCards < data.length ? numberOfCards : data.length)}
        {#key cardIndex}
          <h2>Card {cardIndex+1}/{numberOfCards < data.length ? numberOfCards : data.length}</h2>
          <Flashcard {data} {cardIndex} bind:flipped={flipped}/>
        {/key}
        {#if flipped}
          <ReactionButtons {data} bind:cardIndex={cardIndex} bind:frontSide={frontSide} bind:flipped={flipped}/>
        {/if}
      {/if}
    {/if}
  {#if cardIndex === (numberOfCards < data.length ? numberOfCards : data.length)}
    <h1 id='finished'>Review finished!</h1>
  {/if}
  {:catch error}
  <p>Error!</p>
  {/await}
</main>

<style>
  main {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 1em;
    max-width: 500px;
    margin: 0 auto;
  }

  #finished {
    grid-column: 1 / span 3;
  }
</style>