<script>
  import { fade } from 'svelte/transition';
  export let flashcardData;
  let searchTerm = '';

  const removeFlashcard = async (id) => {
    await fetch(`http://localhost:3000/flashcards/${id}`, {
      method: 'DELETE',
    });
  }
</script>

<div class='database-table'>
  Filter: <input bind:value={searchTerm} />
  <table>
    <thead>
      <tr>
        <th>srcLang</th>
        <th>srcSentence</th>
        <th>targLang</th>
        <th>targSentence</th>
        <th>overallScore</th>
      </tr>
    </thead>
    <!-- {#if visible} -->
    {#each flashcardData as sentence} 
    <tbody>
      <tr transition:fade>
        <td>{sentence.srcLang}</td>
        <td>{sentence.srcSentence}</td>
        <td>{sentence.targLang}</td>
        <td>{sentence.targSentence}</td>
        <td>{sentence.overallScore}</td>
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

<style>
  .database-table {
    overflow-y: auto;
  }

  table, tr {
    width: 100%;
    border: 1px solid white;
  }

  .delete-button {
    background-color: transparent;
    border: none;
    text-align: center;
    font-size: 30px;
  }
</style>