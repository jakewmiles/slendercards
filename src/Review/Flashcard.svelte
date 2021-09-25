<script>
  import TtsAudioPlayer from "./TtsAudioPlayer.svelte";
  export let cardIndex, data, flipped, frontSide;

  const flip = ({ delay = 0, duration = 350 }) => {
    return {
      delay,
      duration,
      css: (u) => `transform: rotateY(${1 - u * 180}deg);
      opacity: ${1 - u};`,
    };
  };
  import { languages } from "../languages";
</script>

<div
  class="flashcard"
  on:click={() => {
    frontSide = !frontSide;
    flipped = true;
  }}
>
  {#if frontSide}
    <div transition:flip class="side">
      <h1 class="lang">{languages[data[cardIndex].srcLang]}</h1>
      <h2 class="sentence">{data[cardIndex].srcSentence}</h2>
      <TtsAudioPlayer src={data[cardIndex].srcTTS} />
    </div>
  {:else}
    <div transition:flip class="side back">
      <h1 class="lang">{languages[data[cardIndex].targLang]}</h1>
      <h2 class="sentence">{data[cardIndex].targSentence}</h2>
      <TtsAudioPlayer src={data[cardIndex].targTTS} />
    </div>
  {/if}
</div>

<style>
  h1 {
    font-size: 60px;
    margin: 0;
  }

  h2 {
    font-size: 24px;
    margin: 0;
  }

  .flashcard {
    display: grid;
    grid-template-rows: 0.1fr 0.9fr;
    position: relative;
    margin: 50px;
    min-width: 300px;
    max-width: 300px;
    height: 400px;
    perspective: 600;
  }

  .lang {
    grid-row: 1;
  }

  .sentence {
    grid-row: 2;
  }

  .side {
    position: absolute;
    padding: 0 10px 0 10px;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
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
