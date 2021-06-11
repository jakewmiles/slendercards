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
  // let visible = true;
</script>

<main>

  {#if !practiceMode}
    <button on:click={() => {
      practiceMode = !practiceMode;
    }}>PRACTICE</button>
  {/if}
  
  {#if practiceMode}
    <button on:click={() => {
      practiceMode = !practiceMode;
    }}>Go back!</button>
  {/if}
  
  {#if !practiceMode}
    {#await fetchAllFlashcards()}
      <p>Fetching all flashcards...</p>
    {:then data}
      {#if !data.length}
        <p>No flashcards in the database! Create some flashcards first...</p>
      {/if}
      {#if data.length}
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
              <td><button class="delete-button" on:click={() => {
                // visible = false;
                removeFlashcard(sentence._id);
              }}>❌</button></td>
            </tr>
          </tbody>
        {/each}
        <!-- {/if} -->
        </table>
    {/if}
    {:catch error}
      <p>An error occurred! {error}</p>
    {/await}
  {/if}
            
  {#if practiceMode}
    <PracticeFlashcard promisedData={fetchAllFlashcards()}/>
  {/if}

</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 800px;
    margin: 0 auto;
  }

  .delete-button {
    background-color: transparent;
    border: none;
    text-align: center;
    font-size: 30px;
  }

  table {
    width: 50%;
    border-collapse: collapse;
    overflow: hidden;
    box-shadow: 0 0 20px rgba(0,0,0,0.1);
  }

  th, td {
	  padding: 15px;
    text-align: left;
  }

</style>