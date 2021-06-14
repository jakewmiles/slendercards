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
        <div id='flashcard-table'>
          <FlashcardTable flashcardData={data} bind:filteredFlashcards={filteredFlashcards}/>
        </div>
        <ReviewSessionCreator bind:practiceMode={practiceMode} bind:numberOfCards={numberOfCards} {filteredFlashcards}/>
      {/if}
    {:catch error}
      <p>An error occurred! {error}</p>
    {/await}
  {/if}
      
  {#if practiceMode}
    <PracticeFlashcard {filteredFlashcards} {numberOfCards} />
    <button class='animated-button return-button' on:click={() => {
      practiceMode = !practiceMode;
      reloadDb();
      }}>Go back!</button>
  {/if}    
</main>

<style>
  main {
    text-align: center;
    padding: 1%;
    max-width: 800px;
    margin: 0 auto;
  }

  .return-button {
    z-index: 2;
    width: 120px;
    transition: all 0.15s ease;
    overflow: hidden;
  }
  .return-button:after {
    position: absolute;
    content: " ";
    z-index: -1;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: all 0.15s ease;
  }
  .return-button:hover {
    color: #000;
  }
  .return-button:hover:after {
    -webkit-transform: scale(1) rotate(180deg);
    transform: scale(1) rotate(180deg);
    background: #FFF;
  }

  
</style>