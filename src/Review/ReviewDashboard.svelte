<script>
  import { fade } from 'svelte/transition';
import App from '../App.svelte';
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

  let reviewMode = '';

  // let visible = true;
</script>

<main>
  {#if !reviewMode}
    <h1>CHOOSE A MODE</h1>
    <button on:click={() => {
      reviewMode = 'overview';
    }}>CARD OVERVIEW</button>
    <button on:click={() => {
      reviewMode = 'practice';
    }}>PRACTICE</button>
  {/if}

  {#if reviewMode === 'overview'}
    {#await fetchAllFlashcards()}
      <p>Fetching all flashcards...</p>
    {:then data}
      <table>
        <tr>
          <th>srcLang</th>
          <th>srcSentence</th>
          <th>targLang</th>
          <th>targSentence</th>
          <th>dateCreated</th>
          <th>dateToBeReviewed</th>
          <th>timesSeen</th>
          <th>overallScore</th>
        </tr>
        <!-- {#if visible} -->
          {#each data as sentence, i} 
              <tr transition:fade>
                <td>{sentence.srcLang}</td>
                <td>{sentence.srcSentence}</td>
                <td>{sentence.targLang}</td>
                <td>{sentence.targSentence}</td>
                <td>{sentence.dateCreated}</td>
                <td>{sentence.dateToBeReviewed}</td>
                <td>{sentence.timesSeen}</td>
                <td>{sentence.overallScore}</td>
                <td><button class="delete-button" on:click={() => {
                  // visible = false;
                  removeFlashcard(sentence._id);
                }}>❌</button></td>
              </tr>
            {/each}
          <!-- {/if} -->
      </table>
    {:catch error}
      <p>An error occurred! {error}</p>
    {/await}
  {/if}

  {#if reviewMode === 'practice'}
    <PracticeFlashcard promisedData={fetchAllFlashcards()}/>
  {/if}

  {#if reviewMode}
    <button on:click={() => {
      reviewMode = '';
    }}>Go back!</button>
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
</style>