<script>
  import { fade } from 'svelte/transition';
  import PracticeFlashcard from './PracticeFlashcard.svelte';

  const fetchAllFlashcards = async () => {
    const response = await fetch('http://localhost:3000/flashcards')
    const data = await response.json();
    return data;
  };

  const removeFlashcard = async (id) => {
    await fetch(`http://localhost:3000/flashcards/${id}`, {
      method: 'DELETE',
    });
  }

  let practiceMode = false;
  let numberOfCards = 1;
  let numberOfRounds = 1;
</script>

<main>  
  
  {#if !practiceMode}
  {#await fetchAllFlashcards()}
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
          {#if numberOfCards * numberOfRounds > data.length}
          <p style='color: red'>Note that you will only be shown {data.length} cards</p>
          {/if}
        </div>
      </div>
      
      <div id='database-length'>
        <p>{data.length} cards currently saved</p>
      </div>
      <div class='database-table'>
        <table>
          <thead>
            <tr>
              <th>srcLang</th>
              <th>srcSentence</th>
              <th>targLang</th>
              <th>targSentence</th>
            </tr>
          </thead>
          <!-- {#if visible} -->
          {#each data as sentence} 
          <tbody>
            <tr transition:fade>
              <td>{sentence.srcLang}</td>
              <td>{sentence.srcSentence}</td>
              <td>{sentence.targLang}</td>
              <td>{sentence.targSentence}</td>
              <td><button class='delete-button' on:click={() => {
                // visible = false;
                removeFlashcard(sentence._id);
              }}>❌</button></td>
            </tr>
          </tbody>
          {/each}
          <!-- {/if} -->
        </table>
      </div>
      {/if}
      {:catch error}
      <p>An error occurred! {error}</p>
      {/await}
      {/if}
      
      {#if practiceMode}
        <PracticeFlashcard promisedData={fetchAllFlashcards()} {numberOfCards}/>
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

  .delete-button {
    background-color: transparent;
    border: none;
    text-align: center;
    font-size: 30px;
  }

  #review-start {
    background-color: transparent;
    border: none;
    text-align: center;
    font-size: 30px;
  }

  .database-table {
    overflow-y: auto;
  }

  table, tr {
    width: 100%;
    border: 1px solid white;
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