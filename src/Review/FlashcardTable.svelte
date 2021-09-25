<script>
  export let flashcardData;
  export let filteredFlashcards;
  let srcLangSearch = "";
  let srcSentenceSearch = "";
  let targLangSearch = "";
  let targSentenceSearch = "";
  let overallScoreSearch = "";
  $: filteredList = filteredFlashcards = flashcardData.filter((flashcard) => {
    return (
      flashcard.srcLang.toLowerCase().indexOf(srcLangSearch.toLowerCase()) !==
        -1 &&
      flashcard.srcSentence
        .toLowerCase()
        .indexOf(srcSentenceSearch.toLowerCase()) !== -1 &&
      flashcard.targLang.toLowerCase().indexOf(targLangSearch.toLowerCase()) !==
        -1 &&
      flashcard.targSentence
        .toLowerCase()
        .indexOf(targSentenceSearch.toLowerCase()) !== -1 &&
      flashcard.overallScore >= overallScoreSearch
    );
  });

  const removeFlashcard = async (i, id) => {
    await fetch(`http://localhost:3000/flashcards/${id}`, {
      method: "DELETE",
    });
    flashcardData = [
      ...flashcardData.slice(0, i),
      ...flashcardData.slice(i + 1),
    ];
    // location.reload();
  };

  const languages = {
    English: "🇬🇧",
    German: "🇩🇪",
    Spanish: "🇪🇸",
    French: "🇫🇷",
    Italian: "🇮🇹",
    Polish: "🇵🇱",
    Russian: "🇷🇺",
    Portuguese: "🇵🇹",
    Japanese: "🇯🇵",
    Chinese: "🇨🇳",
  };
</script>

<main>
  <h3>(Optional) filter cards before starting a review session</h3>
  <div id="table-wrapper">
    <div id="database-table">
      <table>
        <thead>
          <tr>
            <th id="src-lang-input"
              ><input bind:value={srcLangSearch} placeholder="Source" /></th
            >
            <th id="src-sentence-input"
              ><input
                bind:value={srcSentenceSearch}
                placeholder="Sentence"
              /></th
            >
            <th id="targ-lang-input"
              ><input bind:value={targLangSearch} placeholder="Target" /></th
            >
            <th id="targ-sentence-input"
              ><input
                bind:value={targSentenceSearch}
                placeholder="Sentence"
              /></th
            >
            <th id="score-input"
              ><input
                bind:value={overallScoreSearch}
                placeholder="Min. score"
              /></th
            >
            <th />
          </tr>
        </thead>
        {#key flashcardData}
          {#each filteredList as sentence, i}
            <tbody>
              <tr>
                <td>{languages[sentence.srcLang]}</td>
                <td class="src-sentence">{sentence.srcSentence}</td>
                <td>{languages[sentence.targLang]}</td>
                <td class="targ-sentence">{sentence.targSentence}</td>
                <td>{sentence.overallScore}</td>
                <td
                  ><button
                    class="delete-button"
                    on:click={() => {
                      removeFlashcard(i, sentence._id);
                    }}>❌</button
                  ></td
                >
              </tr>
            </tbody>
          {/each}
        {/key}
      </table>
    </div>
  </div>
  <p>Showing {filteredFlashcards.length}/{flashcardData.length} cards</p>
</main>

<style>
  main {
    height: 50%;
    overflow-y: scroll;
    border: 1px solid white;
  }
  h3 {
    margin-top: 5px;
    margin-bottom: 0px;
  }
  #src-lang-input {
    width: 70px;
  }
  #targ-lang-input {
    width: 70px;
  }
  #src-sentence-input {
    width: 235px;
  }
  #targ-sentence-input {
    width: 235px;
  }
  #score-input {
    width: 90px;
  }
  input {
    background-color: rgb(50, 50, 50);
    color: #fff;
  }
  .src-sentence {
    font-size: 16px;
  }
  input::placeholder {
    color: #fff;
  }

  #table-wrapper {
    position: relative;
  }

  #table-wrapper table {
    width: 100%;
  }

  #table-wrapper table thead {
    z-index: 2;
    height: 20px;
  }

  th {
    position: sticky;
    top: 0;
    background-color: rgb(30, 30, 30);
  }

  #database-table {
    height: 300px;
    overflow: auto;
    margin-top: 20px;
  }

  table,
  tr {
    margin-top: 0;
    width: 100%;
    overflow-y: scroll;
  }

  .delete-button {
    background-color: transparent;
    border: none;
    text-align: center;
    font-size: 24px;
    cursor: pointer;
  }

  input {
    width: 100%;
  }
</style>
