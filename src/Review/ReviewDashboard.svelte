<script>
  import FlashcardTable from './FlashcardTable.svelte';
  import PracticeFlashcard from './PracticeFlashcard.svelte';
  import ReviewSessionCreator from './ReviewSessionCreator.svelte';

  const fetchAllFlashcards = async () => {
    const response = await fetch('http://localhost:3000/flashcards')
    const data = await response.json();
    return data;
  };

  const reloadDb = () => {
    location.reload();
  }

  let practiceMode = false;
  let numberOfCards = 5;
  let filteredFlashcards = fetchAllFlashcards();
  
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
        <ReviewSessionCreator bind:practiceMode={practiceMode} bind:numberOfCards={numberOfCards} {filteredFlashcards}/>
        <div id='flashcard-table'>
          <FlashcardTable flashcardData={data} bind:filteredFlashcards={filteredFlashcards}/>
        </div>
      {/if}
    {:catch error}
      <p>An error occurred! {error}</p>
    {/await}
  {/if}
      
  {#if practiceMode}
    <PracticeFlashcard {filteredFlashcards} {numberOfCards} />
    <button on:click={() => {
      practiceMode = !practiceMode;
      reloadDb();
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

  #flashcard-table {
    overflow-y: scroll;
  }
</style>