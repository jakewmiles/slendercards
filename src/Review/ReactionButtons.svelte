<script>
  export let data, cardIndex, frontSide, flipped;

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

<div class='flashcard-reaction-buttons'>
  <button on:click={() => {
    updateFlashcardScore(data[cardIndex]._id, 0)
    cardIndex++;
    frontSide = true;
    flipped = false;
  }}>😭</button>
  <button on:click={() => {
    updateFlashcardScore(data[cardIndex]._id, 1)
    cardIndex++;
    frontSide = true;
    flipped = false;
  }}>😐</button>
  <button on:click={() => {
    updateFlashcardScore(data[cardIndex]._id, 3)
    cardIndex++;
    frontSide = true;
    flipped = false;
  }}>😄</button>
</div>

<style>
  .flashcard-reaction-buttons {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-end;
    font-size: 200%;
  }
</style>