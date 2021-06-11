<script>
  export let data, cardIndex, frontSide;

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

<style>
  .flashcard-reaction-buttons {
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    font-size: 50px;
  }
</style>