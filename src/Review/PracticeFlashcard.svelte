<script>
  import Flashcard from "./Flashcard.svelte";
  import ReactionButtons from "./ReactionButtons.svelte";
  export let numberOfCards, filteredFlashcards;
  let cardIndex = 0;
  let frontSide = true;
  let flipped = false;
</script>

<main>
  {#if !filteredFlashcards.length}
      <p>No cards to display! Create some cards fast!</p>
    {/if}
    {#if filteredFlashcards.length}
      {#if cardIndex < (numberOfCards < filteredFlashcards.length ? numberOfCards : filteredFlashcards.length)}
        <h2>Card {cardIndex+1}/{numberOfCards < filteredFlashcards.length ? numberOfCards : filteredFlashcards.length}</h2>
        <Flashcard data={filteredFlashcards} {cardIndex} bind:flipped={flipped}/>
        {#if flipped}
          <ReactionButtons data={filteredFlashcards} bind:cardIndex={cardIndex} bind:frontSide={frontSide} bind:flipped={flipped}/>
        {/if}
      {/if}
    {/if}
  {#if cardIndex === (numberOfCards < filteredFlashcards.length ? numberOfCards : filteredFlashcards.length)}
    <h1 id='finished'>Review finished!</h1>
  {/if}
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