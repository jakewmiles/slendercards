<script>
  export let promisedData;
  let cardIndex = 0;
  console.log(promisedData);
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
</script>

<main>
  {#await promisedData}
  <p>awaiting data...</p>
  {:then data}
    {#if cardIndex < 5}
      {#key cardIndex}
        {#if frontSide}
          <div class='flashcard-body-front' on:click={() => {
            frontSide = !frontSide;
          }}>
            <h1>Card {cardIndex+1}/5</h1>
            <h3>Source: {data[cardIndex].srcLang}</h3>
            <h4>{data[cardIndex].srcSentence}</h4>
          </div>
        {:else}
          <div class='flashcard-body-back' on:click={() => {
            frontSide = !frontSide;
          }}>
            <h1>Card {cardIndex+1}/5</h1>
            <h3>Target: {data[cardIndex].targLang}</h3>
            <h4>{data[cardIndex].targSentence}</h4>
          </div>
        {/if}
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
  {:catch error}
  <p>Error!</p>
  {/await}
</main>

<style>
  main {
    display: flex;
    text-align: center;
    padding: 1em;
    max-width: 800px;
    margin: 0 auto;
  }

  .flashcard-reaction-buttons {
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-size: 50px;
  }

  .flashcard-body-front {
		margin: 10px;
  	width: 400px;
		height: 400px;
		overflow: scroll;
  	box-shadow: 0 15px 30px 0 rgba(0,0,0,0.11),
    						0 5px 15px 0 rgba(0,0,0,0.08);
  	background-color: #ffffff;
  	border-radius: 0.5rem;
		border-left: 0.5rem solid #ff6600;
	}

  .flashcard-body-back {
		margin: 10px;
  	width: 400px;
		height: 400px;
		overflow: scroll;
  	box-shadow: 0 15px 30px 0 rgba(0,0,0,0.11),
    						0 5px 15px 0 rgba(0,0,0,0.08);
  	background-color: #ffffff;
  	border-radius: 0.5rem;
		border-right: 0.5rem solid #ff6600;
	}
</style>