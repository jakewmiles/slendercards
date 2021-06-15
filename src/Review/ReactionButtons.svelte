<script>
  import { fly, fade } from 'svelte/transition';
  export let data, cardIndex, frontSide, flipped;
  let sadVisible, medVisible, happyVisible = false;
  
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

<div id='flashcard-reaction-buttons'>
  <div class='reaction'>
    <button on:click={() => {
      updateFlashcardScore(data[cardIndex]._id, 3)
      happyVisible = true;
      setTimeout(() => {
        cardIndex++;
        frontSide = true;
        flipped = false;
      }, 500)
    }}>😄</button>
    {#if happyVisible}
      <p in:fade out:fly={{y: -100, duration: 300}}>+3</p>
    {/if}
  </div>
  <div class='reaction'>
    <button on:click={() => {
      updateFlashcardScore(data[cardIndex]._id, 1);
      medVisible = true;
      setTimeout(() => {
        cardIndex++;
        frontSide = true;
        flipped = false;
      }, 500)
    }}>😐</button>
    {#if medVisible}
      <p in:fade out:fly={{y: -100, duration: 300}}>+1</p>
    {/if}
  </div>
  <div class='reaction'>
    <button on:click={() => {
      updateFlashcardScore(data[cardIndex]._id, 0)
      sadVisible = true;
      setTimeout(() => {
        cardIndex++;
        frontSide = true;
        flipped = false;
      }, 500)
    }}>😭</button>
    {#if sadVisible}
      <p in:fade out:fly={{y: -100, duration: 300}}>0</p>
    {/if}
  </div>
</div>

<style>
  #flashcard-reaction-buttons {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    font-size: 200%;
  }
  button {
    background-color: transparent;
    border: none;
    text-align: center;
    font-size: 50px;
  }
  .reaction {
    display: flex;
    height: 100px;
  }
</style>