<script>
  export let flashcardData;
  let srcLangSearch = '';
  let srcSentenceSearch = '';
  let targLangSearch = '';
  let targSentenceSearch = '';
  $: filteredList = flashcardData.filter(flashcard => flashcard.srcLang.toLowerCase().indexOf(srcLangSearch.toLowerCase()) !== -1 && flashcard.srcSentence.toLowerCase().indexOf(srcSentenceSearch.toLowerCase()) !== -1 && flashcard.targLang.toLowerCase().indexOf(targLangSearch.toLowerCase()) !== -1 && flashcard.targSentence.toLowerCase().indexOf(targSentenceSearch.toLowerCase()) !== -1);
  
  const removeFlashcard = async (i, id) => {
    await fetch(`http://localhost:3000/flashcards/${id}`, {
      method: 'DELETE',
    });
    flashcardData = [...flashcardData.slice(0, i), ...flashcardData.slice(i + 1)];
    location.reload();
  }
</script>

<h3>{flashcardData.length} cards currently saved</h3>
<div class='database-table'>
  <table>
    <thead>
      <tr>
        <th><input bind:value={srcLangSearch} placeholder="L1" /></th>
        <th><input bind:value={srcSentenceSearch} placeholder="Sentence"/></th>
        <th><input bind:value={targLangSearch} placeholder="L2"/></th>
        <th><input bind:value={targSentenceSearch} placeholder="Sentence"/></th>
        <th>overallScore</th>
      </tr>
    </thead>
    {#key flashcardData}
      {#each filteredList as sentence, i} 
        <tbody>
          <tr>
            <td>{sentence.srcLang}</td>
            <td>{sentence.srcSentence}</td>
            <td>{sentence.targLang}</td>
            <td>{sentence.targSentence}</td>
            <td>{sentence.overallScore}</td>
            <td><button class='delete-button' on:click={() => {
              removeFlashcard(i, sentence._id);
            }}>❌</button></td>
          </tr>
        </tbody>
      {/each}
    {/key}
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

  input {
    width: 100%;
  }
</style>