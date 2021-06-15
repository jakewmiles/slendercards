<script>
  export let practiceMode, numberOfCards, filteredFlashcards;

</script>

<main>
  <div id='practice-session-selector'>
    <div id='card-quantity-selector'>
      <label for='number-of-cards'>How many cards would you like to review? (1-10)</label>
      <input type='number' id='number-of-cards' name='number-of-cards' min='1' max='10' onkeydown="return false;" bind:value={numberOfCards}>
      <button class='animated-button review-start' on:click={() => {
        if (!filteredFlashcards.length) return;
        practiceMode = !practiceMode;
      }}>Begin</button> 
    </div>
    <div id='session-preview'>
      <p>Review session of {numberOfCards} {numberOfCards === 1 ? 'card' : 'cards'} </p>
      {#if numberOfCards > filteredFlashcards.length && filteredFlashcards.length > 0}
        <p style='color: red'>Note that you will only be shown {filteredFlashcards.length} {filteredFlashcards.length === 1 ? 'card' : 'cards'} </p>
      {/if}
    </div>
  </div>
</main>

    

<style>
  main {
    margin-top: 10px;
    border: 1px solid white;
    padding: 25px;
    height: 130px;
  }

  input {
    margin-top: 5px;
		background-color: rgb(50, 50, 50);
		color: #FFF;
	}

	input::placeholder {
		color: #FFF;
	}

  .review-start {
    z-index: 2;
    border-radius: 20px;
    height: 40px;
    width: 120px;
    transition: all 0.15s ease;
    overflow: hidden;
  }
  .review-start:after {
    position: absolute;
    content: " ";
    z-index: -1;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: all 0.15s ease;
  }
  .review-start:hover {
    color: #000;
  }
  .review-start:hover:after {
    -webkit-transform: scale(1) rotate(180deg);
    transform: scale(1) rotate(180deg);
    background: #FFF;
  }

  #practice-session-selector {
    display: flex;
    height: 80px;
    grid-template-rows: 1fr 1fr;
    grid-template-columns: 1fr 1fr;
  }

  #card-quantity-selector {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    width: 60%;
    height: 140px;
  }

  #session-preview > p {
    min-width: 350px;
    margin-left: 25px;
    text-align: center;
    font-size: 16px;
    display: flex;
    flex-direction: column;
  }

  label {
    width: 325px;
  }
</style>