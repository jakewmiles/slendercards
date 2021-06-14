<script>
  export let flashcardData;
  export let filteredFlashcards;
  let srcLangSearch = '';
  let srcSentenceSearch = '';
  let targLangSearch = '';
  let targSentenceSearch = '';
  $: filteredList = filteredFlashcards = flashcardData.filter(flashcard => {
    return flashcard.srcLang.toLowerCase().indexOf(srcLangSearch.toLowerCase()) !== -1 && 
    flashcard.srcSentence.toLowerCase().indexOf(srcSentenceSearch.toLowerCase()) !== -1 && 
    flashcard.targLang.toLowerCase().indexOf(targLangSearch.toLowerCase()) !== -1 && 
    flashcard.targSentence.toLowerCase().indexOf(targSentenceSearch.toLowerCase()) !== -1});
  
  const removeFlashcard = async (i, id) => {
    await fetch(`http://localhost:3000/flashcards/${id}`, {
      method: 'DELETE',
    });
    flashcardData = [...flashcardData.slice(0, i), ...flashcardData.slice(i + 1)];
    location.reload();
  }
</script>

<main>

  <h3>{flashcardData.length} cards currently saved in the database</h3>
  <h4>Filtered {filteredFlashcards.length}/{flashcardData.length} cards</h4>
  <div id='table-wrapper'>
    <div id='database-table'>
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
  </div>
</main>
    
<style>
  main {
    height: 50%;
    overflow-y: scroll;
  }

  #table-wrapper {
    position:relative;
  }

  #table-wrapper table {
    width:100%;
  }

  #table-wrapper table thead {
    top:-20px;
    z-index:2;
    height:20px;
  }

  #database-table {
    height:300px;
    overflow:auto;  
    margin-top:40px;
  }

  table, tr {
    width: 100%;
    border: 1px solid white;
    overflow-y: scroll;
  }

  .delete-button {
    background-color: transparent;
    border: none;
    text-align: center;
    font-size: 24px;
  }

  input {
    width: 100%;
  }
</style>