<script>
  import Flashcard from "./Flashcard.svelte";
  import ReactionButtons from "./ReactionButtons.svelte";
  import { fade } from 'svelte/transition';
  export let numberOfCards, filteredFlashcards;
  let cardIndex = 0;
  let frontSide = true;
  let flipped = false;
  let readyToRender = true;
</script>

<main>
  {#if !filteredFlashcards.length}
      <p>No cards to display! Create some cards fast!</p>
    {/if}
    {#if filteredFlashcards.length}
      {#key cardIndex}
        <div class='card-on-screen' transition:fade on:outrostart={() => readyToRender = false} on:outroend={() => readyToRender = true}>
          {#if cardIndex < (numberOfCards < filteredFlashcards.length ? numberOfCards : filteredFlashcards.length) && readyToRender}
            <h2>Card {cardIndex+1}/{numberOfCards < filteredFlashcards.length ? numberOfCards : filteredFlashcards.length}</h2>
            <Flashcard data={filteredFlashcards} {cardIndex} bind:flipped={flipped} {frontSide}/>
            {#if flipped}
              <ReactionButtons data={filteredFlashcards} bind:cardIndex={cardIndex} bind:frontSide={frontSide} bind:flipped={flipped}/>
            {/if}
          {/if}
        </div>
      {/key}
    {/if}
  {#if cardIndex === (numberOfCards < filteredFlashcards.length ? numberOfCards : filteredFlashcards.length)}
    <h1 transition:fade id='finished'>Review finished!</h1>
  {/if}
</main>

<style>
  main {
    margin: 0 auto;
    overflow: hidden;
  }

  .card-on-screen {
    display: grid;
    grid-template-columns: 0.5fr 1fr 1fr;
  }

  h2 {
    align-self: center;
    width: 90px;
    margin-left: 75px;
  }

  #finished {
    grid-column: 1 / span 3;
  }
</style>