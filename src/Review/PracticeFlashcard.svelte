<script>
  export let promisedData;
  let cardIndex = 0;
  let frontSide = true;

  const updateFlashcardScore = async (id, value) => {
    await fetch(`http://localhost:3000/flashcards/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        incValue: value,
      })
    });
  }

  const flip = ({delay = 0, duration = 500}) => {
    return {
      delay,
      duration,
      css: (u) => `transform: rotateY(${1 - (u * 180)}deg);
                  opacity: ${1 - u};`
    };
  }

</script>

<main>
  {#await promisedData}
  <p>awaiting data...</p>
  {:then data}
    {#if !data.length}
      <p>No cards to display! Create some cards fast!</p>
    {/if}
    {#if data.length}
      {#if cardIndex < 5}
        {#key cardIndex}
        <div class='flashcard-container' on:click={() => frontSide = !frontSide}>
          <div class='flashcard'>
            {#if frontSide}
            <div transition:flip class='side'>
              <h1>Card {cardIndex+1}/5</h1>
              <h3>Source: {data[cardIndex].srcLang}</h3>
              <h4>{data[cardIndex].srcSentence}</h4>
            </div>
            {:else}
            <div transition:flip class='side back'>
              <h1>Card {cardIndex+1}/5</h1>
              <h3>Target: {data[cardIndex].targLang}</h3>
              <h4>{data[cardIndex].targSentence}</h4>
            </div>
            {/if}
          </div>
        </div>
        {/key}
        <div class='flashcard-reaction-buttons'>
          <button on:click={() => {
            updateFlashcardScore(data[cardIndex]._id, 1)
            cardIndex++;
            frontSide = true;
          }}>😭</button>
      <button on:click={() => {
        updateFlashcardScore(data[cardIndex]._id, 2)
        cardIndex++;
        frontSide = true;
      }}>😐</button>
      <button on:click={() => {
        updateFlashcardScore(data[cardIndex]._id, 3)
        cardIndex++;
        frontSide = true;
      }}>😄</button>
    </div>
    {/if}
  {/if}
  {#if cardIndex > 4}
    <h1>Round of cards finished!</h1>
  {/if}
  {:catch error}
  <p>Error!</p>
  {/await}
</main>

<style>
  main {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 1em;
    max-width: 800px;
    margin: 0 auto;
  }

  .flashcard-reaction-buttons {
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    font-size: 50px;
  }

  .flashcard-container {
    position: relative;
		margin: 50px;
  	width: 600px;
		height: 400px;
    perspective: 600;
  }

  .flashcard {
    width: 100%;
    height: 100%;
    position: absolute;
    perspective: 600;
  }

  .side {
    position: absolute;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
  	background-color: #d2661e;
    color: #000000;
    border-radius: 0.5rem;
		border-left: 0.4rem solid #000000;
	}

  .back {
  	background-color: #000000;
    color: #d2661e;
		border-right: 0.4rem solid #d2661e;
	}
</style>