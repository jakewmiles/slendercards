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
      {#key cardIndex}
        {#if cardIndex < (numberOfCards < filteredFlashcards.length ? numberOfCards : filteredFlashcards.length)}
          <div class='card-on-screen'>
            <h2>Card {cardIndex+1}/{numberOfCards < filteredFlashcards.length ? numberOfCards : filteredFlashcards.length}</h2>
            <Flashcard data={filteredFlashcards} {cardIndex} bind:flipped={flipped} {frontSide}/>
            {#if flipped}
            <ReactionButtons data={filteredFlashcards} bind:cardIndex={cardIndex} bind:frontSide={frontSide} bind:flipped={flipped}/>
            {/if}
          </div>
        {/if}
      {/key}
    {/if}
  {#if cardIndex === (numberOfCards < filteredFlashcards.length ? numberOfCards : filteredFlashcards.length)}
    <h1 id='finished'>Review finished!</h1>
  {/if}
</main>

<style>
  main {
    /* display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 1em;
    max-width: 500px; */
    margin: 0 auto;
    overflow: hidden;
  }

  .card-on-screen {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
  }

  h2 {
    align-self: center;
  }

  #finished {
    grid-column: 1 / span 3;
  }
</style>