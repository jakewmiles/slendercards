<script>
  import { fade } from 'svelte/transition';
import Flashcard from './Flashcard.svelte';
import FlashcardTable from './FlashcardTable.svelte';
  import PracticeFlashcard from './PracticeFlashcard.svelte';

  const fetchAllFlashcards = (async () => {
    const response = await fetch('http://localhost:3000/flashcards')
    const data = await response.json();
    return data;
  })();

  let practiceMode = false;
  let numberOfCards = 1;
</script>

<main>  
  {#if !practiceMode}
  {#await fetchAllFlashcards}
    <p>Fetching all flashcards...</p>
  {:then data}
  {#if !data.length}
  <p>No flashcards saved! Create some flashcards first...</p>
  {/if}
  {#if data.length}
  <div id='practice-session-selector'>
    <div id='card-quantity-selector'>
      <label for='number-of-cards'>How many cards would you like to review? (1-10)</label>
      <input type='number' id='number-of-cards' name='number-of-cards' min='1' max='10' bind:value={numberOfCards}>
    </div>
    <button id='review-start' on:click={() => {
      practiceMode = !practiceMode;
    }}>➡️</button> 
        <div id='session-preview'>
          <p>Review session of {numberOfCards} {numberOfCards === 1 ? 'card' : 'cards'} </p>
          {#if numberOfCards > data.length}
          <p style='color: red'>Note that you will only be shown {data.length} cards</p>
          {/if}
        </div>
      </div>
      <div id='database-length'>
        <p>{data.length} cards currently saved</p>
      </div>
      <FlashcardTable flashcardData={data} />
      {/if}
      {:catch error}
      <p>An error occurred! {error}</p>
      {/await}
      {/if}
      
      {#if practiceMode}
        <PracticeFlashcard promisedData={fetchAllFlashcards} {numberOfCards}/>
        <button on:click={() => {
          practiceMode = !practiceMode;
        }}>Go back!</button>
      {/if}
      
    </main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 800px;
    margin: 0 auto;
    overflow-y: scroll;
  }

  #review-start {
    background-color: transparent;
    border: none;
    text-align: center;
    font-size: 30px;
  }

  #practice-session-selector {
    display: grid;
    height: 80px;
    grid-template-columns: 0.5fr 0.5fr 2fr;
  }

  #database-length {
    padding: 10px;
  }

  #card-quantity-selector {
    display: flex;
    flex-direction: column;
  }

  #session-preview > p {
    margin: 0;
    text-align: left;
    font-size: 16px;
    padding: 10px;
    display: flex;
    flex-direction: column;
  }
</style>