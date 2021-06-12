<script>
  export let flashcardData, practiceMode, numberOfCards;
</script>

<div id='practice-session-selector'>
  <div id='card-quantity-selector'>
    <label for='number-of-cards'>How many cards would you like to review? (1-10)</label>
    <input type='number' id='number-of-cards' name='number-of-cards' min='1' max='10' bind:value={numberOfCards}>
  </div>
  <button id='review-start' on:click={() => {
    practiceMode = !practiceMode;
  }}>➡️</button> 
      <div id='session-preview'>
        <p>Review session of {numberOfCards} {numberOfCards === 1 ? 'card' : 'cards'} </p>
        {#if numberOfCards > flashcardData.length}
        <p style='color: red'>Note that you will only be shown {flashcardData.length} cards</p>
        {/if}
      </div>
    </div>


<style>
    #review-start {
    background-color: transparent;
    border: none;
    text-align: center;
    font-size: 30px;
  }

  #practice-session-selector {
    display: grid;
    height: 80px;
    grid-template-columns: 0.5fr 0.5fr 2fr;
  }

  #card-quantity-selector {
    display: flex;
    flex-direction: column;
  }

  #session-preview > p {
    margin: 0;
    text-align: left;
    font-size: 16px;
    padding: 10px;
    display: flex;
    flex-direction: column;
  }
</style>